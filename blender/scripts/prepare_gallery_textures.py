"""Extract atlas cells, resize and encode the gallery's runtime WebP textures.

No painting or image synthesis is done here: the generated atlas and user reference
remain editable source assets in environment-assets/gallery.
"""
from pathlib import Path
from PIL import Image
import sys

ROOT=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[2]
source=ROOT/'environment-assets/gallery'
target=ROOT/'public/textures/gallery'
target.mkdir(parents=True,exist_ok=True)
atlas=Image.open(source/'material-atlas.png').convert('RGB')
w,h=atlas.size
for name,box,size in [
    ('wall',(0,0,w,h//2),(1280,640)),
    ('marble',(0,h//2,w//2,h),(768,768)),
    ('ceiling',(w//2,h//2,w,h),(768,768)),
]:
    atlas.crop(box).resize(size,Image.Resampling.LANCZOS).save(target/(name+'.webp'),quality=86,method=6)
reference=Image.open(source/'reference.png').convert('RGB')
for name,box in [('banner-red',(1444,543,1543,822)),('banner-blue',(1559,543,1652,822))]:
    reference.crop(box).save(target/(name+'.webp'),quality=88,method=6)
print('Atlas size:',atlas.size)
for file in target.glob('*.webp'):print(file.name,file.stat().st_size)

