# Animated artifact information card

The UI uses the project owner's supplied layout image, complete static frame and original animation. Collection information, licensing rules and collection-state transitions are unchanged. The sample layout image is a layout reference only; it is not published as a real artifact photograph.

## Preserve the complete video

`public/ui/artifact-ledger/frame-motion.mp4` is a byte-for-byte copy of the supplied 960×720, 24 fps, approximately 7.04-second MP4. Its SHA-256 is recorded in `composition.json`. There is no re-encoding, crop, mask, overlay inside the movie, or stretching.

The base frame is a layered 1112×720 composition. The original video occupies x=76..1035. The missing left and right areas are each 76 pixels wide and come from `complete-frame.png`. Only those static outside strips receive a 20-pixel color transition to match the adjacent source-video edge.

Tall layouts insert a repeating static parchment/side-rail section between source rows 209 and 210. The original video rows 0..209 remain at the top; rows 210..719 move down together to the bottom. Each source row is drawn once, at the same uniform scale: no original content is omitted and moving characters are not stretched. `frame-extension.webp` supplies the inserted middle section. Canvas composition keeps the whole top, extended side borders and animated footer in a single frame, with all information inside it. Until the first painted frame is ready, the still artwork remains visible rather than showing an opaque black canvas.

The MP4 loops silently with inline autoplay. A still poster keeps the complete frame visible until video playback starts; a user gesture retries playback when a mobile browser blocks autoplay. Playback pauses when the tab is hidden.

## Layout

Desktop/tablet: reference-inspired left photo/model, title and multilingual names; right metadata, history and sources. Controls stay within the parchment safe area, above the animated footer. Long text scrolls inside the frame.

Portrait phones and small portrait tablets: one continuous tall frame encloses the title, photo/model, actions and details. Only its inner reading area scrolls; the extended side borders and animated footer remain around it. There is no separate header card or information panel outside the frame.

The dialog renders through a React portal directly under `document.body`. Explicit pixel width/height from `ledgerFrame.ts` avoid the WebKit dialog height collapse reproduced with the previous stylesheet (1000 pixels wide but zero pixels high at 1024×768). CSS size containment and backdrop blur are no longer required. Closing restores the background scroll style and previous focus.

Source files: `src/components/ArtifactCard.tsx`, `ArtifactFrameMotion.tsx`, `artifact-ledger.css`, `ledgerFrame.ts`.

The journal keeps its original unknown/locked card design. Both `discovered` (found and openable) and `unlocked` (registered) entries show that artifact's image, retaining the original 120-pixel symbol area. Clicking “add to journal” is not required just to see the image. An authorized museum photograph is used only if the existing publication checks pass; otherwise the approved project's own 3D reconstruction render is shown and labelled accordingly. All 12 current artifacts have a matching preview.

## Reproduction

Install Python packages `pillow` and `imageio-ffmpeg` (or supply a system FFmpeg), then run:

```sh
python scripts/prepare_artifact_ledger.py
```

Use `--video`, `--frame`, `--layout` to import replacement sources. A differently sized source video requires recalculating the composition geometry.

## Validation

- Source/copy video SHA-256 matches; 960×720 source resolution preserved.
- WebKit regression checks on 1280×900, 1024×768, 768×1024, 390×844 and 320×568: repeated open/close, all three languages, visible painted frame, nonzero dialog size, content within its frame, visible model button and playing video. Both in-level and journal inspect entries pass without page errors.
- Both discovered and registered entries show images; locked entries have no images.
- TypeScript/Vite build and 41 tests pass, including explicit frame sizing and complete video-band geometry.
- `webkit-validation.json` records the old zero-height reproduction and corrected measurements. The optional Playwright WebKit regression script is `scripts/check_artifact_cards_webkit.cjs`; it uses a fresh disposable test profile and never changes the user's browser save. Install Playwright and its WebKit engine before running it against the local dev server on port 5175.

These are WebKit engine/viewport checks, not a claim of testing on the user's physical iPad. The original complete PNG and layout JPG are archived here; derived WebP assets and the unchanged MP4 are in `public/ui/artifact-ledger/`.
