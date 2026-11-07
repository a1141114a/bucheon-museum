# Chapter 2 gallery environment

This environment follows the **upper-left interior** in the reference supplied by
the user on 2026-11-08. It is a fictional game interior, not documentation of the
physical Bucheon museum building. No collection metadata or approved exhibit
models were changed.

## Editable sources and runtime assets

- `environment-assets/gallery/reference.png`: the user's complete reference sheet.
- `environment-assets/gallery/material-atlas.png`: generated material source atlas.
- `public/textures/gallery/{wall,marble,ceiling}.webp`: runtime albedo textures.
- `public/textures/gallery/banner-{red,blue}.webp`: decorations extracted from the
  supplied sheet, with no museum provenance claim.
- `blender/scripts/prepare_gallery_textures.py`: deterministic atlas extraction and
  WebP encoding; requires Pillow.
- `blender/scripts/create_gallery_lantern.py`: bpy model generator.
- `blender/blend/gallery-lantern.blend`: individually editable chain, canopy,
  octagonal frame, frosted panels, raised rosettes, frets and finial.
- `public/models/gallery-lantern.glb`: optimized runtime model, five material meshes.
- `src/components/GalleryArchitecture.tsx`: full-scale room, materials, floor
  joints, pilasters, cornices, ceiling grid, banners and lighting.

Rebuild the model with Blender 5.x:

```sh
blender --background --python blender/scripts/create_gallery_lantern.py
```

Rebuild the texture outputs:

```sh
python blender/scripts/prepare_gallery_textures.py
```

## Lighting and performance

Three warm lantern point lights illuminate the aisle. Cabinet lights emphasize
the objects, with restrained ambient and hemisphere fill. Reflections use a
128-pixel environment captured once from simple light cards, without a remote HDR
dependency or per-frame reflective floor rendering. Metallic cornices use a
moderate roughness to avoid white specular streaks. Static structural trim is
instanced. Floor tiles remain 2 metres square. The lantern spans approximately
1.36 metres and hangs 1.75 metres below its ceiling origin.

## Material generation provenance

Tool: built-in ImageGen via the `imagegen` skill. The user's reference is the style
and material reference; the atlas does not include real exhibit photographs.

Final prompt:

> Create a production game texture atlas based closely on the supplied museum interior reference, especially its upper-left interior scene and lower material samples. One square 2048x2048 texture sheet, NO labels, NO text, NO borders between the atlas cells, NO perspective, NO objects, NO museum scene render. Exact layout: TOP HALF (full width, 2:1 rectangle): a straight-on warm limestone wall module, ivory beige subtly mottled stone, recessed central rectangular panel with fine antique brass/gold outline and restrained ornamental corner turns, dark charcoal marble dado on bottom 22 percent and narrow gold skirting. Vertical pilaster strips at left and right edges form repeatable modules. Soft neutral even lighting, no baked spotlights or reflections. BOTTOM LEFT QUARTER (square): seamless dark brown-black polished marble flooring with natural cream/gold thin veins; no gold perimeter frame, no text, no perspective or lighting streaks. BOTTOM RIGHT QUARTER (square): straight-on ceiling coffer tile with taupe plaster, antique gold architectural moldings forming a square, small restrained central eight-petal gold rosette; no bulbs, no lamp, no baked light. Match the luxurious traditional museum materials and warm restrained gold colors of the reference. These are flat albedo textures for real 3D architecture, NOT a 2D room backdrop.

The tool returned a 1254 × 1254 source atlas; the extraction script records its
actual size and derives the lightweight WebP cells from it.

