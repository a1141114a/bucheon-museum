"""Editable Chapter 3 environment. Blender 5.x, no external addons.

Run: blender --background --python blender/scripts/create_time_ruins.py
Sculptural scenery is fictional and is not presented as museum collection data.
The existing time-mechanism GLB, its named pivots and game rules are untouched.
"""
import bpy, math, random
from pathlib import Path
from mathutils import Matrix, Vector

ROOT=Path(__file__).resolve().parents[2]
random.seed(731)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.world=bpy.data.worlds.new('Ruins preview world')
scene.world.color=(.06,.055,.04)
assets={}
current=None

def xyz(p): return (p[0],-p[2],p[1])
def material(name,color,metal=0,rough=.7,texture=None):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if texture:
        t=m.node_tree.nodes.new('ShaderNodeTexImage')
        t.image=bpy.data.images.load(str(ROOT/'public/textures/time-ruins'/texture),check_existing=True)
        m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
    return m

stone=material('Weathered limestone',(.24,.22,.17),texture='stone.jpg')
bronze=material('Aged bronze',(.43,.25,.085),.72,.53,'bronze.jpg')
gold=material('Worn gold edges',(.64,.37,.12),.68,.47)
dark=material('Recessed stone',(.075,.082,.069),.08,.87)
moss=material('Olive moss',(.045,.075,.022),0,.96)
enamel=material('Turquoise patina',(.032,.19,.18),.28,.65)
ivory=material('Aged tusk stone',(.48,.39,.22),.28,.61)
frieze=material('Turquoise and gold masonry frieze',(.32,.25,.13),.22,.7,'frieze.jpg')

def asset(name):
    global current
    current=bpy.data.collections.new(name);scene.collection.children.link(current);assets[name]=current
def finish(o,name,mat,bevel=0):
    o.name=name
    for c in list(o.users_collection): c.objects.unlink(o)
    current.objects.link(o);o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('Soft worn edges','BEVEL');mod.width=bevel;mod.segments=2
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o
def box(name,pos,size,mat=stone,angle=0,bevel=.035):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(pos))
    o=bpy.context.object;o.dimensions=(size[0],size[2],size[1]);o.rotation_euler.z=-angle
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,bevel)
def cyl(name,pos,r,depth,mat=bronze,verts=64,axis='y'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=xyz(pos))
    o=bpy.context.object
    if axis=='z':o.rotation_euler.x=math.pi/2
    return finish(o,name,mat,.012)
def tor(name,pos,r,t,mat=gold,axis='y',segments=80):
    bpy.ops.mesh.primitive_torus_add(major_segments=segments,minor_segments=8,major_radius=r,minor_radius=t,location=xyz(pos))
    o=bpy.context.object
    if axis=='z':o.rotation_euler.x=math.pi/2
    finish(o,name,mat)
    for f in o.data.polygons:f.use_smooth=True
    return o
def ell(name,pos,scale,mat=bronze):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=14,radius=1,location=xyz(pos))
    o=bpy.context.object;o.scale=(scale[0],scale[2],scale[1]);finish(o,name,mat)
    for f in o.data.polygons:f.use_smooth=True
    return o
def path(name,pts,width,mat=bronze):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=8;c.bevel_depth=width;c.bevel_resolution=3
    s=c.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
    for b,p in zip(s.bezier_points,pts):b.co=xyz(p);b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);current.objects.link(o);o.data.materials.append(mat)
    return o
