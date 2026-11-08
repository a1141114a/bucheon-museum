# First chapter: reference-based furniture and animated screen

User approval: supplied prop sheet and screen video on 2026-11-08. The later
instruction makes the **video** authoritative for the screen; no screen artwork
is extracted from the prop sheet. Existing collection jar, shards, metadata,
scores and UI assets are preserved.

## Saved assets

- `environment-assets/restoration/reference.png`: original prop/material sheet.
- `environment-assets/restoration/source-screen.mp4`: original supplied video.
- `blender/scripts/create_restoration_furniture.py`: bpy model generator.
- `blender/blend/restoration-furniture.blend`: editable table, pedestal and pillar,
  laid out separately for convenient inspection.
- `public/models/restoration-{table,plinth,pillar}.glb`: independent game props.
- `public/textures/restoration/{floor,stone}.webp`: swatches from the supplied image.
- `blender/scripts/prepare_restoration_media.py`: reproducible texture/video preparation.
- `public/ui/restoration-screen-loop.mp4`: lossless fast-start remux, 1280×720,
  approximately 6 seconds, muted and looping in the game.
- `public/ui/restoration-screen-poster.webp`: frame from this video, used only while
  media is loading; it is not the earlier static screen artwork.
- `public/ui/restoration-screen-sprite.webp`: 72 video frames, 8 columns × 9 rows,
  320×180 each, drawn at 12 fps if inline video cannot play. This is a dynamic
  fallback on the same 3D screen surface.
- `src/components/RestorationDecor.tsx`: GLB props, floor and video/canvas textures.

The table surface remains at 0.805 m and the jar base at 0.91 m so the puzzle's
existing shard placement is unchanged. Pillars flank the table and plinth at X=±5, Z=0, matching the original first-chapter layout. Their camera cutaway bounds match those positions.

The back wall retains its 48×4 m size. Each repetition uses the video's actual
16:9 aspect ratio, rather than stretching it to the older static image's 2:1
ratio. The center of a complete cycle is aligned with the center of the wall;
additional repetitions cover the sides. The original back-wall and pillar
cutaway behavior remains active when the camera moves behind the puzzle.

Rebuild after preparing the media:

```sh
python blender/scripts/prepare_restoration_media.py
blender --background --python blender/scripts/create_restoration_furniture.py
```

The furniture is fictional game scenery, not an additional museum collection
item. No real exhibit photograph or unverified artifact information is added.

