"""Blender model for the fictional Chapter 3 time mechanism.

Three named rings rotate independently in the game. All forms are editable.
"""
import math
from pathlib import Path
import bpy

ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'


def material(name,color,metal=0,roughness=.45):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*color,1)
    m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=roughness
    return m


brass=material('Antique brass',(.38,.23,.08),.55,.36)
gold=material('Gold engraved trim',(.75,.47,.14),.62,.31)
stone=material('Dark basalt',(.073,.075,.067),.12,.65)
enamel=material('Teal enamel',(.032,.17,.16),.15,.4)
ivory=material('Ivory index',(.80,.71,.51),.12,.4)


def finish(obj,name,mat,parent=None):
    obj.name=name
    obj.data.materials.append(mat)
    if parent:
        obj.parent=parent
    return obj


def cylinder(name,radius,depth,z,mat,vertices=96,parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=(0,0,z))
    obj=finish(bpy.context.object,name,mat,parent)
    bevel=obj.modifiers.new('Rounded edges','BEVEL')
    bevel.width=.018
    bevel.segments=3
    obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return obj


def torus(name,radius,tube,z,mat,parent=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=96,minor_segments=10,major_radius=radius,
        minor_radius=tube,location=(0,0,z))
    obj=finish(bpy.context.object,name,mat,parent)
    for polygon in obj.data.polygons:
        polygon.use_smooth=True
    return obj


cylinder('Octagonal basalt foundation',1.92,.20,.10,stone,8)
cylinder('Gilded base molding',1.84,.055,.226,brass,96)
cylinder('Octagonal column',1.49,.68,.58,stone,8)
for z in (.29,.35,.87,.93):
    torus('Horizontal column inlay',1.51,.021,z,brass)
cylinder('Crown molding',1.76,.12,1.00,brass)
cylinder('Enamel dial bed',1.70,.07,1.075,enamel)
torus('Outer gold rim',1.70,.035,1.12,gold)

for i in range(8):
    angle=i*math.tau/8
    bpy.ops.mesh.primitive_cube_add(size=1,location=(1.49*math.sin(angle),1.49*math.cos(angle),.59))
    obj=finish(bpy.context.object,'Vertical basalt facet inlay',brass)
    obj.dimensions=(.025,.025,.45)
    obj.rotation_euler.z=-angle
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)

rings=[]
for i,(radius,tube,z) in enumerate([(1.47,.105,1.15),(1.09,.102,1.17),(.71,.098,1.19)]):
    pivot=bpy.data.objects.new('TimeRing'+str(i),None)
    scene.collection.objects.link(pivot)
    pivot.location=(0,0,z)
    rings.append(pivot)
    torus('Rotating bronze annulus',radius,tube,0,brass,pivot)
    for offset in (-.073,.073):
        torus('Ring engraved edge',radius+offset,.012,.041,gold,pivot)
    for j in range(36):
        angle=j*math.tau/36
        bpy.ops.mesh.primitive_cube_add(size=1,location=(radius*math.sin(angle),radius*math.cos(angle),.085))
        tick=finish(bpy.context.object,'Dial tick',ivory if j%12==0 else gold,pivot)
        tick.dimensions=(.024,.105 if j%3==0 else .050,.012)
        tick.rotation_euler.z=-angle
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for j in range(3):
        angle=j*math.tau/3
        medallion=cylinder('Symbol medallion',.129,.025,.112,gold,32,pivot)
        medallion.location.x=radius*math.sin(angle)
        medallion.location.y=radius*math.cos(angle)

cylinder('Central socket',.35,.14,1.21,brass)
torus('Central gold bezel',.28,.037,1.30,gold)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.23,location=(0,0,1.41))
finish(bpy.context.object,'Time core crystal',enamel)

verts=[(-.10,1.66,1.32),(.10,1.66,1.32),(0,1.43,1.32),
       (-.10,1.66,1.26),(.10,1.66,1.26),(0,1.43,1.26)]
mesh=bpy.data.meshes.new('Fixed north pointer')
mesh.from_pydata(verts,[],[(0,1,2),(5,4,3),(0,3,4,1),(1,4,5,2),(2,5,3,0)])
mesh.update()
obj=bpy.data.objects.new('Fixed alignment pointer',mesh)
scene.collection.objects.link(obj)
finish(obj,obj.name,ivory)

bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/blend/time-mechanism.blend'),compress=True)
depsgraph=bpy.context.evaluated_depsgraph_get()
groups=[('MechanismBody',[obj for obj in scene.objects if obj.type=='MESH' and obj.parent is None],None)]
groups.extend(('RingSurface'+str(i),list(ring.children),ring) for i,ring in enumerate(rings))
exports=[]
for name,source,parent in groups:
    copies=[]
    bpy.ops.object.select_all(action='DESELECT')
    for obj in source:
        data=bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph),preserve_all_data_layers=True,depsgraph=depsgraph)
        copy=bpy.data.objects.new(name,data)
        scene.collection.objects.link(copy)
        copy.matrix_world=obj.matrix_world.copy()
        copy.select_set(True)
        copies.append(copy)
    bpy.context.view_layer.objects.active=copies[0]
    bpy.ops.object.join()
    merged=bpy.context.object
    merged.name=name
    if parent:
        world=merged.matrix_world.copy()
        merged.parent=parent
        merged.matrix_world=world
    exports.append(merged)
bpy.ops.object.select_all(action='DESELECT')
for obj in [*exports,*rings]:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/time-mechanism.glb'),
    export_format='GLB',use_selection=True,export_apply=True,export_animations=False)
