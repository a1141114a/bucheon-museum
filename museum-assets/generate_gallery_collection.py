"""Reconstruct the eight second-batch gallery exhibits in Blender.

Usage: blender -b -t 4 --python generate_gallery_collection.py -- bcm-1754
Dimensions are meters. Source photographs are used as visual references only.
"""
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from generate_model import lathe, material, mesh, preview_scene, world_bounds


def color(a, b, t):
    t = min(1, max(0, t))
    return tuple(x+(y-x)*t for x,y in zip(a,b))


def tube(name, points, radius, surface, sides=10):
    path = [Vector(p) for p in points]
    verts, faces = [], []
    for i,p in enumerate(path):
        direction = (path[min(i+1,len(path)-1)]-path[max(0,i-1)]).normalized()
        ref = Vector((0,0,1)) if abs(direction.z)<.95 else Vector((0,1,0))
        u = direction.cross(ref).normalized()
        v = direction.cross(u)
        for j in range(sides):
            a=j*math.tau/sides
            verts.append(p+radius*(u*math.cos(a)+v*math.sin(a)))
            if i:
                k=(j+1)%sides
                faces.append(((i-1)*sides+j,(i-1)*sides+k,i*sides+k,i*sides+j))
    faces.extend([tuple(reversed(range(sides))),tuple(range(len(verts)-sides,len(verts)))])
    return mesh(name,verts,faces,surface)


def box(name, position, size, surface, bevel=.001):
    bpy.ops.mesh.primitive_cube_add(size=1,location=position)
    obj=bpy.context.object
    obj.name=name
    obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(surface)
    if bevel:
        mod=obj.modifiers.new('Rounded worn edges','BEVEL')
        mod.width=bevel
        mod.segments=3
        obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return obj


def oval(name, position, size, surface, rotation=0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=9,radius=1,location=position)
    obj=bpy.context.object
    obj.name=name
    obj.scale=size
    obj.rotation_euler.z=rotation
    obj.data.materials.append(surface)
    for face in obj.data.polygons:
        face.use_smooth=True
    return obj


def brown_glaze(name, dark, light, bands):
    surface=material(name,dark,.39,vertex_color=True)

    def shade(v):
        a=math.atan2(v.y,v.x)
        return color(dark,light,.46+.17*math.cos(v.z*bands)+.13*math.sin(7*a+v.z*88)+.07*math.sin(v.x*1800+v.y*770))
    return surface,shade


def bottle():
    clay,shade=brown_glaze('Brown slipped earthenware',(.022,.010,.006),(.087,.040,.019),370)
    profile=[(0,0),(.080,0),(.090,.006),(.104,.018),(.118,.046),(.129,.086),(.133,.127),
        (.131,.173),(.119,.211),(.098,.237),(.069,.257),(.040,.267),(.032,.276),(.033,.285),
        (.031,.290),(.024,.290),(.024,.278),(.028,.262),(.069,.248),(.104,.220),(.120,.184),
        (.125,.133),(.119,.079),(.095,.032),(.079,.011),(0,.011)]
    body=lathe('Medicine urine bottle | short mouth and rounded shoulder',profile,clay,shade,
        radius_offset=lambda a,z:.0013*math.sin(3*a+z*19),segments=80)
    spout=lathe('Small raised side spout',[(.021,0),(.018,.018),(.014,.035),(.010,.036),
        (.009,.032),(.014,.007),(.016,0),(.021,0)],clay,shade,segments=40)
    spout.location=(.096,-.011,.224)
    spout.rotation_euler.y=1.11
    return [body,spout]


