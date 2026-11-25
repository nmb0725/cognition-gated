#!/usr/bin/env python3
"""接口契约检查：用 COGNITION.md 的「接口契约」表核对代码，让契约可以执行。

检查两件事：
  1. 正向：契约表里的每个名字，在「定义方」里确实有定义，在「引用方」里确实被用到
  2. 反向：跨文件共用的 DOM ID / CSS 类（HTML 里定义、CSS 或 JS 里使用）必须登记在契约表里；
     JS/CSS 引用了 HTML 里不存在的 ID/类、HTML 引用了不存在的本地文件，都算错误

契约表格式（列顺序固定，表头文字随意）：
  | 类别 | 名称 | 定义方 | 引用方 | 说明 |
类别按关键词识别：含「ID」→ DOM ID；含「类」→ CSS 类；含「路径」→ 文件路径；
含「导出」「全局」「函数」→ JS 符号。其他类别（例如「数据结构」）只提示需要人工核对。
定义方、引用方填文件路径（相对项目根目录），多个用逗号或顿号分隔。

用法：
  python scripts/check_contract.py                                   # 默认 docs/plans/COGNITION.md
  python scripts/check_contract.py examples/tetris/docs/plans/COGNITION.md
项目根目录默认取 COGNITION.md 往上两级（<根>/docs/plans/COGNITION.md），可用 --root 指定。
退出码：0 = 通过；1 = 有错误；2 = 运行错误
"""
import argparse
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "docs", ".agents", ".trae", ".claude", "dist", "build"}
IDENT = r"[A-Za-z_$][\w$]*"


def strip_code(cell):
    return cell.strip().strip("`").strip()


def split_files(cell):
    return [strip_code(p) for p in re.split(r"[,，、;；]", cell) if strip_code(p) and strip_code(p) != "—"]


def parse_contract(text):
    m = re.search(r"^##[^\n]*接口契约[^\n]*\n(.*?)(?=^##\s|\Z)", text, re.M | re.S)
    if not m:
        return None
    rows = []
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 4 or re.fullmatch(r"[:\-\s]*", cells[0]) or cells[0] in ("类别", "Kind"):
            continue
        rows.append({"kind": cells[0], "name": strip_code(cells[1]),
                     "definers": split_files(cells[2]), "users": split_files(cells[3])})
    return rows


class HtmlScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.classes, self.refs = set(), set(), []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        if a.get("class"):
            self.classes.update(a["class"].split())
        for key in ("src", "href"):
            v = a.get(key)
            if v and not re.match(r"^(https?:|data:|mailto:|#|//)", v):
                self.refs.append(v.split("?")[0].split("#")[0])


def css_selectors(text):
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    sels = " ".join(m.group(1) for m in re.finditer(r"([^{}]+)\{[^{}]*\}", text))
    ids = set(re.findall(r"#(-?[_a-zA-Z][\w-]*)", sels))
    classes = set(re.findall(r"\.(-?[_a-zA-Z][\w-]*)", sels))
    return ids, classes


def js_dom_refs(text):
    ids = set(re.findall(r"getElementById\(\s*['\"]([\w-]+)['\"]", text))
    ids |= set(re.findall(r"querySelector(?:All)?\(\s*['\"]#([\w-]+)['\"]", text))
    classes = set(re.findall(r"querySelector(?:All)?\(\s*['\"]\.([\w-]+)['\"]", text))
    classes |= set(re.findall(r"getElementsByClassName\(\s*['\"]([\w-]+)['\"]", text))
    classes |= set(re.findall(r"classList\.(?:add|remove|toggle|contains)\(\s*['\"]([\w-]+)['\"]", text))
    return ids, classes


def word(name):
    return re.compile(r"(?<![\w$-])" + re.escape(name) + r"(?![\w$-])")


