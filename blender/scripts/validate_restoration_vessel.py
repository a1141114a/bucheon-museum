from pathlib import Path
import json
import bpy
import bmesh
root=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(root/'blender/blend/restoration_vessel.blend'))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert len(objects)==9
stats=[]
for obj in objects:
    bm=bmesh.new();bm.from_mesh(obj.data)
    assert all(e.is_manifold for e in bm.edges), f'Non-manifold shard: {obj.name}'
    volume=bm.calc_volume(signed=True)
    assert volume>0, f'Normals: {obj.name}'
    bm.free()
    assert len(obj.data.materials)==2 and obj.data.uv_layers
    stats.append({'id':obj.name,'vertices':len(obj.data.vertices),'faces':len(obj.data.polygons),'volume':volume,'dimensions':list(obj.dimensions)})
assert max(s['volume'] for s in stats)/min(s['volume'] for s in stats)>2, 'Expected visibly unequal shard sizes'
assert any(image.packed_file for image in bpy.data.images)
print('BLEND PASS: nine manifold shards, positive volume, UVs, glaze/clay materials, packed original texture')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'public/models/restoration_vessel.glb'))
assert all(bpy.data.objects.get(f'shard_{b}_{s}') for b in range(3) for s in range(3))
print('GLB PASS: nine named fragments round-trip successfully')
report={'blender':bpy.app.version_string,'shards':stats,'vertices':sum(s['vertices'] for s in stats),'faces':sum(s['faces'] for s in stats),'blendBytes':(root/'blender/blend/restoration_vessel.blend').stat().st_size,'glbBytes':(root/'public/models/restoration_vessel.glb').stat().st_size}
(root/'docs/restoration-model-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
