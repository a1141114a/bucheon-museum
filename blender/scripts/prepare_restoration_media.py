"""Extract supplied swatches and prepare the supplied screen video. No generated art.
Requires Pillow and imageio-ffmpeg. Run from the repository root.
"""
from pathlib import Path
from PIL import Image
import imageio_ffmpeg
import subprocess

ROOT=Path(__file__).resolve().parents[2]
source=ROOT/'environment-assets/restoration'
target=ROOT/'public/textures/restoration'
target.mkdir(parents=True,exist_ok=True)
reference=Image.open(source/'reference.png')
reference.crop((20,598,275,854)).save(target/'floor.webp',quality=90)
reference.crop((291,598,537,854)).save(target/'stone.webp',quality=90)
video=source/'source-screen.mp4'
exe=imageio_ffmpeg.get_ffmpeg_exe()
def convert(*args):subprocess.run([exe,'-loglevel','error','-y','-i',str(video),*map(str,args)],check=True)
convert('-c','copy','-movflags','+faststart',ROOT/'public/ui/restoration-screen-loop.mp4')
convert('-vf','fps=12,scale=320:180,tile=8x9','-frames:v','1','-quality','85',ROOT/'public/ui/restoration-screen-sprite.webp')
convert('-ss','1','-frames:v','1','-quality','88',ROOT/'public/ui/restoration-screen-poster.webp')

