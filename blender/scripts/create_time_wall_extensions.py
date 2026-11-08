"""Two curved masonry wings continuing the existing Chapter 3 block courses.
Original arc remains unchanged. Each wing exports separately for camera cutaway.
"""
import bpy,math,random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
def mat(name,color,metal=0,texture=None):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=.65
    if texture:
        t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(ROOT/'public/textures/time-ruins'/texture),check_existing=True);m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
    return m
stone=mat('Weathered limestone',(.24,.22,.17),texture='stone.jpg')
bronze=mat('Aged bronze',(.43,.25,.085),.72,'bronze.jpg')
gold=mat('Worn gold edges',(.64,.37,.12),.68)
frieze=mat('Turquoise and gold frieze',(.32,.25,.13),.22,'frieze.jpg')
collections={}
def finish(o,name,material,bevel=.025):
    o.name=name
    for c in list(o.users_collection):c.objects.unlink(o)
    current.objects.link(o);o.data.materials.append(material)
    if bevel:
        b=o.modifiers.new('Worn edges','BEVEL');b.width=bevel;b.segments=2;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o
def box(name,x,y,z,sx,sy,sz,material,angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y));o=bpy.context.object;o.dimensions=(sx,sz,sy);o.rotation_euler.z=-angle
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,material)
def cyl(name,x,y,z,r,h,material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=h,location=(x,-z,y));return finish(bpy.context.object,name,material)
def band(name,r,y,h,start,end,material,repeat=1,offset=0):
    n=40;vertices=[];faces=[]
    for i in range(n+1):
        a=start+(end-start)*i/n
        vertices.extend([(r*math.sin(a),r*math.cos(a),y-h/2),(r*math.sin(a),r*math.cos(a),y+h/2)])
    for i in range(n):faces.append((2*i,2*i+1,2*i+3,2*i+2))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update();uv=mesh.uv_layers.new()
    for poly in mesh.polygons:
        for li,vi in zip(poly.loop_indices,poly.vertices):uv.data[li].uv=(offset+vi//2/n*repeat,vi%2)
    o=bpy.data.objects.new(name,mesh);current.objects.link(o);o.data.materials.append(material)

for side,columns,start,end in [('left',range(-5,0),-2.46,-1.64),('right',range(19,24),1.64,2.40)]:
    current=bpy.data.collections.new('Curved wall '+side);scene.collection.children.link(current);collections[side]=current
    for row in range(15):
        for col in columns:
            if row>12 and (col+row)%7==0:continue
            a=-1.56+(col+(row%2)*.5)*.165;r=7.35+random.Random(9000+row*100+col).uniform(-.025,.025)
            box('Curved extension masonry',r*math.sin(a),.34+row*.65,-r*math.cos(a),1.16,.61,.49,stone,-a)
    repeat=(end-start)*5/3.28;offset=-repeat if side=='left' else 5
    for y,h in [(5.53,1.15),(8.67,.94),(.56,.65)]:band('Continuous turquoise Greek key frieze',7.075,y,h,start,end,frieze,repeat,offset)
    for y in (1.0,4.90,6.13):band('Curved gilded molding',7.02,y,.065,start,end,gold)
    a=(-1 if side=='left' else 1)*2.15;x=6.65*math.sin(a);z=-6.65*math.cos(a)
    for y,r,h,m in [(.22,.58,.42,stone),(.46,.48,.12,bronze),(.60,.40,.16,stone),(2.55,.31,3.8,stone),(4.49,.41,.12,bronze),(4.65,.49,.2,stone)]:cyl('Extension column',x,y,z,r,h,m)
    box('Column capital',x,4.90,z,1.07,.31,.95,stone,-a)

for image in bpy.data.images:
    if image.filepath:image.pack()
bpy.ops.object.camera_add(location=(0,-15,10));camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,3))-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(0,-6,12));bpy.context.object.data.energy=1500;bpy.context.object.data.size=8
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/blend/time-wall-extensions.blend'),compress=True)
dg=bpy.context.evaluated_depsgraph_get()
for side,collection in collections.items():
    batches={}
    for original in list(collection.objects):
        mesh=bpy.data.meshes.new_from_object(original.evaluated_get(dg),depsgraph=dg);o=bpy.data.objects.new('Export',mesh);scene.collection.objects.link(o);o.matrix_world=original.matrix_world.copy()
        batches.setdefault(original.data.materials[0],[]).append(o)
    exports=[]
    for material,objects in batches.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name='Wall '+side+' '+material.name;exports.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in exports:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models'/('time-ruins-wall-'+side+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_animations=False)
    for o in exports:bpy.data.objects.remove(o,do_unlink=True)
print('CURVED_WALL_EXTENSIONS_OK')
