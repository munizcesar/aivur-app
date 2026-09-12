from PIL import Image
from pathlib import Path

root = Path('public')
source = Image.open(root / 'assets' / 'logo-aivur.png').convert('RGBA')
alpha = source.getchannel('A')
bbox = alpha.getbbox()
if not bbox:
    raise RuntimeError('Logo sem conteúdo visível')

mark = source.crop(bbox)
# Keep a compact premium tile: dark institutional background + large, centered symbol.
for size, margin in [(16, 2), (32, 3), (180, 18), (192, 18), (512, 42)]:
    canvas = Image.new('RGBA', (size, size), (6, 21, 33, 255))
    target = size - margin * 2
    fitted = mark.copy()
    fitted.thumbnail((target, target), Image.Resampling.LANCZOS)
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    canvas.alpha_composite(fitted, (x, y))
    if size == 16:
        canvas.convert('RGB').save(root / 'favicon-16x16.png', optimize=True)
    elif size == 32:
        canvas.convert('RGB').save(root / 'favicon-32x32.png', optimize=True)
    elif size == 180:
        canvas.save(root / 'apple-touch-icon.png', optimize=True)
    elif size == 192:
        canvas.save(root / 'android-chrome-192x192.png', optimize=True)
    elif size == 512:
        canvas.save(root / 'android-chrome-512x512.png', optimize=True)

# Browser fallback: a real multi-resolution ICO, not the old placeholder.
ico16 = Image.open(root / 'favicon-16x16.png').convert('RGBA')
ico32 = Image.open(root / 'favicon-32x32.png').convert('RGBA')
ico32.save(root / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32)], append_images=[ico16])
print('Favicons regenerated from public/assets/logo-aivur.png')
