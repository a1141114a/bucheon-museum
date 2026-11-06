"""Build editable Chapter 2 props and export three optimized GLBs.

Run with blender --background --python blender/scripts/create_gallery_treasure.py
The scene uses meters, +Z up and -Y toward the front of each prop.
"""
from math import cos, pi, sin
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def material(name, color, metal=0, roughness=.45, alpha=1):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, alpha)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metal
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Alpha"].default_value = alpha
    if alpha < 1:
        mat.surface_render_method = 'DITHERED'
    return mat


def surface(mat, pattern, dark, light):
    rng = np.random.default_rng(72)
    n = 256
    y, x = np.mgrid[0:1:complex(n), 0:1:complex(n)]
    noise = rng.random((n, n))
    if pattern == 'wood':
        phase = 69*y + 3*np.sin(5*x + 4*y) + 1.6*np.sin(13*x - 2*y)
        weight = np.clip(.42+.18*np.sin(phase)+.09*np.sin(4*phase)+.23*noise, 0, 1)
    else:
        phase = 18*x+13*y+2*np.sin(11*y-4*x)+.8*np.sin(31*x+14*y)
        veins = np.exp(-np.abs(np.sin(phase))*14)
        weight = np.clip(.25+.20*np.sin(phase)+.17*noise+.38*veins,0,1)
    rgb = np.array(dark) + weight[:,:,None]*(np.array(light)-np.array(dark))
    rgba = np.concatenate((rgb, np.ones((n,n,1))), axis=2).astype(np.float32)
    image = bpy.data.images.new(mat.name+' — baked pattern',width=n,height=n,alpha=True)
    image.colorspace_settings.name = 'sRGB'
    image.pixels.foreach_set(rgba.ravel())
    image.pack()
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image=image
    mat.node_tree.links.new(tex.outputs['Color'],mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])


brass=material('Brushed antique brass',(.57,.32,.105),.62,.34)
gold=material('Polished raised gold',(.83,.54,.17),.66,.27)
shadow_gold=material('Patinated bronze recess',(.22,.102,.033),.5,.42)
stone=material('Ivory veined limestone',(.56,.43,.30),0,.57)
marble=material('Noir veined marble',(.12,.10,.09),.1,.38)
wood=material('Dark worn walnut',(.18,.079,.035),0,.53)
wood_inside=material('Walnut inside',(.12,.045,.021),0,.63)
velvet=material('Crimson velvet',(.28,.016,.027),0,.86)
glass=material('Tinted museum glass',(.59,.77,.73),.12,.16,.11)
black=material('Shadow in keyhole',(.014,.008,.004),0,.88)
lamp=material('Warm cabinet luminaires',(.94,.71,.35),0,.3)
lamp.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(1,.62,.24,1)
lamp.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=2
surface(stone,'stone',(.55,.43,.30),(.88,.77,.61))
surface(marble,'stone',(.08,.065,.058),(.38,.30,.23))
surface(wood,'wood',(.13,.061,.025),(.46,.27,.13))


def collection(name):
    result=bpy.data.collections.new(name)
    scene.collection.children.link(result)
    return result


def place(obj, name, coll, mat=None, parent=None):
    obj.name=name
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    coll.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent=parent
        obj.matrix_parent_inverse=parent.matrix_world.inverted()
    return obj


def bevel(obj, amount):
    if amount:
        edge=obj.modifiers.new('Rounded hand-finished edges','BEVEL')
        edge.width=amount
        edge.segments=3
        edge.limit_method='ANGLE'
        edge.harden_normals=True
        obj.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
    return obj


