"""Build the hero point-cloud texture from a photo.

R = luminance (contrast-stretched), G = junk mask (hand-drawn polygon, feathered),
B = pseudo depth (ground near, sky far, plus a little luminance), A = 255.
Packed as a PNG and embedded as a data URI so it works from file:// (no canvas taint).
Run:  python make_cloud.py   (from anywhere)
"""
import base64, io, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'img', 'construction.jpg')
GW, GH = 448, 301            # grid, ~135k points

# junk polygon in source pixels (1168 x 784)
POLY = [(330, 740), (372, 668), (452, 612), (520, 584), (590, 545), (650, 520), (700, 486), (780, 452),
        (830, 424), (880, 392), (950, 385), (1010, 398), (1070, 420), (1130, 450), (1168, 470),
        (1168, 784), (330, 784)]

im = Image.open(SRC).convert('RGB')
W, H = im.size
g = im.resize((GW, GH), Image.LANCZOS)
a = np.asarray(g).astype(np.float32) / 255.0
lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
lo, hi = np.percentile(lum, 1), np.percentile(lum, 99)
lum = np.clip((lum - lo) / (hi - lo), 0, 1)

m = Image.new('L', (W, H), 0)
ImageDraw.Draw(m).polygon(POLY, fill=255)
m = m.filter(ImageFilter.GaussianBlur(14)).resize((GW, GH), Image.LANCZOS)
mask = np.asarray(m).astype(np.float32) / 255.0

yy = np.linspace(0, 1, GH)[:, None] * np.ones((1, GW))
depth = np.clip(0.15 + 0.7 * yy + 0.25 * (lum - 0.5), 0, 1)

out = np.stack([lum, mask, depth, np.ones_like(lum)], -1)
png = Image.fromarray((out * 255).astype(np.uint8), 'RGBA')
buf = io.BytesIO(); png.save(buf, 'PNG', optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
with open(os.path.join(ROOT, 'data', 'cloud-data.js'), 'w') as f:
    f.write('window.SWIFT_CLOUD=' + json.dumps({'w': GW, 'h': GH, 'aspect': W / H, 'png': 'data:image/png;base64,' + b64}) + ';\n')
print('cloud-data.js', len(b64) // 1024, 'KB b64')

# review overlay: photo with the mask in copper
ov = np.asarray(im.resize((GW * 2, GH * 2))).astype(np.float32)
mk = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((GW * 2, GH * 2))).astype(np.float32)[..., None] / 255
ov = ov * (1 - 0.6 * mk) + np.array([232, 128, 63], np.float32) * 0.6 * mk
Image.fromarray(ov.astype(np.uint8)).save(os.path.join(HERE, 'shots', 'cloud_mask_preview.png'))