def arc_band(name,r,y,h,start,end,mat,repeat=1):
    n=80;verts=[];faces=[]
    for i in range(n+1):
        a=start+(end-start)*i/n
        for v in (0,1):verts.append(xyz((r*math.sin(a),y+(v-.5)*h,-r*math.cos(a))))
    for i in range(n):faces.append((2*i,2*i+1,2*i+3,2*i+2))
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    uv=me.uv_layers.new()
    for poly in me.polygons:
        for li,vi in zip(poly.loop_indices,poly.vertices):uv.data[li].uv=(vi//2/n*repeat,vi%2)
    o=bpy.data.objects.new(name,me);current.objects.link(o);o.data.materials.append(mat)
    return o

asset('time-ruins-gear')
# True open wheel with bevelled trapezoidal teeth, radial spokes and layered hub.
for r,t,z,mat in [(1.0,.085,0,bronze),(.87,.028,.065,gold),(.69,.038,0,bronze),(.31,.06,.04,gold),(.21,.035,.085,gold)]:
    tor('Concentric bronze rim',(0,0,z),r,t,mat,'z')
for i in range(16):
    a=i*math.tau/16
    verts=[]
    for z in (-.085,.085):
        for r,off in [(1.00,-.075),(1.22,-.055),(1.22,.055),(1.00,.075)]:
            verts.append(xyz((r*math.sin(a+off),r*math.cos(a+off),z)))
    me=bpy.data.meshes.new('Gear tooth');me.from_pydata(verts,[],[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]);me.update()
    o=bpy.data.objects.new('Trapezoidal gear tooth',me);current.objects.link(o);finish(o,o.name,bronze,.015)
for i in range(8):
    a=i*math.tau/8
    o=box('Tapered radial spoke',(.53*math.sin(a),.53*math.cos(a),-.025),(.115,.69,.115),bronze,bevel=.025)
    o.rotation_euler.y=-a
    ell('Rim rivet',(.92*math.sin(a),.92*math.cos(a),.092),(.032,.032,.024),gold)
cyl('Sun hub',(0,0,.025),.23,.15,bronze,64,'z')
for i in range(16):
    a=i*math.tau/16
    o=box('Hub sunray',(.17*math.sin(a),.17*math.cos(a),.111),(.016,.08,.018),gold,bevel=.004);o.rotation_euler.y=-a
cyl('Hub jewel',(0,0,.13),.067,.03,enamel,32,'z')

asset('time-ruins-altar')
cyl('Circular carved stone foundation',(0,.10,0),2.13,.20,stone,96)
cyl('Stepped bronze footing',(0,.235,0),2.04,.07,bronze)
for i in range(16):
    a=i*math.tau/16
    box('Radial stone buttress',(1.74*math.sin(a),.62,1.74*math.cos(a)),(.26,.69,.42),stone,-a,.045)
    box('Bronze buttress face',(1.965*math.sin(a),.61,1.965*math.cos(a)),(.18,.38,.027),bronze,-a,.015)
for y,r,t in [(.31,1.98,.035),(.96,1.93,.045),(1.06,1.91,.045),(1.12,1.83,.032)]:tor('Continuous altar rim',(0,y,0),r,t,gold)
# Rim is open in the centre; does not cover interactive annuli or letters.
for i in range(48):
    a=i*math.tau/48
    box('Rim engraved notch',(1.86*math.sin(a),1.105,1.86*math.cos(a)),(.024,.012,.07),bronze,-a,.003)

asset('time-ruins-elephant')
cyl('Sculpture stone base',(0,.1,0),.67,.2,stone,12)
tor('Sculpture base gilding',(0,.23,0),.53,.035)
cyl('Sculpture pedestal',(0,.96,0),.40,1.42,stone,12)
for y in (.32,1.62):cyl('Pedestal capital',(0,y,0),.49,.12,bronze,12)
ell('Elephant forehead',(0,2.10,0),(.40,.46,.29))
for side in (-1,1):
    ear=ell('Fan shaped elephant ear',(side*.43,2.13,-.025),(.32,.41,.105));ear.rotation_euler.y=side*.2
    ell('Raised ear edge',(side*.46,2.15,.055),(.21,.29,.052),bronze)
    ell('Cheek',(side*.235,1.98,.15),(.16,.21,.16))
    ell('Brow',(side*.18,2.22,.245),(.16,.075,.06),gold)
    ell('Inset eye',(side*.20,2.14,.275),(.042,.031,.023),dark)
    path('Curved stone tusk',[(side*.26,1.98,.22),(side*.32,1.78,.37),(side*.35,1.68,.54),(side*.32,1.77,.65)],.047,ivory)
path('Long curved elephant trunk',[(0,2.14,.27),(0,1.96,.40),(0,1.68,.44),(.025,1.39,.47),(.07,1.26,.58),(.16,1.35,.65)],.105)
for i in range(8):
    y=2.06-i*.085
    path('Trunk fold',[(-.075,y,.484),(-.025,y-.012,.50),(.06,y,.486)],.009,gold)
ell('Crown crest',(0,2.42,.19),(.13,.11,.047),gold)

asset('time-ruins-architecture')
# Semicircular block masonry. Foreground is open for orbit camera visibility.
for row in range(15):
    for col in range(19):
        a=-1.56+(col+(row%2)*.5)*.165
        if row>12 and (col+row)%7==0:continue
        r=7.35+random.uniform(-.025,.025)
        o=box('Individual weathered wall block',(r*math.sin(a),.34+row*.65,-r*math.cos(a)),(1.16,.61,.49),stone,-a,.045)
arc_band('Upper turquoise and Greek key band',7.075,5.53,1.15,-1.64,1.64,frieze,5)
arc_band('High chamber frieze',7.075,8.67,.94,-1.64,1.64,frieze,5)
arc_band('Low turquoise and Greek key band',7.075,.56,.65,-1.64,1.64,frieze,5)
for y in (1.0,4.90,6.13):
    arc_band('Curved gilded molding',7.02,y,.065,-1.64,1.64,gold,1)
for a in (-1.12,-.58,.58,1.12):
    x=6.65*math.sin(a);z=-6.65*math.cos(a)
    cyl('Column stone foot',(x,.22,z),.58,.42,stone,16)
    for y,r,d,mat in [(.46,.48,.12,bronze),(.60,.40,.16,stone),(2.55,.31,3.8,stone),(4.49,.41,.12,bronze),(4.65,.49,.2,stone)]:
        cyl('Ancient column section',(x,y,z),r,d,mat,16)
    for y in (.68,4.40):tor('Column ring inlay',(x,y,z),.33,.033,gold)
    box('Column projecting capital',(x,4.90,z),(1.07,.31,.95),stone,-a,.035)
# Broken stepped terraces outside the play zone.
for side in (-1,1):
    for step in range(3):
        for j in range(5):
            box('Broken terrace stone',(side*(3.25+step*.69),.10+step*.13,-3.15+j*.79),( .66,.20+step*.26,.73),stone,random.uniform(-.025,.025),.05)
for i in range(76):
    a=random.uniform(-1.5,1.5);r=random.uniform(5.55,6.9)
    x=r*math.sin(a);z=-r*math.cos(a)
    size=random.uniform(.17,.50)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=xyz((x,size*.40,z)))
    o=bpy.context.object;o.scale=(size,size*random.uniform(.6,1.2),size*.65)
    o.rotation_euler=(random.random(),random.random(),random.random());finish(o,'Broken angular rubble',stone)
    if i%2==0:ell('Moss on rubble',(x,size*.70,z),(size*.8,.012,size*.6),moss)
