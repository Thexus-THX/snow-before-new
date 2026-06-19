#!/usr/bin/env python3
"""
《雪落之前》V1 — 假透明去除脚本 v2

处理 public/assets/ui/ (PNG) 和 public/assets/characters/ (WEBP) 中的图片，
识别并删除烘焙进图片的白灰棋盘格背景，转换为真正带 Alpha 通道的 RGBA PNG。

处理逻辑：
1. 读取图片 → RGBA 模式
2. 从四角和四边采样棋盘格颜色（白色 + 浅灰色两组）
3. 用颜色距离判断候选背景像素
4. Flood fill 从边缘连通区域，只处理与画布边缘连通的背景
5. 将选中区域 alpha 设为 0
6. 1-2px 去白边处理
7. 保留不与边缘连通的内部浅色区域

输出：
- <name>_transparent.png — RGBA 透明 PNG
- <name>_preview.png — 黑色背景预览图
- 原文件备份为 <name>.bak.<ext>
"""

import os
import sys
import math
import shutil
from pathlib import Path
from collections import deque

try:
    from PIL import Image
except ImportError:
    print("需要安装 Pillow: pip install Pillow")
    sys.exit(1)

# ============================================================
# 配置
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSET_DIRS = [
    PROJECT_ROOT / "public" / "assets" / "ui",
    PROJECT_ROOT / "public" / "assets" / "characters",
]

SAMPLE_BAND = 3
CHECKER_TOLERANCE = 55
DEFRINGE_RADIUS = 2

# ============================================================
# 工具函数
# ============================================================

def color_distance(c1, c2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])))


def sample_edge_colors(img, band=SAMPLE_BAND):
    w, h = img.size
    pixels = img.load()
    colors = set()
    # 四角
    for x in range(band):
        for y in range(band):
            colors.add(pixels[x, y][:3])
        for y in range(h - band, h):
            colors.add(pixels[x, y][:3])
    for x in range(w - band, w):
        for y in range(band):
            colors.add(pixels[x, y][:3])
        for y in range(h - band, h):
            colors.add(pixels[x, y][:3])
    # 四边
    for x in range(w):
        for y in range(band):
            colors.add(pixels[x, y][:3])
        for y in range(h - band, h):
            colors.add(pixels[x, y][:3])
    for y in range(h):
        for x in range(band):
            colors.add(pixels[x, y][:3])
        for x in range(w - band, w):
            colors.add(pixels[x, y][:3])
    return colors


def find_checkerboard_colors(edge_colors):
    if len(edge_colors) < 2:
        return None, None
    sorted_colors = sorted(edge_colors, key=lambda c: sum(c) / 3)
    bright_candidates = sorted_colors[-5:]
    dark_candidates = sorted_colors[:5]
    bright_avg = tuple(int(sum(c[i] for c in bright_candidates) / len(bright_candidates)) for i in range(3))
    dark_avg = tuple(int(sum(c[i] for c in dark_candidates) / len(dark_candidates)) for i in range(3))
    if color_distance(bright_avg, dark_avg) < 30:
        return bright_avg, dark_avg
    return bright_avg, dark_avg


def is_checkerboard_pixel(pixel_rgb, white_ref, gray_ref, tolerance=CHECKER_TOLERANCE):
    d_white = color_distance(pixel_rgb, white_ref)
    d_gray = color_distance(pixel_rgb, gray_ref)
    return d_white <= tolerance or d_gray <= tolerance


def create_alpha_mask(img, white_ref, gray_ref):
    w, h = img.size
    rgba = img.convert("RGBA")
    pixels = rgba.load()

    # Step 1: 标记候选棋盘格像素
    candidate = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if is_checkerboard_pixel((r, g, b), white_ref, gray_ref):
                candidate[y][x] = True

    # Step 2: 从边缘 flood fill
    visited = [[False] * w for _ in range(h)]
    q = deque()

    for x in range(w):
        if candidate[0][x] and not visited[0][x]:
            q.append((x, 0)); visited[0][x] = True
        if candidate[h - 1][x] and not visited[h - 1][x]:
            q.append((x, h - 1)); visited[h - 1][x] = True
    for y in range(h):
        if candidate[y][0] and not visited[y][0]:
            q.append((0, y)); visited[y][0] = True
        if candidate[y][w - 1] and not visited[y][w - 1]:
            q.append((w - 1, y)); visited[y][w - 1] = True

    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                if candidate[ny][nx] and not visited[ny][nx]:
                    visited[ny][nx] = True
                    q.append((nx, ny))

    # Step 3: alpha = 0
    transparent_count = 0
    for y in range(h):
        for x in range(w):
            if visited[y][x]:
                r, g, b, a = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)
                transparent_count += 1

    return rgba, transparent_count


