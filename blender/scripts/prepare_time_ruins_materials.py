"""Prepare reference-derived color textures; run with the project directory argument."""
import sys, shutil
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'video-tools'))
from PIL import Image, ImageFilter, ImageOps

root=Path(sys.argv[1]).resolve()
source=Path(sys.argv[2]).resolve()
reference=Path(sys.argv[3]).resolve()
out=root/'public/textures/time-ruins'
archive=root/'environment-assets/time-ruins'
out.mkdir(parents=True,exist_ok=True)
archive.mkdir(parents=True,exist_ok=True)
shutil.copy2(source,archive/'material-atlas.png')
shutil.copy2(reference,archive/'reference.png')
im=Image.open(source).convert('RGB')
w,h=im.size
for name,box in [('floor',(0,0,w//2,h//2)),('stone',(w//2,0,w,h//2)),('frieze',(0,h//2,w//2,h)),('bronze',(w//2,h//2,w,h))]:
    tile=im.crop(box)
    # Feather opposite borders into one another to reduce tiling seams.
    if name!='frieze':
        pixels=tile.load(); tw,th=tile.size
        for x in range(10):
            a=(10-x)/20
            for y in range(th):
                left=pixels[x,y];right=pixels[tw-1-x,y]
                pixels[x,y]=tuple(round(l*(1-a)+r*a) for l,r in zip(left,right))
                pixels[tw-1-x,y]=tuple(round(r*(1-a)+l*a) for l,r in zip(left,right))
        for y in range(10):
            a=(10-y)/20
            for x in range(tw):
                top=pixels[x,y];bottom=pixels[x,th-1-y]
                pixels[x,y]=tuple(round(t*(1-a)+b*a) for t,b in zip(top,bottom))
                pixels[x,th-1-y]=tuple(round(b*(1-a)+t*a) for t,b in zip(top,bottom))
    tile.save(out/(name+'.jpg'),quality=91)
    if name in ('floor','stone','bronze'):
        height=ImageOps.grayscale(tile).filter(ImageFilter.GaussianBlur(.6))
        height.save(out/(name+'-height.jpg'),quality=87)
print('Prepared textures:',[(p.name,p.stat().st_size) for p in out.iterdir()])
