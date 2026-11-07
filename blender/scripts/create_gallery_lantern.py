"""Editable octagonal museum lantern. Blender 5.x, meters, Z up.

Origin is the ceiling attachment; the fixture hangs down to Z=-1.74.
Run: blender --background --python blender/scripts/create_gallery_lantern.py
All ornaments are real meshes/curves. No lantern photograph is used.
"""
from pathlib import Path
from math import pi, sin, cos
import sys
import bpy
from mathutils import Vector

ROOT = Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'

def material(name,color,metal=0,rough=.4,emission=0):
    mat=bpy.data.materials.new(name)
    mat.diffuse_color=(*color,1)
    mat.use_nodes=True
    shader=mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Metallic'].default_value=metal
    shader.inputs['Roughness'].default_value=rough
    shader.inputs['Emission Color'].default_value=(*color,1)
    shader.inputs['Emission Strength'].default_value=emission
    return mat

brass=material('Antique bronze frame',(.32,.17,.065),.72,.3)
gold=material('Polished brass raised ornament',(.72,.42,.13),.7,.26)
recess=material('Dark patinated recess',(.09,.045,.019),.46,.5)
glass=material('Warm frosted glass — opaque mobile safe',(.98,.72,.36),0,.48,.75)
glow=material('Ivory diffuser', (1,.84,.55),0,.35,1.3)

def finish(obj,name,mat):
    obj.name=name
    obj.data.materials.append(mat)
    return obj

def cylinder(name,radius,depth,z,mat,vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=(0,0,z))
    obj=finish(bpy.context.object,name,mat)
    bevel=obj.modifiers.new('Soft machined edge','BEVEL');bevel.width=.008;bevel.segments=2
    obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return obj

def curve(name,points,mat,radius=.007,closed=False):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=1
    data.bevel_depth=radius;data.bevel_resolution=2
    poly=data.splines.new('POLY');poly.points.add(len(points)-1)
    for p,co in zip(poly.points,points):p.co=(*co,1)
    poly.use_cyclic_u=closed
    return finish(bpy.data.objects.new(name,data),name,mat)

def pipe(name,points,mat=brass,radius=.01,closed=False):
    obj=curve(name,points,mat,radius,closed);scene.collection.objects.link(obj);return obj

def ring(name,r,z,mat=gold,thickness=.012):
    return pipe(name,[(r*cos(i*2*pi/64),r*sin(i*2*pi/64),z) for i in range(64)],mat,thickness,True)

def octagon(name,r,z,mat=gold,thickness=.016):
    return pipe(name,[(r*cos(i*pi/4),r*sin(i*pi/4),z) for i in range(8)],mat,thickness,True)

def shell(name,levels,mat):
    vertices=[(r*cos(i*pi/4),r*sin(i*pi/4),z) for r,z in levels for i in range(8)]
    faces=[(level*8+i,(level+1)*8+i,(level+1)*8+(i+1)%8,level*8+(i+1)%8) for level in range(len(levels)-1) for i in range(8)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj);finish(obj,name,mat)
    return obj

cylinder('Ceiling rose',.23,.045,-.025,brass)
cylinder('Ceiling rose bead',.19,.025,-.055,gold)
cylinder('Suspension pin',.048,.10,-.11,gold)
ring('Rose concentric inlay',.165,-.039)
for i in range(5):
    points=[]
    for k in range(32):
        a=k*2*pi/32
        points.append((.045*cos(a) if i%2==0 else 0,.045*cos(a) if i%2 else 0,-.20-i*.085+.067*sin(a)))
    pipe(f'Interlocking chain link {i+1}',points,gold,.009,True)
