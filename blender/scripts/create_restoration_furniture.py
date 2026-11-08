"""Reference-based restoration table, plinth and pillar. Blender 5.x, metres.

The table top is exactly Z=.805; the jar plinth top is Z=.91. Preserve these
heights because the existing puzzle's fragment and jar coordinates rely on them.
All decorative frames are real bevelled geometry. The supplied material swatch
is the stone colour texture. The supplied screen video is handled by the game.
"""
from pathlib import Path
from math import pi,sin,cos
import sys
import bpy
from mathutils import Vector

ROOT=Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene
scene.unit_settings.system='METRIC'

def material(name,color,metal=0,rough=.5):
    mat=bpy.data.materials.new(name);mat.diffuse_color=(*color,1);mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=(*color,1)
    bsdf.inputs['Metallic'].default_value=metal
    bsdf.inputs['Roughness'].default_value=rough
    return mat

wood=material('Dark walnut frame',(.16,.068,.025),0,.48)
wood_edge=material('Walnut edge highlight',(.25,.115,.044),0,.43)
gold=material('Brass inlay',(.68,.40,.13),.55,.42)
dark_gold=material('Aged bronze band',(.31,.17,.065),.48,.48)
stone=material('Warm ivory limestone',(.76,.64,.46),0,.68)
image=bpy.data.images.load(str(ROOT/'public/textures/restoration/stone.webp'));image.pack()
tex=stone.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
stone.node_tree.links.new(tex.outputs['Color'],stone.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])

def cube(name,location,scale,mat,bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1,location=location)
    obj=bpy.context.object;obj.name=name;obj.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod=obj.modifiers.new('Crafted edge bevel','BEVEL');mod.width=bevel;mod.segments=3
        obj.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return obj

def line(name,points,mat=gold,r=.008,closed=False):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=r;data.bevel_resolution=2
    spline=data.splines.new('POLY');spline.points.add(len(points)-1)
    for point,co in zip(spline.points,points):point.co=(*co,1)
    spline.use_cyclic_u=closed
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.data.materials.append(mat)
    return obj

def circle(name,r,z,mat=gold,tube=.01):
    return line(name,[(r*cos(i*2*pi/128),r*sin(i*2*pi/128),z) for i in range(128)],mat,tube,True)

def profile(name,points,mat):
    n=128;verts=[(r*cos(i*2*pi/n),r*sin(i*2*pi/n),z) for r,z in points for i in range(n)]
    faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(len(points)-1) for i in range(n)]
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    uv=data.uv_layers.new(name='Cylindrical stone UV')
    for face in data.polygons:
        face.use_smooth=True
        for loop_i in face.loop_indices:
            p=data.vertices[data.loops[loop_i].vertex_index].co
            uv.data[loop_i].uv=((__import__('math').atan2(p.y,p.x)/(2*pi))%1,p.z)
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.data.materials.append(mat)
    return obj

def corner_fret(name,origin,horizontal,vertical,size=.12):
    origin,horizontal,vertical=Vector(origin),Vector(horizontal),Vector(vertical)
    line(name,[tuple(origin+horizontal*x*size+vertical*y*size) for x,y in [(0,1),(0,0),(1,0),(1,.5),(.5,.5),(.5,1)]],gold,.009)

objects={}
def capture(name,start):objects[name]=[o for o in scene.objects if o.as_pointer() not in start]
def before():return {o.as_pointer() for o in scene.objects}

start=before()
cube('Table walnut tabletop', (0,0,.715),(2.6,2.8,.14),wood_edge,.035)
cube('Inset limestone slab',(0,0,.78),(2.42,2.62,.05),stone,.012)
cube('Table apron',(0,0,.57),(2.32,2.48,.18),wood,.018)
for x in [-1.04,1.04]:
    for y in [-1.13,1.13]:
        cube('Square walnut leg',(x,y,.29),(.22,.22,.58),wood,.018)
        cube('Foot moulding',(x,y,.06),(.25,.25,.10),wood_edge,.012)
for y in [-1.252,1.252]:
    line('Apron brass line',[(-1.14,y,.62),(1.14,y,.62)],gold,.008)
    for sx in [-1,1]:corner_fret('Table front corner fret',(sx*1.13,y,.49),(-sx,0,0),(0,0,1),.11)
for x in [-1.172,1.172]:
    line('Apron side brass line',[(x,-1.21,.62),(x,1.21,.62)],gold,.008)
    for sy in [-1,1]:corner_fret('Table side corner fret',(x,sy*1.20,.49),(0,-sy,0),(0,0,1),.11)
