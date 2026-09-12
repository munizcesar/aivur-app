from PIL import Image
from pathlib import Path

root = Path('public')
source = Image.open(root / 'assets' / 'logo-aivur.png').convert('RGBA')
alpha = source.getchannel('A')
bbox = alpha.getbbox()
if not bbox:
    raise RuntimeError('Logo sem conteúdo visível')

mark = source.crop(bbox)
# Keep the supplied symbol only: no background, no border, and no colored tile.
for size, margin in [(16, 0), (32, 1), (180, 10), (192, 10), (512, 24)]:
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    target = size - margin * 2
    fitted = mark.copy()
    fitted.thumbnail((target, target), Image.Resampling.LANCZOS)
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    canvas.alpha_composite(fitted, (x, y))
    if size == 16:
        canvas.save(root / 'favicon-16x16.png', optimize=True)
    elif size == 32:
        canvas.save(root / 'favicon-32x32.png', optimize=True)
    elif size == 180:
        canvas.save(root / 'apple-touch-icon.png', optimize=True)
    elif size == 192:
        canvas.save(root / 'android-chrome-192x192.png', optimize=True)
    elif size == 512:
        canvas.save(root / 'android-chrome-512x512.png', optimize=True)

# Browser fallback: a real multi-resolution ICO, not the old placeholder.
ico16 = Image.open(root / 'favicon-16x16.png').convert('RGBA')
ico32 = Image.open(root / 'favicon-32x32.png').convert('RGBA')
ico32.save(root / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32)])
print('Favicons regenerated from public/assets/logo-aivur.png')
