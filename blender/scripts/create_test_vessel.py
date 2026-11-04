"""Original technical form only. NOT a museum-object reconstruction.
Run with Blender 4.2+:
blender --background --python blender/scripts/create_test_vessel.py
Unexecuted until Blender is installed. Produces both editable .blend and .glb.
"""
import math
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
BLEND = ROOT / 'blender' / 'blend' / 'test_vessel.blend'
GLB = ROOT / 'public' / 'models' / 'test_vessel.glb'
for path in (BLEND, GLB):
    path.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
# Closed cross-section: bottom, outer wall, rim, inner wall, inner bottom.
profile = [(0, 0), (.38, 0), (.47, .12), (.63, .4), (.68, .75),
           (.58, 1.08), (.37, 1.28), (.36, 1.42), (.43, 1.46),
           (.43, 1.52), (.32, 1.52), (.30, 1.42), (.31, 1.29),
           (.51, 1.04), (.60, .74), (.55, .4), (.38, .12), (0, .12)]
segments = 64
verts = [(r * math.cos(i * 2 * math.pi / segments),
          r * math.sin(i * 2 * math.pi / segments), z)
         for r, z in profile for i in range(segments)]
faces = []
for row in range(len(profile)-1):
    for i in range(segments):
        a = row * segments + i
        b = row * segments + (i+1) % segments
        faces.append((a, b, b+segments, a+segments))
mesh = bpy.data.meshes.new('OriginalTestVesselMesh')
mesh.from_pydata(verts, [], faces)
mesh.update()
obj = bpy.data.objects.new('TEST_ONLY_NotMuseumArtifact', mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.0001)
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
for polygon in mesh.polygons:
    polygon.use_smooth = True
material = bpy.data.materials.new('Test clay')
material.use_nodes = True
nodes = material.node_tree.nodes
bsdf = next((node for node in nodes if node.type == 'BSDF_PRINCIPLED'), None)
if bsdf is None:
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
output = next((node for node in nodes if node.type == 'OUTPUT_MATERIAL'), None)
if output is None:
    output = nodes.new('ShaderNodeOutputMaterial')
material.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
bsdf.inputs['Base Color'].default_value = (.30, .13, .055, 1)
bsdf.inputs['Roughness'].default_value = .38
bsdf.inputs['Metallic'].default_value = .12
obj.data.materials.append(material)
obj['purpose'] = 'Original technical test. Not a replica or real collection item.'
obj['approval_required_for_real_collection'] = True
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
bpy.ops.export_scene.gltf(filepath=str(GLB), export_format='GLB', use_selection=True,
                          export_yup=True, export_extras=True)
print(f'Generated: {BLEND}\nGenerated: {GLB}')