capture('restoration-table',start)

start=before()
profile('Plinth limestone body',[(0,.02),(1.07,.02),(1.12,.05),(1.12,.10),(1.05,.15),(1.015,.19),(1.015,.75),(1.05,.79),(1.09,.83),(1.09,.88),(1.06,.91),(0,.91)],stone)
for z,r in [(.12,1.085),(.18,1.025),(.75,1.026),(.825,1.087)]:circle('Circular bronze moulding',r,z,dark_gold,.015)
circle('Upper brass seam',1.092,.865,gold,.008)
circle('Top engraved inlay',.835,.912,gold,.008)
for i in range(8):
    a=i*pi/4
    for z,direction in [(.235,1),(.695,-1)]:
        pts=[]
        for u,v in [(0,.10),(0,0),(.10,0),(.10,.05),(.05,.05),(.05,.10)]:
            angle=a+u/1.026
            pts.append((1.026*cos(angle),1.026*sin(angle),z+v*direction))
        line('Plinth key corner',pts,gold,.007)
    line('Plinth vertical brass seam',[(1.026*cos(a),1.026*sin(a),.24),(1.026*cos(a),1.026*sin(a),.70)],gold,.006)
capture('restoration-plinth',start)

start=before()
cube('Pillar walnut foot',(0,0,.13),(.80,.88,.26),wood,.025)
cube('Pillar foot cap',(0,0,.30),(.72,.80,.08),wood_edge,.015)
cube('Pillar shaft',(0,0,2.12),(.56,.64,3.56),wood,.018)
for y in [-.328,.328]:
    cube('Pillar inset stone face',(0,y,2.12),(.46,.022,3.38),stone,.008)
    for sx in [-1,1]:
        line('Pillar front upright',[(sx*.21,y*1.04,.49),(sx*.21,y*1.04,3.75)],gold,.007)
        for z,sy in [(.49,1),(3.75,-1)]:corner_fret('Pillar corner fret',(sx*.205,y*1.05,z),(-sx,0,0),(0,0,sy),.095)
for x in [-.288,.288]:
    cube('Pillar inset stone side',(x,0,2.12),(.022,.54,3.38),stone,.008)
    for sy in [-1,1]:
        line('Pillar side upright',[(x*1.04,sy*.25,.49),(x*1.04,sy*.25,3.75)],gold,.007)
        for z,sz in [(.49,1),(3.75,-1)]:corner_fret('Pillar side fret',(x*1.05,sy*.245,z),(0,-sy,0),(0,0,sz),.095)
for z,w,d,h,mat in [(3.94,.65,.73,.12,gold),(4.06,.76,.84,.16,wood),(4.18,.82,.90,.10,wood_edge),(4.25,.76,.84,.04,gold)]:cube('Pillar capital',(0,0,z),(w,d,h),mat,.015)
capture('restoration-pillar',start)

scene['reference']='User reference sheet, 2026-11-08. Decorative props only; storage jar and puzzle geometry remain unchanged.'
scene['heights']='Table .805 m; plinth .91 m; pillar 4.27 m. Origin at floor.'
(ROOT/'blender/blend').mkdir(parents=True,exist_ok=True)
for name,parts in objects.items():
    for obj in parts:obj.location.x += {'restoration-table':-3.2,'restoration-plinth':0,'restoration-pillar':3.2}[name]
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/blend/restoration-furniture.blend'),compress=True)
for name,parts in objects.items():
    for obj in parts:obj.location.x -= {'restoration-table':-3.2,'restoration-plinth':0,'restoration-pillar':3.2}[name]
for name,parts in objects.items():
    for obj in scene.objects:obj.hide_set(obj not in parts)
    for obj in parts:
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        if obj.type=='CURVE':bpy.ops.object.convert(target='MESH')
        for mod in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
    for mat in [wood,wood_edge,gold,dark_gold,stone]:
        members=[o for o in scene.objects if not o.hide_get() and o.type=='MESH' and o.data.materials and o.data.materials[0]==mat]
        if not members:continue
        bpy.ops.object.select_all(action='DESELECT')
        for obj in members:obj.select_set(True)
        bpy.context.view_layer.objects.active=members[0];bpy.ops.object.join();members[0].name=name+'_'+mat.name
    bpy.ops.object.select_all(action='DESELECT')
    for obj in scene.objects:
        if not obj.hide_get():obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models'/f'{name}.glb'),export_format='GLB',use_selection=True,export_yup=True,export_cameras=False,export_lights=False)
print('Saved editable furniture source and exported three independent GLBs.')


