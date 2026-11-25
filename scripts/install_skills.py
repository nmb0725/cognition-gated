#!/usr/bin/env python3
"""把 .agents/skills/ 下的 Skill 安装到指定项目和工具的 Skill 目录。

.agents/skills/ 是跨工具的通用位置，很多工具会直接读取。
只认自家目录的工具（比如 Trae 的 .trae/skills/），用本脚本复制过去。

用法：
  python scripts/install_skills.py <目标项目目录> [--tool agents|trae|claude] [--force]
示例：
  python scripts/install_skills.py D:/code/my-app --tool trae
同时会把 AGENTS.md、scripts/check_redlines.py 和 scripts/check_contract.py 复制到目标项目（已存在的文件不覆盖，除非加 --force）。
"""
import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOL_DIRS = {"agents": ".agents/skills", "trae": ".trae/skills", "claude": ".claude/skills"}


def copy(src: Path, dst: Path, force: bool):
    if dst.exists() and not force:
        print(f"跳过（已存在）：{dst}")
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.is_dir():
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    else:
        shutil.copy2(src, dst)
    print(f"已复制：{dst}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("target", help="目标项目根目录")
    ap.add_argument("--tool", choices=sorted(TOOL_DIRS), default="agents")
    ap.add_argument("--force", action="store_true", help="覆盖已存在的文件")
    args = ap.parse_args()
    target = Path(args.target).resolve()
    if not target.is_dir():
        print(f"目标目录不存在：{target}", file=sys.stderr)
        return 2
    for skill in sorted((ROOT / ".agents" / "skills").iterdir()):
        if (skill / "SKILL.md").is_file():
            copy(skill, target / TOOL_DIRS[args.tool] / skill.name, args.force)
    copy(ROOT / "AGENTS.md", target / "AGENTS.md", args.force)
    for script in ("check_redlines.py", "check_contract.py"):
        copy(ROOT / "scripts" / script, target / "scripts" / script, args.force)
    print("完成。记得修改目标项目 AGENTS.md 的 §7 项目命令和 §8 能力档映射。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
