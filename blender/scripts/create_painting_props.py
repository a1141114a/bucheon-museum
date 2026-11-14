"""Editable portal, lectern and key. Run with Blender --background --python this file."""
import bpy, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,c,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=.32
 return m
gold=mat('Antique gold',(.62,.32,.065),.72);dark=mat('Carved walnut',(.065,.021,.012));ivory=mat('Warm stone',(.62,.5,.33))
def cube(name,loc,scale,m,bevel=.015):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:
  b=o.modifiers.new('Soft carved edges','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def sphere(loc,scale):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=loc);o=bpy.context.object;o.scale=scale;o.data.materials.append(gold)
def export(name):
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/blend/painting-worlds'/f'{name}.blend'),compress=True)
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/painting-worlds'/f'{name}.glb'),export_format='GLB',export_apply=True)
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
# Centered 1x1 opening; runtime scales to each artwork's proportions.
for d in range(4):
 for side in [-1,1]:
  x=side*(.52+d*.027);z=0
  cube('Sculpted frame upright',(x,d*.009,0),(.035,.08,1.17+d*.04),gold)
  cube('Sculpted frame lintel',(0,d*.009,x),(1.17+d*.04,.08,.035),gold)
for side in [-1,1]:
 for k in range(17):
  t=-.53+k*.066
  sphere((side*.61,-.02,t),(.025,.045,.018));sphere((t,-.02,side*.61),(.018,.045,.025))
 for corner in [-1,1]:
  for k in range(9):
   a=k*math.pi/4;sphere((side*(.56+.035*math.cos(a)),-.05,corner*(.56+.035*math.sin(a))),(.035,.035,.025))
export('portal-frame')
cube('Lectern foot',(0,0,.1),(.75,.6,.2),dark,.04)
cube('Lectern stem',(0,0,.55),(.16,.16,.9),gold)
cube('Slanted folio support',(0,0,1.04),(.85,.55,.08),dark,.025)
for x in [-.4,.4]:cube('Gilt lectern edge',(x,0,1.09),(.025,.55,.035),gold)
export('lectern')
bpy.ops.mesh.primitive_torus_add(major_radius=.13,minor_radius=.028,major_segments=32,minor_segments=10,location=(0,0,.28));bpy.context.object.data.materials.append(gold)
cube('Key shaft',(0,0,.02),(.042,.04,.38),gold)
for z in [-.1,-.16]:cube('Key tooth',(.055,0,z),(.13,.045,.035),gold)
export('key')
