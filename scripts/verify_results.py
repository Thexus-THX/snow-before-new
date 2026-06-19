#!/usr/bin/env python3
"""验证处理结果的快速诊断脚本"""
import sys
from pathlib import Path
try:
    from PIL import Image
except ImportError:
    print("需要 Pillow: pip install Pillow")
    sys.exit(1)

UI_DIR = Path(__file__).resolve().parent.parent / "public" / "assets" / "ui"

files = [
    "ui_top_status_bar",
    "ui_dialogue_panel",
    "ui_choice_normal",
    "ui_choice_critical",
    "ui_choice_hover",
    "ui_choice_locked",
    "ui_game_logo",
    "ui_history_panel",
    "ui_letter_paper",
    "ui_historical_event_frame",
    "ui_season_journal_panel",
    "ui_status_panel_expanded",
]

print("=" * 70)
print("验证处理结果")
print("=" * 70)

for stem in files:
    orig = UI_DIR / f"{stem}.png"
    trans = UI_DIR / f"{stem}_transparent.png"
    prev = UI_DIR / f"{stem}_preview.png"

    if not trans.exists():
        print(f"\n[SKIP] {stem} - 无处理输出")
        continue

    # 原始文件信息
    orig_img = Image.open(orig)
    orig_mode = orig_img.mode
    orig_size = orig_img.size

    # 处理文件信息
    trans_img = Image.open(trans)
    trans_mode = trans_img.mode
    trans_size = trans_img.size

    # 统计 alpha
    pixels = trans_img.load()
    w, h = trans_size
    alpha_zero = 0
    edge_transparent = 0
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] == 0:
                alpha_zero += 1
                # 检查是否在边缘（距边缘 5px 内）
                if x < 5 or x >= w - 5 or y < 5 or y >= h - 5:
                    edge_transparent += 1

    pct = alpha_zero / (w * h) * 100

    size_match = "OK" if trans_size == orig_size else f"MISMATCH! {trans_size} vs {orig_size}"
    mode_match = "OK" if trans_mode == "RGBA" else f"MISMATCH! {trans_mode}"

    print(f"\n[{stem}]")
    print(f"  原始: {orig_size} {orig_mode}")
    print(f"  输出: {trans_size} {trans_mode}")
    print(f"  尺寸一致: {size_match}  模式: {mode_match}")
    print(f"  Alpha=0 像素: {alpha_zero} ({pct:.1f}%)")
    print(f"  边缘透明像素: {edge_transparent}")

    # 快速判断
    if pct < 3:
        print(f"  [INFO] 透明比例很低，可能不是棋盘格背景素材")
    elif pct > 90:
        print(f"  [WARN] 透明比例极高，请确认预览图中 UI 元素是否完整")
    elif edge_transparent == 0:
        print(f"  [WARN] 边缘没有透明像素，棋盘格可能未在边缘")

print(f"\n{'='*70}")
print("请查看 *_preview.png（黑色背景）确认效果。")
print("若效果正确，手动替换原文件或重命名。")
