"""Editable low stone/bronze exhibit plinth, matching the Chapter 3 altar.
Run with Blender 5.x: blender --background --python blender/scripts/create_time_exhibit_pedestal.py
"""
import bpy,math,json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'

def material(name,color,metal=0,rough=.7,texture=None):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if texture:
        t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(ROOT/'public/textures/time-ruins'/texture),check_existing=True)
        m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
    return m
stone=material('Weathered limestone',(.24,.22,.17),texture='stone.jpg')
bronze=material('Aged bronze',(.43,.25,.085),.72,.53,'bronze.jpg')
gold=material('Worn gold edges',(.64,.37,.12),.68,.47)
patina=material('Turquoise patina',(.032,.19,.18),.28,.65)
dark=material('Carved stone recess',(.11,.12,.09),0,.85)

def finish(o,name,mat,bevel=.012):
    o.name=name;o.data.materials.append(mat)
    if bevel:
        b=o.modifiers.new('Worn bevel','BEVEL');b.width=bevel;b.segments=3
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o
def cylinder(name,r,h,z,mat,verts=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=h,location=(0,0,z))
    return finish(bpy.context.object,name,mat)
def ring(name,r,t,z,mat):
    bpy.ops.mesh.primitive_torus_add(major_segments=96,minor_segments=8,major_radius=r,minor_radius=t,location=(0,0,z))
    o=finish(bpy.context.object,name,mat,0)
    for f in o.data.polygons:f.use_smooth=True
    return o
def box(name,pos,size,mat,angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
    o=bpy.context.object;o.dimensions=size;o.rotation_euler.z=angle
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,.006)

cylinder('Stepped stone foundation',.84,.12,.06,stone,16)
cylinder('Bronze foot molding',.80,.045,.1375,bronze)
cylinder('Lower stone tier',.75,.075,.1975,stone,16)
cylinder('Faceted carved drum',.66,.285,.3775,stone,16)
cylinder('Upper bronze shoulder',.73,.055,.5475,bronze)
cylinder('Crown stone slab',.74,.065,.6075,stone)
cylinder('Inset limestone display surface',.65,.018,.65,stone)
for z,r,t in [(.162,.782,.012),(.235,.682,.014),(.520,.687,.014),(.576,.732,.013),(.648,.716,.018)]:
    ring('Concentric altar-style molding',r,t,z,gold)
ring('Top turquoise inlay',.60,.009,.662,patina)
for i in range(16):
    a=i*math.tau/16;x,y=.658*math.sin(a),.658*math.cos(a)
    box('Recessed facet panel',(x,y,.375),(.17,.015,.18),dark,-a)
    for dx in (-.088,.088):
        xx=x+dx*math.cos(a);yy=y-dx*math.sin(a)
        box('Inset bronze panel border',(xx,yy,.375),(.012,.022,.22),bronze,-a)
    box('Upper panel border',(x,y,.485),(.185,.024,.013),gold,-a)
    box('Lower panel border',(x,y,.265),(.185,.024,.013),bronze,-a)
    # A small raised geometric spiral, using actual mesh strokes.
    for dx,dz,sx,sz in [(-.035,.035,.075,.012),(0,0,.012,.075),(.025,-.035,.062,.012)]:
        xx=x+dx*math.cos(a)+.018*math.sin(a);yy=y-dx*math.sin(a)+.018*math.cos(a)
        box('Geometric carved key inlay',(xx,yy,.375+dz),(sx,.016,sz),gold,-a)
for i in range(32):
    a=i*math.tau/32
    box('Crown engraved tick',(.68*math.sin(a),.68*math.cos(a),.657),(.012,.035,.008),bronze,-a)

for image in bpy.data.images:
    if image.filepath:image.pack()
original=list(scene.objects)
bpy.context.view_layer.update();evaluated=bpy.context.evaluated_depsgraph_get()
points=[o.matrix_world@v.co for o in original if o.type=='MESH' for v in o.evaluated_get(evaluated).data.vertices]
measurement={'radius':round(max(math.hypot(v.x,v.y) for v in points),6),'height':round(max(v.z for v in points),6),'artifactSupportHeight':.68,'editableMeshCount':len(original)}
assert measurement['radius']<=.84001 and measurement['height']<.68
(ROOT/'environment-assets/time-ruins/exhibit-pedestal-validation.json').write_text(json.dumps(measurement,indent=2)+'\n',encoding='utf-8')
bpy.ops.object.camera_add(location=(2.1,-2.9,1.8));camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.28))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=52;scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(1,-2,3));light=bpy.context.object;light.data.energy=450;light.data.size=3
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/blend/time-exhibit-pedestal.blend'),compress=True)
dg=bpy.context.evaluated_depsgraph_get();batches={}
for o in original:
    if o.type!='MESH':continue
    me=bpy.data.meshes.new_from_object(o.evaluated_get(dg),depsgraph=dg)
    copy=bpy.data.objects.new('Game export',me);scene.collection.objects.link(copy);copy.matrix_world=o.matrix_world.copy()
    batches.setdefault(o.data.materials[0],[]).append(copy)
exports=[]
for mat,objects in batches.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name='Exhibit pedestal '+mat.name;exports.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in exports:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/time-exhibit-pedestal.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False)
print('EXHIBIT_PEDESTAL_OK radius=0.84 support_height=0.68')
