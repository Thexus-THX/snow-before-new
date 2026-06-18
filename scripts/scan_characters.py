#!/usr/bin/env python3
"""扫描角色立绘文件属性"""
from pathlib import Path
from PIL import Image

CHARS_DIR = Path(__file__).resolve().parent.parent / "public" / "assets" / "characters"

for f in sorted(CHARS_DIR.glob("*.webp")):
    img = Image.open(f)
    print(f"{f.name}: {img.size} {img.mode}")

# 也检查是否有 png
for f in sorted(CHARS_DIR.glob("*.png")):
    img = Image.open(f)
    print(f"{f.name}: {img.size} {img.mode}")
