"""Rebuild the static extensions without modifying the original movie.

Requires Pillow and FFmpeg (or imageio-ffmpeg). Optional --video, --frame and
--layout arguments import replacement source assets; defaults use repo assets.
"""
import argparse,hashlib,io,json,shutil,subprocess
from pathlib import Path
from PIL import Image

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    root=Path(__file__).resolve().parents[1]
    assets=root/'public/ui/artifact-ledger'
    archive=root/'environment-assets/artifact-ledger'
    parser=argparse.ArgumentParser(__doc__)
    parser.add_argument('--video',type=Path,default=assets/'frame-motion.mp4')
    parser.add_argument('--frame',type=Path,default=archive/'complete-frame.png')
    parser.add_argument('--layout',type=Path,default=archive/'layout-reference.jpg')
    parser.add_argument('--ffmpeg',default=None)
    args=parser.parse_args()
    assets.mkdir(parents=True,exist_ok=True);archive.mkdir(parents=True,exist_ok=True)
    for src,dst in [(args.video,assets/'frame-motion.mp4'),(args.frame,archive/'complete-frame.png'),(args.layout,archive/'layout-reference.jpg')]:
        if src.resolve()!=dst.resolve():shutil.copyfile(src,dst)
    ffmpeg=args.ffmpeg or shutil.which('ffmpeg')
    if not ffmpeg:
        import imageio_ffmpeg
        ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    result=subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-i',str(args.video),'-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1'],stdout=subprocess.PIPE,check=True)
    with Image.open(io.BytesIO(result.stdout)) as decoded:
        first=decoded.convert('RGB')
        assert first.size==(960,720),'Recalculate layout geometry for another video size.'
        static=Image.open(args.frame).convert('RGB').resize((1112,720),Image.Resampling.LANCZOS)
        pixels=static.load();edge=first.load()
        # Color matching is confined to the static EXTENSIONS outside x=76..1035.
        for y in range(720):
            for d in range(20):
                weight=((20-d)/20)**2
                for x,target in [(75-d,edge[0,y]),(1036+d,edge[959,y])]:
                    pixels[x,y]=tuple(round(a*(1-weight)+b*weight) for a,b in zip(pixels[x,y],target))
        static.save(assets/'frame-complete.webp',quality=94,method=6)
        poster=static.copy();poster.paste(first,(76,0));poster.save(assets/'frame-poster.webp',quality=94,method=6)
        first.save(assets/'video-poster.webp',quality=91,method=6)
    metadata={'videoSize':[960,720],'completeFrameSize':[1112,720],'videoOffset':[76,0],
      'extensions':{'left':76,'right':76},'sourceVideoSHA256':digest(args.video),
      'copiedVideoSHA256':digest(assets/'frame-motion.mp4'),
      'processing':'Original video copied byte-for-byte. Static image underneath, full video layered on top. No video crop, mask, stretch or content replacement.'}
    assert metadata['sourceVideoSHA256']==metadata['copiedVideoSHA256']
    (archive/'composition.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(metadata,indent=2))

if __name__=='__main__':main()