def defringe_edges(img, radius=DEFRINGE_RADIUS):
    w, h = img.size
    pixels = img.load()

    edge_pixels = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 0:
                has_transparent = False
                for dx in range(-radius, radius + 1):
                    for dy in range(-radius, radius + 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            if pixels[nx, ny][3] == 0:
                                has_transparent = True; break
                    if has_transparent:
                        break
                if has_transparent:
                    edge_pixels.append((x, y))

    for x, y in edge_pixels:
        r_sum = g_sum = b_sum = count = 0
        for dx in range(-radius, radius + 1):
            for dy in range(-radius, radius + 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    nr, ng, nb, na = pixels[nx, ny]
                    if na > 0:
                        r_sum += nr; g_sum += ng; b_sum += nb; count += 1
        if count > 0:
            _, _, _, a = pixels[x, y]
            pixels[x, y] = (r_sum // count, g_sum // count, b_sum // count, a)
    return img


def create_preview(img):
    w, h = img.size
    bg = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    return Image.alpha_composite(bg, img)


# ============================================================
# 主流程
# ============================================================

def process_single_file(filepath):
    filename = filepath.name
    stem = filepath.stem
    ext = filepath.suffix.lower()
    result = {
        "file": filename,
        "original_size": None,
        "mode_before": None,
        "transparent_pixels": 0,
        "output_file": None,
        "preview_file": None,
    }

    print(f"\n{'='*60}")
    print(f"处理: {filename}")

    img = Image.open(filepath)
    result["original_size"] = img.size
    result["mode_before"] = img.mode
    print(f"  原始: {img.size}, {img.mode}")

    rgba_img = img.convert("RGBA")
    edge_colors = sample_edge_colors(rgba_img)
    print(f"  边缘颜色: {len(edge_colors)} 种")

    white_ref, gray_ref = find_checkerboard_colors(edge_colors)
    if white_ref is None or gray_ref is None:
        print(f"  [WARN] 未检测到棋盘格，跳过")
        return result

    print(f"  棋盘格参考: 亮组{white_ref}, 暗组{gray_ref}")

    processed, transparent_count = create_alpha_mask(rgba_img, white_ref, gray_ref)
    result["transparent_pixels"] = transparent_count
    pct = transparent_count / (img.size[0] * img.size[1]) * 100
    print(f"  透明像素: {transparent_count} ({pct:.1f}%)")

    if pct < 1:
        print(f"  [INFO] 透明比例极低，可能不是棋盘格背景，跳过")
        return result

    processed = defringe_edges(processed)

    # 备份
    bak_path = filepath.with_name(f"{stem}.bak{ext}")
    if not bak_path.exists():
        shutil.copy2(filepath, bak_path)
        print(f"  备份: {bak_path.name}")

    # 输出（统一为 PNG）
    out_path = filepath.parent / f"{stem}_transparent.png"
    processed.save(out_path, "PNG")
    result["output_file"] = str(out_path)
    print(f"  输出: {out_path.name} (RGBA, {processed.size})")

    # 预览
    preview = create_preview(processed)
    preview_path = filepath.parent / f"{stem}_preview.png"
    preview.save(preview_path, "PNG")
    result["preview_file"] = str(preview_path)
    print(f"  预览: {preview_path.name}")

    return result


def verify_output(filepath):
    img = Image.open(filepath)
    w, h = img.size
    pixels = img.load()
    alpha_zero = sum(1 for y in range(h) for x in range(w) if pixels[x, y][3] == 0)
    return {"is_rgba": img.mode == "RGBA", "alpha_zero_count": alpha_zero}


def main():
    print("=" * 60)
    print("《雪落之前》V1 — 假透明去除脚本 v2")
    print("=" * 60)

    all_files = []
    for d in ASSET_DIRS:
        if not d.exists():
            continue
        for ext in ("*.png", "*.webp"):
            for f in sorted(d.glob(ext)):
                if ("_transparent" not in f.stem and "_preview" not in f.stem
                        and not f.stem.endswith(".bak")):
                    all_files.append(f)

    print(f"\n找到 {len(all_files)} 个文件待处理")

    all_results = []
    for f in all_files:
        try:
            r = process_single_file(f)
            if r["output_file"]:
                all_results.append(r)
        except Exception as e:
            print(f"  [ERROR] {f.name}: {e}")

    # 汇总
    print(f"\n{'='*60}")
    print("处理汇总")
    print(f"{'='*60}")

    for r in all_results:
        pct = r["transparent_pixels"] / (r["original_size"][0] * r["original_size"][1]) * 100
        print(f"\n[FILE] {r['file']}")
        print(f"  原始: {r['original_size']} ({r['mode_before']})")
        print(f"  透明: {r['transparent_pixels']} 像素 ({pct:.1f}%)")
        out_name = Path(r["output_file"]).name if r["output_file"] else "N/A"
        print(f"  输出: {out_name}")
        if r["output_file"]:
            v = verify_output(Path(r["output_file"]))
            print(f"  验证: RGBA={v['is_rgba']}, Alpha=0={v['alpha_zero_count']}")

    print(f"\n[DONE] 成功处理 {len(all_results)} 个文件")
    print(f"  原文件已备份为 .bak.<ext>")
    print(f"  透明版本: *_transparent.png")
    print(f"  预览版本: *_preview.png")


if __name__ == "__main__":
    main()