def porcelain():
    white=material('Slightly blue white glaze',(.78,.82,.77),.22)
    cobalt=material('Cobalt decoration',(.018,.037,.116),.52)
    outside=[(0,0),(.081,0),(.083,.008),(.091,.023),(.122,.043),(.151,.064),
        (.178,.092),(.193,.124),(.198,.158),(.196,.195),(.186,.226),(.169,.257),
        (.151,.281),(.128,.302),(.104,.318),(.099,.326),(.102,.334),(.0975,.340)]
    inside=[(.090,.340),(.088,.332),(.090,.319),(.105,.304),(.133,.283),(.158,.257),
        (.174,.220),(.185,.179),(.185,.140),(.171,.099),(.142,.066),(.105,.039),(.081,.016),(0,.016)]
    objects=[lathe('1991 commemorative white porcelain vessel',outside+inside,white,segments=112)]
    # Abstract, deliberately non-legible strokes reproduce the visible layout without inventing a transcription.
    def surface_point(angle,z):
        for (r0,z0),(r1,z1) in zip(outside,outside[1:]):
            if z1>z0 and z0<=z<=z1:
                r=r0+(r1-r0)*(z-z0)/(z1-z0)+.0008
                return (r*math.sin(angle),-r*math.cos(angle),z)
        raise ValueError(z)
    strokes=[]
    for column in range(13):
        angle=-.45+column*.075
        for row in range(6+(column%3==0)):
            z=.109+row*.019
            d=.010+.002*((row+column)%3)
            strokes.extend([[(angle-d,z),(angle+d,z+.004)],
                [(angle+.003,z-.004),(angle-.002,z+.007)]])
    strokes.extend([[(-.92,.242),(-.87,.267),(-.77,.290),(-.73,.307)],
        [(-.87,.267),(-.99,.282),(-1.05,.296)],[(-.77,.290),(-.71,.277),(-.64,.279)]])
    verts,faces=[],[]
    for line in strokes:
        for (a0,z0),(a1,z1) in zip(line,line[1:]):
            i=len(verts)
            verts.extend(surface_point(a,z) for a,z in ((a0-.003,z0),(a0+.003,z0),(a1+.003,z1),(a1-.003,z1)))
            faces.append((i,i+1,i+2,i+3))
    objects.append(mesh('Cobalt brushwork | approximate decoration layout',verts,faces,cobalt))
    return objects


def bowl():
    clay,shade=brown_glaze('Dark brown onggi glaze',(.045,.020,.010),(.16,.084,.040),930)
    profile=[(0,0),(.027,0),(.031,.003),(.035,.010),(.045,.019),(.056,.033),
        (.063,.051),(.065,.067),(.064,.077),(.062,.080),(.0585,.079),(.0585,.075),
        (.060,.066),(.057,.051),(.050,.035),(.039,.020),(.026,.011),(0,.010)]
    return [lathe('Onggi rice bowl | hollow with a short foot',profile,clay,shade,
        radius_offset=lambda a,z:.00065*math.sin(a*3+z*20),segments=88)]


def tool():
    pale=material('Pale photographed tool surface; material unconfirmed',(.52,.40,.28),.63,vertex_color=True)
    dark=material('Dark socket interiors',(.025,.017,.011),.67)
    metal=material('Brown metal ring reconstruction',(.25,.13,.056),.47,.66)
    sections=[(-.046,.006,.001,.001),(-.031,.014,.004,.003),(-.014,.022,.006,.004),
        (.003,.026,.007,.006),(.022,.025,.009,.007),(.037,.022,.010,.008),(.046,.019,.008,.007)]
    verts=[(x,ry*math.cos(a*math.tau/16),z+rz*math.sin(a*math.tau/16))
        for x,z,ry,rz in sections for a in range(16)]
    faces=[(i*16+j,i*16+(j+1)%16,(i+1)*16+(j+1)%16,(i+1)*16+j)
        for i in range(len(sections)-1) for j in range(16)]
    faces.extend([tuple(range(16)),tuple(range(len(verts)-16,len(verts)))])
    obj=mesh('Tapered curved arrowhead tool',verts,faces,pale,
        lambda v:color((.35,.24,.15),(.68,.54,.37),.62+.16*math.sin(v.x*840+v.z*130)))
    sockets=[]
    for x,z in [(.012,.026),(.031,.023)]:
        sockets.append(box('Visible dark socket', (x,-.0073,z),(.007,.0018,.007),dark,.00065))
    ring=tube('Small attachment ring',[(-.008+.007*math.cos(i*math.tau/36),-.007,
        .031+.006*math.sin(i*math.tau/36)) for i in range(37)],.0014,metal)
    return [obj,ring,*sockets]


