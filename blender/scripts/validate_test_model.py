"""Reopen .blend, check mesh and import exported GLB in Blender."""
from pathlib import Path
import bpy
import bmesh

root = Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(root / 'blender/blend/test_vessel.blend'))
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
assert len(meshes) == 1, 'Expected one test vessel mesh'
obj = meshes[0]
assert obj.data.materials and len(obj.data.polygons) > 500
bm = bmesh.new()
bm.from_mesh(obj.data)
assert all(edge.is_manifold for edge in bm.edges), 'Mesh must be closed'
assert bm.calc_volume(signed=True) > 0, 'Expected outward-facing normals'
bm.free()
assert abs(obj.dimensions.z - 1.52) < .01
print(f'BLEND PASS: {len(obj.data.vertices)} vertices, {len(obj.data.polygons)} faces')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root / 'public/models/test_vessel.glb'))
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
assert len(meshes) == 1 and meshes[0].data.materials
assert abs(meshes[0].dimensions.z - 1.52) < .01
print('GLB PASS: imported mesh with material and expected dimensions')
