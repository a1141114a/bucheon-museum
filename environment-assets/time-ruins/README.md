# Chapter 3 — bronze time ruins

This is fictional scenery based on the scene sheet supplied by the project owner on 2026-11-08. It is not a reconstruction of a real museum or a catalogued ancient site. Collection models and their researched information remain separate.

## Files and reproduction

- `reference.png`: original user-supplied scene/model/material sheet.
- `material-atlas.png`: color atlas generated with the built-in image generation tool using that sheet as a style reference. Exact prompt and provenance are in `material-prompt.json`.
- `../../blender/scripts/prepare_time_ruins_materials.py`: crop and seam preparation; requires Python and Pillow. Arguments: project root, atlas PNG, reference PNG.
- `../../blender/scripts/create_time_ruins.py`: Blender Python generator, no addons required. Run `blender --background --python blender/scripts/create_time_ruins.py` from the project root.
- `../../blender/blend/time-ruins.blend`: editable original meshes, linked assembled preview, preview camera, lighting and packed images. Source gear/elephant/chain objects are hidden individually to keep the assembled preview uncluttered; reveal them from their named collections when editing modules.
- Five game models in `../../public/models/`: `time-ruins-architecture.glb`, `time-ruins-gear.glb`, `time-ruins-altar.glb`, `time-ruins-elephant.glb`, `time-ruins-chain.glb`.
- Runtime floor color/height maps in `../../public/textures/time-ruins/`; module GLBs embed their own textures.

The optimized GLBs batch meshes by material. The Blender source retains individual blocks, bevels, spokes, teeth, chain links, sculpture parts and rubble. The existing `time-mechanism.glb` and `TimeRing0/1/2` gameplay pivots are preserved; the new altar is an open surround beneath and outside the interactive dial.

## Runtime behavior

Three decorative rear wheels and suspended wheels rotate slowly. Golden spiral geometry, warm lights, a translucent overhead beam and subtle motes animate around the altar. Decorative motion pauses when the system requests reduced motion. Walls and attached backdrop props cut away when the orbit camera passes behind them so that the puzzle remains visible.

Three real collection models, clue cards, chronology rules, ring controls, hints, scoring, persistence and the 2.6-second completion flow are unchanged. Existing chapter gates still apply. This update does not unlock Chapter 3 for new saves.

## Validation

Blender 5.2.3 exported all five GLBs and saved the packed, editable `.blend`. TypeScript and Vite production build pass; 39 existing tests pass. Browser checks covered 1280×800 desktop, 1024×768 tablet, 390×844 portrait and 844×390 landscape, plus artifact-card access, ring rotation, completion (180 points), and rear-camera cutaway. These are browser viewport checks, not claims of physical-device performance measurements.

The real-time scene is an initial interpretation of the reference. Geometry, palette, composition and effects can be refined independently of the gameplay.

## Front exhibit plinths and atmosphere update

The three collection plinths are now in front of the altar at X/Z = (-3.25, 2.8), (0, 3.75), (3.25, 2.8), on ground level. Their 0.84m-radius footprints stay clear of the altar's 2.13m foundation, each other and the terrace steps (front edge Z=0.38). The minimum altar/plinth gap is 0.78m. Real collection models sit at Y=0.68 on the new plinth, with their original sizing and click-to-inspect behavior.

New files:

- `blender/scripts/create_time_exhibit_pedestal.py`: editable stone tiers, bronze molding, inset facet panels, turquoise top inlay and geometric key strokes, matching the existing altar materials.
- `blender/blend/time-exhibit-pedestal.blend`: separate editable asset with packed textures and preview camera.
- `public/models/time-exhibit-pedestal.glb`: one optimized game asset shared by the three plinth instances.
- `src/components/timeExhibitLayout.ts`: placement and support height; corresponding clearance regression tests in `tests/time-exhibit-layout.test.ts`.
- `src/components/TimeAtmosphere.tsx`: surrounding 3D sphere with a slowly changing teal/earth/gold mist shader, gentle fog-color variation and drifting round motes. A wider stone floor hides the previous abrupt island edge. The mobile UI gutter uses a matching slow gradient; game geometry and exhibits remain fully 3D. Reduced-motion preferences pause decorative movement.

The default camera now includes all three foreground plinths, with extra clearance above the tablet control dock. Original rings, symbols, chronology solution, collection cards and score/completion logic are unchanged. Browser checks cover direct clicks on the rebuilt plinth, front/rear orbit views, desktop, tablet and phone framing, plus a full three-ring completion. Production build and 43 tests pass. `exhibit-pedestal-validation.json` records measured Blender geometry bounds against the layout's clearance radius.

## Extended curved walls and retained hints

`blender/scripts/create_time_wall_extensions.py` continues the original brick-course coordinates for five columns on each side, including matching turquoise/Greek-key bands and two additional column supports. The new left/right wings reach around the front sides of the courtyard while keeping the foreground exhibit positions unchanged. Editable packed source is `blender/blend/time-wall-extensions.blend`; game models are `public/models/time-ruins-wall-left.glb` and `time-ruins-wall-right.glb`. Each wing has its own camera cutaway, so orbiting does not hide the entire room or leave a wall across the puzzle.

The three main decorative wheels run at 1.6× their previous speed (0.04, -0.056 and 0.056 radians/second). Hanging wheel speeds and player-operated puzzle rings are unchanged; reduced-motion preferences still pause decoration.

The guide panel now fully collapses to a small reopen button and starts collapsed. Using a hint opens it and displays every revealed hint in order. Three uses show all three tips; hiding/reopening or reloading preserves their availability without spending another use. The existing three-use limit and 5-point cost remain. Restarting Chapter 3 clears its hints as before.

An isolated WebKit regression at desktop, tablet and portrait-phone sizes verified progressive 1/2/3 tips, the disabled fourth use, retained tips after reload, complete panel removal on collapse, all three languages and no overlap with the bottom dock. Measurements are in `hints-validation.json`.
