#!/usr/bin/env python3
"""红线检查：根据 git 改动判断是否触及 AGENTS.md §2 的红线。

不依赖 agent 自觉遵守，可以在交付前、pre-commit 或 CI 里运行。
只检查能从文件改动机械判断的红线：
  - 依赖清单被修改（可能引入新依赖）
  - 新建/删除/重命名的文件不在 COGNITION.md 的文件清单里
  - 碰到密钥、凭据类文件
接口契约有没有被破坏、数据流有没有偏离，仍需人工审查 diff。

用法：
  python scripts/check_redlines.py              # 对比 HEAD（含未暂存和未跟踪文件）
  python scripts/check_redlines.py --base main  # 对比某个分支或提交
退出码：0 = 未触及红线；1 = 触及红线；2 = 运行错误
"""
import argparse
import fnmatch
import subprocess
import sys
from pathlib import PurePosixPath

DEP_MANIFESTS = {
    "package.json", "pnpm-lock.yaml", "yarn.lock", "package-lock.json",
    "requirements.txt", "pyproject.toml", "poetry.lock", "uv.lock", "Pipfile",
    "Cargo.toml", "go.mod", "pom.xml", "build.gradle", "build.gradle.kts",
    "Gemfile", "composer.json",
}
SECRET_PATTERNS = [".env", ".env.*", "*.pem", "*.key", "id_rsa*", "*credentials*", "*secret*"]
IGNORED_PREFIXES = ("docs/", ".agents/", ".trae/", ".claude/")
COGNITION = "docs/plans/COGNITION.md"


def classify(entries, cognition_text):
    """entries: [(status, path)]，status 为 A/M/D/R 等 git 状态首字母。返回问题列表。"""
    problems = []
    for status, path in entries:
        name = PurePosixPath(path).name
        if name in DEP_MANIFESTS or fnmatch.fnmatch(name, "requirements*.txt"):
            problems.append(f"[依赖] {path} 被修改，确认是否引入了新依赖")
        if any(fnmatch.fnmatch(name.lower(), p) for p in SECRET_PATTERNS):
            problems.append(f"[凭据] {path} 看起来是密钥或凭据文件")
        if status in ("A", "D", "R") and not path.startswith(IGNORED_PREFIXES):
            if cognition_text is None:
                problems.append(f"[结构] {path}（{status}）：找不到 {COGNITION}，无法核对文件清单")
            elif path not in cognition_text and name not in cognition_text:
                action = {"A": "新建", "D": "删除", "R": "重命名"}[status]
                problems.append(f"[结构] {action} {path}，不在 COGNITION.md 的文件清单里")
    return problems


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True,
                          encoding="utf-8", check=True).stdout


def collect(base):
    entries = []
    for line in git("diff", "--name-status", "-M", base).splitlines():
        parts = line.split("\t")
        status = parts[0][0]
        entries.append((status, parts[-1].replace("\\", "/")))
    for path in git("ls-files", "--others", "--exclude-standard").splitlines():
        entries.append(("A", path.replace("\\", "/")))
    return entries


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--base", default="HEAD", help="对比基准（分支或提交），默认 HEAD")
    args = ap.parse_args()
    try:
        entries = collect(args.base)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"无法读取 git 改动：{e}", file=sys.stderr)
        return 2
    try:
        with open(COGNITION, encoding="utf-8") as f:
            cognition_text = f.read()
    except FileNotFoundError:
        cognition_text = None
    problems = classify(entries, cognition_text)
    if not problems:
        print(f"未触及红线（检查了 {len(entries)} 个改动文件）")
        return 0
    print("触及红线，需要回到规划或由人类确认：")
    for p in problems:
        print("  - " + p)
    return 1


if __name__ == "__main__":
    sys.exit(main())