class Checker:
    def __init__(self, root):
        self.root = root
        self.errors, self.notes, self.passed = [], [], 0
        self.cache = {}
        self.html, self.css, self.js = {}, {}, {}
        for p in sorted(root.rglob("*")):
            if not p.is_file() or any(part in SKIP_DIRS for part in p.relative_to(root).parts[:-1]):
                continue
            rel = p.relative_to(root).as_posix()
            if p.suffix in (".html", ".htm"):
                scan = HtmlScan()
                scan.feed(self.read(rel))
                self.html[rel] = scan
            elif p.suffix == ".css":
                self.css[rel] = css_selectors(self.read(rel))
            elif p.suffix in (".js", ".mjs"):
                self.js[rel] = js_dom_refs(self.read(rel))

    def read(self, rel):
        if rel not in self.cache:
            path = self.root / rel
            self.cache[rel] = path.read_text(encoding="utf-8") if path.is_file() else None
        return self.cache[rel]

    def need(self, rel, ok, what):
        text = self.read(rel)
        if text is None:
            self.errors.append(f"{what}：文件 {rel} 不存在")
            return
        if ok(rel, text):
            self.passed += 1
        else:
            self.errors.append(f"{what}：在 {rel} 中没找到")

    # ---- 正向检查 ----
    def check_row(self, row):
        kind, name = row["kind"], row["name"]
        label = f"[{kind}] {name}"
        if not row["definers"]:
            self.errors.append(f"{label}：没有填定义方")
        if "ID" in kind.upper():
            ident = name.lstrip("#")
            for f in row["definers"]:
                self.need(f, lambda r, t: (ident in self.html[r].ids) if r in self.html
                          else bool(re.search(r"id\s*=\s*['\"]" + re.escape(ident) + r"['\"]", t)), f"{label} 定义")
            for f in row["users"]:
                self.need(f, lambda r, t: bool(re.search(r"['\"#]" + re.escape(ident) + r"(?![\w-])", t)), f"{label} 引用")
        elif "类" in kind or "CLASS" in kind.upper():
            cls = name.lstrip(".")
            def has_class(r, t):
                if r in self.css:
                    return cls in self.css[r][1]
                if r in self.html:
                    return cls in self.html[r].classes
                return bool(word(cls).search(t))
            for f in row["definers"] + row["users"]:
                self.need(f, has_class, f"{label} {'定义' if f in row['definers'] else '引用'}")
        elif "路径" in kind or "PATH" in kind.upper():
            if not (self.root / name).is_file():
                self.errors.append(f"{label}：文件 {name} 不存在")
            else:
                self.passed += 1
            for f in row["definers"] + row["users"]:
                if f != name:
                    self.need(f, lambda r, t: name in t, f"{label} 引用")
        elif any(k in kind for k in ("导出", "全局", "函数")) or "EXPORT" in kind.upper():
            m = re.match(IDENT + r"(?:\." + IDENT + r")*", name)
            if not m:
                self.errors.append(f"{label}：名称无法识别为 JS 符号")
                return
            ident = m.group(0).split(".")[-1]
            decl = re.compile(r"(?:function\s*\*?\s*|(?:const|let|var|class)\s+)" + re.escape(ident) + r"(?![\w$])"
                              r"|[{,]\s*" + re.escape(ident) + r"\s*[,}:]"
                              r"|\." + re.escape(ident) + r"\s*=(?!=)")
            for f in row["definers"]:
                self.need(f, lambda r, t: bool(decl.search(t)), f"{label} 定义")
            for f in row["users"]:
                self.need(f, lambda r, t: bool(word(ident).search(t)), f"{label} 引用")
        else:
            self.notes.append(f"{label}：类别「{kind}」无法自动检查，需人工核对")

    # ---- 反向检查 ----
    def check_reverse(self, rows):
        declared_ids = {r["name"].lstrip("#") for r in rows if "ID" in r["kind"].upper()}
        declared_classes = {r["name"].lstrip(".") for r in rows if "类" in r["kind"] or "CLASS" in r["kind"].upper()}
        html_ids = set().union(*(s.ids for s in self.html.values())) if self.html else set()
        html_classes = set().union(*(s.classes for s in self.html.values())) if self.html else set()
        css_ids = set().union(*(v[0] for v in self.css.values())) if self.css else set()
        css_classes = set().union(*(v[1] for v in self.css.values())) if self.css else set()
        js_ids = set().union(*(v[0] for v in self.js.values())) if self.js else set()
        js_classes = set().union(*(v[1] for v in self.js.values())) if self.js else set()

        for i in sorted((html_ids & (css_ids | js_ids)) - declared_ids):
            self.errors.append(f"[反向] DOM ID #{i} 被多个文件共用，但没有登记在契约表里")
        for c in sorted((html_classes & (css_classes | js_classes)) - declared_classes):
            self.errors.append(f"[反向] CSS 类 .{c} 被多个文件共用，但没有登记在契约表里")
        for i in sorted(js_ids - html_ids):
            self.errors.append(f"[反向] JS 引用了 HTML 中不存在的 ID #{i}")
        for c in sorted(html_classes - css_classes - js_classes):
            self.errors.append(f"[反向] HTML 用了类 .{c}，但没有任何 CSS/JS 定义或使用它")
        for i in sorted(css_ids - html_ids):
            self.notes.append(f"[反向] CSS 选择器 #{i} 在 HTML 里找不到（若是动态生成可忽略）")
        for c in sorted(css_classes - html_classes - js_classes):
            self.notes.append(f"[反向] CSS 类 .{c} 在 HTML/JS 里找不到（若是动态生成可忽略）")
        for rel, scan in self.html.items():
            for ref in scan.refs:
                if not (self.root / rel).parent.joinpath(ref).resolve().is_file():
                    self.errors.append(f"[反向] {rel} 引用的本地文件 {ref} 不存在")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("cognition", nargs="?", default="docs/plans/COGNITION.md")
    ap.add_argument("--root", help="项目根目录，默认为 COGNITION.md 往上两级")
    args = ap.parse_args()
    cog = Path(args.cognition).resolve()
    if not cog.is_file():
        print(f"找不到 {cog}", file=sys.stderr)
        return 2
    root = Path(args.root).resolve() if args.root else cog.parent.parent.parent
    rows = parse_contract(cog.read_text(encoding="utf-8"))
    if not rows:
        print("COGNITION.md 里没有找到「接口契约」表（标题需包含“接口契约”）", file=sys.stderr)
        return 2
    checker = Checker(root)
    for row in rows:
        checker.check_row(row)
    checker.check_reverse(rows)
    print(f"契约 {len(rows)} 条，通过 {checker.passed} 项检查，项目根目录：{root}")
    for n in checker.notes:
        print("  提示 " + n)
    if checker.errors:
        print(f"发现 {len(checker.errors)} 个问题：")
        for e in checker.errors:
            print("  ✗ " + e)
        return 1
    print("✓ 契约一致")
    return 0


if __name__ == "__main__":
    sys.exit(main())