for side in (-1,1):
    for j in range(4):
        box('Fragment of ruined wall',(side*5.25,.31+j*.53,-1.8-j*.13),(.76,.49,.57),stone,side*.12,.05)

asset('time-ruins-chain')
for i in range(22):
    o=tor('Interlocking chain link',(0,i*.104,0),.062,.012,bronze,'z',16)
    o.scale.y=1.40
    if i%2:o.rotation_euler.z=math.pi/2

# Export copies only; original objects stay separately editable.
dg=bpy.context.evaluated_depsgraph_get()
for name,collection in assets.items():
    copies=[]
    for original in list(collection.objects):
        if original.type not in ('MESH','CURVE'):continue
        mesh=bpy.data.meshes.new_from_object(original.evaluated_get(dg),depsgraph=dg)
        o=bpy.data.objects.new(name+' export',mesh);scene.collection.objects.link(o)
        o.matrix_world=original.matrix_world.copy();copies.append(o)
    # Group material batches: keep draw calls small while .blend stays editable.
    merged=[]
    batches={mat:[o for o in copies if o.data.materials and o.data.materials[0]==mat] for mat in (stone,bronze,gold,dark,moss,enamel,ivory,frieze)}
    for mat in (stone,bronze,gold,dark,moss,enamel,ivory,frieze):
        group=batches[mat]
        if not group:continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in group:o.select_set(True)
        bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join()
        o=bpy.context.object;o.name=name+' '+mat.name;merged.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in merged:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models'/(name+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_animations=False)
    for o in merged:bpy.data.objects.remove(o,do_unlink=True)

# Compose a useful Blender preview from linked copies of the modular sources.
preview=bpy.data.collections.new('Assembled chamber preview');scene.collection.children.link(preview)
for name in ('time-ruins-gear','time-ruins-elephant','time-ruins-chain'):
    for o in assets[name].objects:o.hide_set(True)
def place(name,pos,scale=1):
    transform=Matrix.Translation(xyz(pos)) @ Matrix.Scale(scale,4)
    for original in assets[name].objects:
        copy=original.copy();copy.data=original.data;preview.objects.link(copy)
        copy.matrix_world=transform @ original.matrix_world;copy.hide_set(False)
place('time-ruins-gear',(0,4.25,-6.05),1.71)
for side in (-1,1):
    place('time-ruins-gear',(side*2.65,2.30,-5.55),1.46)
    place('time-ruins-elephant',(side*3.18,0,-4.85),1.2)
    place('time-ruins-gear',(side*5.65,3.12,-3.4),.67)
    place('time-ruins-gear',(side*5,4.30,-3.65),.34)
    for x in (side*5.65-.27,side*5.65+.27):place('time-ruins-chain',(x,3.73,-3.39))
    place('time-ruins-chain',(side*5,4.65,-3.65))
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models/time-mechanism.glb'))
for image in bpy.data.images:
    if image.filepath:image.pack()
for o in scene.objects:o.select_set(False)
# Camera makes the .blend immediately usable for inspection or a preview render.
bpy.ops.object.camera_add(location=xyz((.2,6.1,12.4)))
camera=bpy.context.object;camera.name='Reference composition camera'
camera.rotation_euler=(Vector(xyz((0,2,-1)))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.lens=40;scene.camera=camera
for pos,power,size in [((0,7,1),1700,7),((0,5,-3),850,4)]:
    bpy.ops.object.light_add(type='AREA',location=xyz(pos))
    light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(Vector(xyz((0,0,-2)))-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.resolution_percentage=100
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/blend/time-ruins.blend'),compress=True)
print('TIME_RUINS_EXPORT_OK',list(assets))