def thumb_ring():
    horn=material('Dark polished horn',(.065,.040,.020),.38,vertex_color=True)
    n=72
    verts=[]
    for section in range(12):
        phi=math.tau*section/12
        weight=(1+math.cos(phi))/2
        for j in range(n):
            theta=j*math.tau/n
            sine=math.sin(theta)
            outer_x=.015*math.cos(theta)*(1+.26*min(0,sine))
            inner_x=.0088*math.cos(theta)
            x=inner_x+(outer_x-inner_x)*weight
            outer_z=.025+.025*sine
            inner_z=.034+.010*sine
            z=inner_z+(outer_z-inner_z)*weight
            y=.0048*math.sin(phi)+.0038*max(0,-sine)*weight
            verts.append((x,y,z))
    faces=[(s*n+j,s*n+(j+1)%n,((s+1)%12)*n+(j+1)%n,((s+1)%12)*n+j)
        for s in range(12) for j in range(n)]
    return [mesh('Female archery thumb ring | tapered horn shield',verts,faces,horn,
        lambda v:color((.019,.011,.006),(.16,.098,.050),.36+.31*math.sin(v.z*158+v.y*40)+.10*math.cos(v.x*920)))]


def bell():
    patina=material('Dark patinated cast surface; alloy unconfirmed',(.048,.049,.044),.66,.48,vertex_color=True)
    iron=material('Dark hanger and clapper reconstruction',(.035,.031,.025),.58,.42)
    profile=[(.120,.051),(.119,.057),(.113,.065),(.111,.067),(.104,.077),(.099,.084),(.101,.087),
        (.095,.094),(.085,.109),(.076,.129),(.067,.151),(.061,.175),(.058,.188),
        (.051,.196),(.038,.202),(.023,.205),(0,.207),(0,.194),(.031,.193),(.044,.182),
        (.052,.158),(.063,.129),(.081,.097),(.101,.062),(.109,.051),(.120,.051)]
    shell=lathe('School bell | flared hollow body and cast bands',profile,patina,
        lambda v:color((.027,.028,.026),(.086,.088,.081),.48+.19*math.cos(v.z*630)+.11*math.sin(v.x*1000)),segments=92)
    hanger=tube('Suspension eye',[(.014*math.cos(i*math.tau/36),0,.218+.017*math.sin(i*math.tau/36))
        for i in range(37)],.004,iron)
    arm=tube('Hanging clapper rod',[(0,0,.155),(0,0,.037),(.003,0,.014)],.006,iron)
    clapper=oval('Rounded clapper',(.003,0,.019),(.022,.019,.012),iron)
    tail=tube('Clapper pull loop',[(.003+.006*math.cos(i*math.tau/24),0,.006+.007*math.sin(i*math.tau/24))
        for i in range(25)],.0025,iron)
    return [shell,hanger,arm,clapper,tail]


def inkstone():
    stone=material('Charcoal stone appearance; composition unconfirmed',(.036,.036,.033),.72)
    relief=material('Sculpted crab relief',(.056,.056,.050),.58)
    objects=[box('Rectangular inkstone', (0,0,.010),(.20,.135,.020),stone,.004)]
    for y in (-.0635,.0635):
        objects.append(box('Raised inkstone rim',(0,y,.020),(.193,.004,.006),stone,.0016))
    for x in (-.096,.096):
        objects.append(box('Raised inkstone rim',(x,0,.020),(.004,.125,.006),stone,.0016))
    for cx,cy,scale in [(.042,.031,1),(.066,-.011,.86)]:
        objects.append(oval('Crab carapace',(cx,cy,.025),(.016*scale,.011*scale,.0052),relief,-.5))
        for side in (-1,1):
            for j in range(4):
                x=cx+side*(.011+.003*j)*scale
                y=cy+(.009-.005*j)*scale
                objects.append(tube('Carved bent crab leg',[(cx+side*.008*scale,y,.023),
                    (x+side*.006*scale,y+.004,.027),(x+side*.012*scale,y-.005,.022)],.0015,relief,7))
            px=cx+side*.015*scale
            objects.append(oval('Crab claw',(px,cy+.018*scale,.027),(.006,.005,.0035),relief,.4*side))
    return objects