def block(coll,name,loc,size,mat,edge=.01,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    obj=bpy.context.object
    obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return bevel(place(obj,name,coll,mat,parent),edge)


def disc(coll,name,loc,radius,depth,mat,vertical=False,segments=48,parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments,radius=radius,depth=depth,location=loc,
        rotation=(pi/2,0,0) if vertical else (0,0,0))
    return bevel(place(bpy.context.object,name,coll,mat,parent),min(.006,depth/4))


def stud(coll,loc,mat=gold,radius=.022,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10,ring_count=6,radius=radius,location=loc)
    obj=place(bpy.context.object,'Hammered rivet',coll,mat,parent)
    for face in obj.data.polygons:
        face.use_smooth=True
    return obj


def stroke(coll,name,points,mat,width,parent=None,closed=False):
    curve=bpy.data.curves.new(name,'CURVE')
    curve.dimensions='3D'
    curve.resolution_u=8
    curve.bevel_depth=width
    curve.bevel_resolution=2
    path=curve.splines.new('POLY')
    path.points.add(len(points)-1)
    for point,xyz in zip(path.points,points):
        point.co=(*xyz,1)
    path.use_cyclic_u=closed
    return place(bpy.data.objects.new(name,curve),name,coll,mat,parent)


def relief(coll,name,outline,y,mat,thickness,parent=None):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([(x,y,z) for x,z in outline],[],[tuple(range(len(outline)))])
    mesh.update()
    obj=place(bpy.data.objects.new(name,mesh),name,coll,mat,parent)
    shell=obj.modifiers.new('Embossed thickness','SOLIDIFY')
    shell.thickness=thickness
    return bevel(obj,thickness*.35)


def stepped_border(w,h,r):
    return [(-w+r,h), (w-r,h), (w-r,h-r), (w,h-r), (w,-h+r), (w-r,-h+r),
        (w-r,-h),(-w+r,-h),(-w+r,-h+r),(-w,-h+r),(-w,h-r),(-w+r,h-r)]


cabinet=collection('01 • Museum display cabinet')
for z,w,d,h,mat in [
    (.13,3.28,2.55,.26,marble),(.027,3.30,2.57,.028,brass),(.254,3.30,2.57,.035,gold),
    (.302,2.58,1.87,.095,brass),(.38,2.53,1.82,.09,stone),(.755,2.40,1.73,.68,stone),
    (1.08,2.56,1.86,.078,brass),(1.145,2.64,1.95,.085,gold),
    (1.21,2.48,1.79,.08,stone),(1.27,1.92,1.30,.09,velvet),
    (3.13,2.63,1.94,.115,brass),(3.22,2.77,2.02,.095,shadow_gold),(3.279,2.80,2.06,.035,gold),
]:
    block(cabinet,'Layered plinth or crown', (0,0,z),(w,d,h),mat,.013)
for side in (-1,1):
    for y in (-.89,.89):
        block(cabinet,'Slim brass mullion',(1.25*side,y,2.15),(.048,.052,1.97),brass,.008)
    block(cabinet,'Side glass pane',(1.246*side,0,2.15),(.021,1.77,1.94),glass,.002)
for y in (-.888,.888):
    block(cabinet,'Glass pane',(0,y,2.15),(2.47,.019,1.94),glass,.002)
    block(cabinet,'Roof trim',(0,y,3.057),(2.55,.056,.043),gold,.007)
for x in (-.68,.68):
    disc(cabinet,'Inset spotlight bezel',(x,-.18,3.075),.092,.035,brass)
    disc(cabinet,'Lit lens',(x,-.18,3.052),.065,.011,lamp)
stroke(cabinet,'Inset frame inlay',[(x,-.872,.75+z) for x,z in stepped_border(1.09,.263,.07)],brass,.012,closed=True)
badge=[(x,.75+z) for x,z in stepped_border(.43,.135,.046)]
relief(cabinet,'Brass title plate',badge,-.906,shadow_gold,.021)
stroke(cabinet,'Raised title plate rim',[(x,-.919,z) for x,z in badge],gold,.013,closed=True)
for x in (-.365,.365):
    stud(cabinet,(x,-.922,.75),radius=.016)
for side in (-1,1):
    pattern=[(1.60,.063),(1.43,.063),(1.43,.10),(1.32,.10),(1.32,.19),(1.55,.19),
        (1.55,.102),(1.48,.102),(1.48,.146),(1.51,.146)]
    stroke(cabinet,'Greek-key base inlay',[(side*x,-1.282,z) for x,z in pattern],brass,.011)
stroke(cabinet,'Base inlaid border',[(-1.32,-1.282,.19),(1.32,-1.282,.19)],brass,.011)


chest=collection('02 • Arched treasure chest')
pivot=place(bpy.data.objects.new('ChestLid',None),'ChestLid',chest)
pivot.location=(0,.41,.47)
bpy.context.view_layer.update()
block(chest,'Velvet-lined bottom',(0,0,.065),(1.39,.82,.13),wood,.024)
block(chest,'Inner cushion',(0,0,.135),(1.24,.67,.035),velvet,.012)
for side in (-1,1):
    block(chest,'Chest end board',(side*.66,0,.255),(.11,.83,.38),wood,.018)
    for row in range(3):
        block(chest,'Horizontal walnut plank',(0,side*.377,.16+row*.111),(1.34,.094,.106),wood,.009)
    for height in (.09,.419):
        block(chest,'Wraparound brass trim',(0,side*.427,height),(1.43,.042,.088),brass,.012)
        block(chest,'Side brass trim',(side*.716,0,height),(.043,.86,.087),brass,.011)
        for x in (-.52,-.26,0,.26,.52):
            stud(chest,(x,side*.451,height),radius=.019)
    for y in (-.372,.372):
        block(chest,'Corner strap',(side*.711,y,.256),(.06,.112,.345),brass,.012)
        block(chest,'Corner plate',(side*.645,y*1.16,.255),(.10,.037,.35),brass,.009)


def arch_strip(name,x0,x1,angle0,angle1,mat,radial_offset=0):
    samples=6
    verts=[]
    for x in (x0,x1):
        for j in range(samples+1):
            a=angle0+(angle1-angle0)*j/samples
            verts.append((x,(.424+radial_offset)*cos(a),.474+(.305+radial_offset)*sin(a)))
    faces=[(j,j+1,j+samples+2,j+samples+1) for j in range(samples)]
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    uv=mesh.uv_layers.new(name='Lid grain')
    for loop in mesh.loops:
        row,index=divmod(loop.vertex_index,samples+1)
        x=(x0,x1)[row]
        angle=angle0+(angle1-angle0)*index/samples
        uv.data[loop.index].uv=((x+.70)/1.4,angle/pi)
    obj=place(bpy.data.objects.new(name,mesh),name,chest,mat,pivot)
    shell=obj.modifiers.new('Board thickness','SOLIDIFY')
    shell.thickness=.027
    for face in mesh.polygons:
        face.use_smooth=True
    bevel(obj,.006)


for i in range(12):
    arch_strip('Curved walnut lid board',-.70,.70,i*pi/12+.008,(i+1)*pi/12-.008,wood)
for side in (-1,1):
    mesh=bpy.data.meshes.new('Arched end cap')
    verts=[(side*.69,.424*cos(i*pi/40),.474+.305*sin(i*pi/40)) for i in range(41)]
    mesh.from_pydata(verts,[],[tuple(range(41)) if side>0 else tuple(reversed(range(41)))])
    mesh.update()
    cap=place(bpy.data.objects.new('Arched end cap',mesh),'Arched end cap',chest,wood_inside,pivot)
    cap.modifiers.new('Solid end panel','SOLIDIFY').thickness=.026
for x in (-.633,-.24,.24,.633):
    for i in range(5):
        arch_strip('Forged arch strap',x-.038,x+.038,i*pi/5,(i+1)*pi/5,brass,.022)
    for theta in (.19,.58,1.03,1.55,2.03,2.52,2.94):
        stud(chest,(x,.451*cos(theta),.474+.333*sin(theta)),radius=.018,parent=pivot)
for side in (-1,1):
    block(chest,'Lid lip',(0,side*.435,.487),(1.47,.048,.078),gold,.011,pivot)
    block(chest,'Lid end trim',(side*.716,0,.487),(.061,.86,.078),brass,.011,pivot)
plate=[(-.127,.446),(-.096,.50),(0,.564),(.096,.50),(.127,.446),(.106,.394),(.131,.346),
    (.082,.301),(0,.247),(-.082,.301),(-.131,.346),(-.106,.394)]
relief(chest,'Ornate lock escutcheon',plate,-.460,brass,.022)
stroke(chest,'Escutcheon beaded rim',[(x,-.477,z) for x,z in plate],gold,.008,closed=True)
disc(chest,'Keyhole head',(0,-.485,.418),.026,.007,black,vertical=True)
block(chest,'Keyhole stem',(0,-.486,.386),(.026,.008,.051),black,.004)
for side in (-1,1):
    points=[(side*(.48-.34*t+.045*sin(t*2*pi)),-.428,.175+.15*t+.028*sin(t*pi)) for t in np.linspace(0,1,27)]
    stroke(chest,'Inlaid vine scroll',points,brass,.010)
    for t in (.23,.42,.61,.78):
        x,_,z=points[int(t*26)]
        for direction in (-1,1):
            relief(chest,'Embossed leaf',[(x,z),(x+side*.032,z+direction*.024),
                (x+side*.066,z+direction*.034),(x+side*.049,z+direction*.008)],-.430,gold,.008)


coin=collection('03 • Single laurel coin')
disc(coin,'Coin blank',(0,0,0),.104,.025,brass,vertical=True,segments=64)
for side in (-1,1):
    y=side*.014
    for radius,width in ((.095,.004),(.084,.0013)):
        stroke(coin,'Raised circular rim',[(radius*cos(i*pi/32),y,radius*sin(i*pi/32))
            for i in range(64)],gold,width,closed=True)
for i in range(72):
    a=i*pi/36
    stroke(coin,'Milled edge groove',[(.103*cos(a),y,.103*sin(a)) for y in (-.010,.010)],shadow_gold,.00075)
profile=[(-.043,-.044),(-.025,-.034),(-.023,-.021),(-.035,-.005),(-.036,.018),(-.028,.035),
    (-.012,.046),(.010,.048),(.027,.039),(.031,.026),(.029,.017),(.039,.008),(.028,.002),
    (.029,-.008),(.024,-.011),(.022,-.021),(.006,-.024),(.006,-.035),(.022,-.048),(-.013,-.052)]
relief(coin,'Embossed profile',profile,-.016,gold,.0055)
stroke(coin,'Hair curls',[(x,-.021,z) for x,z in [(-.032,.008),(-.015,.022),(-.024,.027),(-.006,.033),(.009,.034)]],
    shadow_gold,.0015)
stud(coin,(.023,-.022,.016),shadow_gold,.0016)
for side in (-1,1):
    stem=[(side*.073*sin(t),-.017,-.067*cos(t)) for t in np.linspace(.18,2.05,26)]
    stroke(coin,'Laurel stem',stem,gold,.0019)
    for i in range(3,25,3):
        x,_,z=stem[i]
        for direction in (-1,1):
            relief(coin,'Stamped laurel leaf',[(x,z),(x+side*.006*direction,z+.009),
                (x+side*.013*direction,z+.014),(x+side*.009*direction,z+.002)],-.019,gold,.0014)


def export(coll, filename, groups):
    """Merge evaluated geometry for the game while keeping editable source pieces."""
    bpy.ops.object.select_all(action='DESELECT')
    depsgraph=bpy.context.evaluated_depsgraph_get()
    outputs=[]
    for name,source,parent in groups:
        copies=[]
        for obj in source:
            if obj.type not in {'MESH','CURVE'}:
                continue
            mesh=bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph),preserve_all_data_layers=True,depsgraph=depsgraph)
            copy=bpy.data.objects.new(obj.name,mesh)
            scene.collection.objects.link(copy)
            copy.matrix_world=obj.matrix_world.copy()
            copies.append(copy)
        bpy.ops.object.select_all(action='DESELECT')
        for copy in copies:
            copy.select_set(True)
        bpy.context.view_layer.objects.active=copies[0]
        bpy.ops.object.join()
        joined=bpy.context.object
        joined.name=name
        if parent:
            matrix=joined.matrix_world.copy()
            joined.parent=parent
            joined.matrix_world=matrix
        outputs.append(joined)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in outputs:
        obj.select_set(True)
    if coll==chest:
        pivot.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models'/filename),export_format='GLB',
        use_selection=True,export_apply=True,export_animations=False)
    for obj in outputs:
        bpy.data.objects.remove(obj,do_unlink=True)


bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/blend/gallery-treasure.blend'),compress=True)
export(cabinet,'gallery-treasure-cabinet.glb',[('Treasure cabinet',list(cabinet.objects),None)])
export(chest,'gallery-treasure-chest.glb',[
    ('Chest base',[obj for obj in chest.objects if obj.parent is None and obj!=pivot],None),
    ('Arched lid',list(pivot.children),pivot)])
export(coin,'gallery-treasure-coin.glb',[('Single gold coin',list(coin.objects),None)])
