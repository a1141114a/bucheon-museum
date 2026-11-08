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
