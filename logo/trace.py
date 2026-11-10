"""Trace logo/itfti-seal.jpg into logo/itfti-seal.svg.

Steps: crop to the seal with a small margin, upscale, split ink from paper on the green channel,
trace the ink shapes with Potrace (pure-Python port), and write them as one red path on a
transparent background.
Requires: pip install potracer pillow
"""
import os, statistics
from PIL import Image, ImageFilter
import potrace

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "itfti-seal.jpg")
SVG = os.path.join(HERE, "itfti-seal.svg")
SCALE = 2

im = Image.open(SRC).convert("RGB")
g = im.getchannel("G")
box = g.point(lambda v: 255 if v < 140 else 0).getbbox()
m = 12
box = (max(box[0] - m, 0), max(box[1] - m, 0), min(box[2] + m, im.width), min(box[3] + m, im.height))
seal = im.crop(box)

# The red used for the fill: median of clearly inked pixels.
inked = [p for p in seal.get_flattened_data() if p[1] < 90]
red = tuple(int(statistics.median(c)) for c in zip(*inked))
hexred = "#%02x%02x%02x" % red

# Upscale, soften paper grain, and threshold: ink black, paper white.
big = seal.resize((seal.width * SCALE, seal.height * SCALE), Image.LANCZOS).getchannel("G")
big = big.filter(ImageFilter.MedianFilter(5))
bw = big.point(lambda v: 0 if v < 150 else 255)

paths = potrace.Bitmap(bw).trace(turdsize=400, alphamax=1.0, opticurve=True, opttolerance=0.2)


def f(p):
    return f"{p.x:.1f} {p.y:.1f}"


d = []
for curve in paths:
    d.append("M" + f(curve.start_point))
    for seg in curve.segments:
        if seg.is_corner:
            d.append("L" + f(seg.c) + "L" + f(seg.end_point))
        else:
            d.append("C" + f(seg.c1) + " " + f(seg.c2) + " " + f(seg.end_point))
    d.append("Z")

w, h = bw.size
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
       f'<title>ItFtI</title><path fill="{hexred}" fill-rule="evenodd" d="{"".join(d)}"/></svg>\n')
open(SVG, "w", encoding="utf-8").write(svg)
print(f"wrote {SVG}: {len(paths)} shapes, {len(svg)//1024} KB, fill {hexred}, {w}x{h}")
