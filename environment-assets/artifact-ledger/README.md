# Animated artifact information card

The UI uses the project owner's supplied layout image, complete static frame and original animation. Collection information, licensing rules and collection-state transitions are unchanged. The sample layout image is a layout reference only; it is not published as a real artifact photograph.

## Preserve the complete video

`public/ui/artifact-ledger/frame-motion.mp4` is a byte-for-byte copy of the supplied 960×720, 24 fps, approximately 7.04-second MP4. Its SHA-256 is recorded in `composition.json`. There is no re-encoding, crop, mask, overlay inside the movie, or stretching.

The frame is a layered 1112×720 composition. The original video occupies x=76..1035 at y=0. The missing left and right areas are each 76 pixels wide and come from `complete-frame.png`. Only those static outside strips receive a 20-pixel color transition to match the adjacent source-video edge. Video pixels are never changed. The runtime video is 86.330935% of the full composition width, offset 6.834532% from the left, with `object-fit: contain`.

The MP4 loops silently with inline autoplay. A still poster keeps the complete frame visible until video playback starts; a user gesture retries playback when a mobile browser blocks autoplay. Playback pauses when the tab is hidden.

## Layout

Desktop/tablet: reference-inspired left photo/model, title and multilingual names; right metadata, history and sources. Controls stay within the parchment safe area, above the animated footer. Long text scrolls inside the frame.

Portrait phones: the entire undistorted animated frame forms a title header, followed by a readable parchment body containing the photo/model, actions and details. The card scrolls vertically; the movie is not stretched to fit the tall body. The close and language toolbar remains available while reading.

Source files: `src/components/ArtifactCard.tsx`, `ArtifactFrameMotion.tsx`, `artifact-ledger.css`.

The journal keeps its original locked/discovered card design. Once a record reaches `unlocked`, `JournalArtwork.tsx` replaces the symbol with that artifact's image, retaining the original 120-pixel image/symbol area. An authorized museum photograph is used only if the existing publication checks pass; otherwise the approved project's own 3D reconstruction render is shown and labelled accordingly. All 12 current artifacts have a matching preview. Unlocked image loading and the absence of images on locked entries were verified in the browser.

## Reproduction

Install Python packages `pillow` and `imageio-ffmpeg` (or supply a system FFmpeg), then run:

```sh
python scripts/prepare_artifact_ledger.py
```

Use `--video`, `--frame`, `--layout` to import replacement sources. A differently sized source video requires recalculating the composition geometry.

## Validation

- Source/copy video SHA-256 matches; 960×720 source resolution preserved.
- DOM checks on 1280×900, 1024×768, 768×1024, 390×844, 320×568 and 844×390 in Chinese, Korean and English: no horizontal overflow or overflowing text; complete video inside its composition; 4:3 aspect retained; video playing.
- Verified the original artifact render, 3D viewer toggle, collection registration and status change.
- TypeScript/Vite build and 39 existing tests pass.

These are browser viewport checks, not physical-device performance measurements. The original complete PNG and layout JPG are archived here; derived WebP assets and the unchanged MP4 are in `public/ui/artifact-ledger/`.