cylinder('Chain socket',.075,.11,-.64,brass)
cylinder('Socket collar',.10,.025,-.695,gold)
shell('Faceted bronze roof',[(.12,-.70),(.42,-.75),(.65,-.91)],brass)
octagon('Roof crown moulding',.42,-.75)
octagon('Roof eave moulding',.675,-.915,gold,.025)
octagon('Roof shadow edge',.68,-.95,recess,.013)
shell('Eight frosted side panes',[(.63,-.96),(.63,-1.43)],glass)
octagon('Upper rim',.65,-.97,brass,.028)
octagon('Lower rim',.65,-1.43,brass,.028)
octagon('Upper golden seam',.664,-1.002,gold,.007)
octagon('Lower golden seam',.664,-1.399,gold,.007)
for i in range(8):
    a=i*pi/4
    pipe(f'Corner post {i+1}',[(.65*cos(a),.65*sin(a),-.96),(.65*cos(a),.65*sin(a),-1.43)],brass,.022)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,radius=.025,location=(.64*cos(a),.64*sin(a),-.89))
    finish(bpy.context.object,f'Roof acorn stud {i+1}',gold)
    # True raised eight-petal rosette, on each flat face of the octagon.
    normal=Vector((cos(a+pi/8),sin(a+pi/8),0));tangent=Vector((-normal.y,normal.x,0))
    origin=normal*(.63*cos(pi/8)+.006)+Vector((0,0,-1.20))
    def panel_point(x,y):return tuple(origin+tangent*x+Vector((0,0,y)))
    for petal in range(8):
        angle=petal*pi/4
        points=[]
        for j in range(20):
            t=j*2*pi/20
            length=.052+.052*cos(t)
            width=.027*sin(t)
            points.append(panel_point(length*cos(angle)-width*sin(angle),length*sin(angle)+width*cos(angle)))
        pipe(f'Face {i+1} petal {petal+1}',points,gold,.005,True)
    pipe(f'Face {i+1} rosette center',[panel_point(.018*cos(j*2*pi/24),.018*sin(j*2*pi/24)) for j in range(24)],brass,.005,True)
    for sx in [-1,1]:
        for sy in [-1,1]:
            pipe(f'Face {i+1} key fret {sx} {sy}',[panel_point(sx*x,sy*y) for x,y in [(.21,.175),(.16,.175),(.16,.13),(.185,.13),(.185,.15)]],brass,.006)
    # Roof ribs and lower diffuser ribs remain actual geometry.
    pipe(f'Roof radial rib {i+1}',[(.13*cos(a),.13*sin(a),-.70),(.42*cos(a),.42*sin(a),-.75),(.65*cos(a),.65*sin(a),-.91)],gold,.009)
    pipe(f'Diffuser rib {i+1}',[(.63*cos(a),.63*sin(a),-1.44),(.31*cos(a),.31*sin(a),-1.59)],brass,.014)
shell('Angled lower glass diffuser',[(.62,-1.445),(.30,-1.59)],glass)
cylinder('Bottom warm lens',.303,.014,-1.59,glow)
ring('Lower circular brass trim',.313,-1.595,gold,.015)
cylinder('Finial collar',.055,.045,-1.63,brass)
bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,radius=.065,location=(0,0,-1.685))
obj=finish(bpy.context.object,'Pendant finial',gold);obj.scale=(.7,.7,1)

scene['asset_role']='Fictional decorative lantern, made from user supplied scene reference; not a museum collection item.'
scene['coordinate_note']='Origin at ceiling. Three.js model extends Y=-1.75 to 0 after GLB axis conversion.'
for path in ['blender/blend','public/models']: (ROOT/path).mkdir(parents=True,exist_ok=True)
# Save the individually editable source before optimizing the runtime mesh.
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/blend/gallery-lantern.blend'))
for obj in list(scene.objects):
    if obj.type=='CURVE':
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        bpy.ops.object.convert(target='MESH')
for mat in [brass,gold,recess,glass,glow]:
    objects=[o for o in scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==mat]
    if not objects:continue
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True);bpy.context.view_layer.objects.active=obj
        for modifier in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join();objects[0].name='Lantern_'+mat.name
    for face in objects[0].data.polygons:face.use_smooth=True
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/gallery-lantern.glb'),export_format='GLB',export_yup=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
print('Lantern exported:',len(scene.objects),'runtime meshes;',sum(len(o.data.polygons) for o in scene.objects if o.type=='MESH'),'faces')