def glass_mug():
    glass=material('Opaque yellow-green enamelled glass',(.43,.30,.038),.23,vertex_color=True)
    handle=material('Green glass handle',(.30,.31,.031),.24)
    enamel=material('Brown and gold enamel outlines',(.22,.073,.013),.40)
    wing=material('Amber insect wings',(.63,.31,.041),.39)
    profile=[(0,0),(.023,0),(.030,.005),(.033,.012),(.031,.023),(.026,.036),
        (.025,.047),(.028,.069),(.031,.089),(.032,.111),(.035,.129),(.0365,.139),
        (.0335,.140),(.0315,.134),(.030,.124),(.029,.107),(.028,.087),(.025,.068),
        (.021,.046),(.023,.034),(.026,.023),(.020,.009),(0,.009)]
    objects=[lathe('Gallé mug | yellow-green glass body',profile,glass,
        lambda v:color((.15,.20,.017),(.68,.45,.060),v.z/.14+.14*math.sin(v.x*216+v.z*240)),
        radius_offset=lambda a,z:.0017*math.sin(a*6+z*96)*math.sin(z/.14*math.pi),segments=96)]
    points=[(.027,0,.018),(.040,0,.029),(.048,0,.049),(.060,0,.071),(.072,0,.099),(.072,0,.119),
        (.061,0,.130),(.048,0,.127),(.034,0,.117)]
    curve=[]
    for i in range(len(points)-1):
        p0,p1,p2,p3=[Vector(points[j]) for j in (max(i-1,0),i,i+1,min(i+2,len(points)-1))]
        for j in range(6):
            t=j/6
            curve.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t))
    curve.append(Vector(points[-1]))
    objects.append(tube('Sweeping glass handle',curve,.0048,handle,14))
    for x in (-.013,.009):
        objects.append(tube('Enamelled stem',[(x,-.024,.037),(x-.004,-.028,.056),(x+.002,-.030,.074),
            (x-.004,-.031,.090),(x-.009,-.033,.113)],.00085,enamel,7))
        for j in range(3):
            z=.058+j*.015
            objects.append(oval('Enamel leaf',(x+(.004 if j%2 else -.004),-.029-j*.0012,z),(.004,.0011,.0015),wing,.15))
    objects.append(oval('Insect enamel body',(.001,-.033,.092),(.004,.0014,.006),enamel))
    for side in (-1,1):
        objects.append(oval('Insect enamel wing',(side*.007,-.034,.096),(.006,.001,.003),wing))
    return objects


BUILDERS = {'bcm-1754':bottle,'bcm-1760':porcelain,'bcm-1099':bowl,'bcm-929':tool,
            'bcm-926':thumb_ring,'bcm-1060':bell,'bcm-1252':inkstone,'bcm-997':glass_mug}


def main():
    artifact_id, = sys.argv[sys.argv.index('--')+1:]
    output = ROOT/'artifacts'/artifact_id
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene
    scene.unit_settings.system='METRIC'
    objects=BUILDERS[artifact_id]()
    low,high=world_bounds(objects)
    origin=Vector(((low.x+high.x)/2,(low.y+high.y)/2,low.z))
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.location-=origin
        obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    low,high=world_bounds(objects)
    scene['model_id']=artifact_id
    scene['source_note']='Approximate reconstruction from public museum reference views; see metadata.json.'
    bpy.ops.export_scene.gltf(filepath=str(output/'model.glb'),export_format='GLB',use_selection=True,export_apply=True)
    preview_scene(scene,low,high,artifact_id)
    if artifact_id in {'bcm-1252','bcm-929','bcm-926'}:
        center=(low+high)/2
        scene.camera.location=center+Vector((.35,-2.5,3.0))*max(high-low)
        scene.camera.rotation_euler=(center-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    scene.cycles.samples=12
    scene.render.resolution_x=scene.render.resolution_y=560
    scene.render.filepath=str(output/'preview.png')
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(output/'model.blend'),compress=True)
    bpy.ops.render.render(write_still=True)
    (output/'model-stats.json').write_text(json.dumps({
        'bounds_m_blender_xyz':[round(v,6) for v in high-low],
        'mesh_objects':len(objects),
        'source_triangles':sum(len(face.vertices)-2 for obj in objects for face in obj.data.polygons)
    },indent=2)+'\n',encoding='utf-8')


if __name__=='__main__':
    main()
