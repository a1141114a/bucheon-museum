"""Photograph-based partial reconstruction of the real European Porcelain Gallery.
Basis: official exhi_permanent photos 01/02 plus facility and 2023 government report.
No surveyed drawings: dimensions and unseen surfaces are estimates, not a digital twin.
The 30 new independent models are deliberately NOT placed in this scene.
"""
import bpy,math,pathlib,sys,json,random
import numpy as np
from mathutils import Vector
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from museum_model_utils import *
R=pathlib.Path(__file__).resolve().parents[2];OUT=R/'public/models/modern-museum';OUT.mkdir(parents=True,exist_ok=True);SRC=R/'blender/blend/modern-museum';SRC.mkdir(parents=True,exist_ok=True)
clear();random.seed(238)
WHITE=mat('Warm white painted museum joinery',(.72,.70,.65),0,.65);WALL=mat('Warm white walls',(.62,.60,.54),0,.8);BLUE=mat('Photo-matched muted blue case backing',(.105,.175,.26),0,.75);PINK=mat('Photo-matched dusty rose case backing',(.35,.16,.19),0,.75);BLACK=mat('Black acoustic panels and tracks',(.018,.020,.023),0,.65);METAL=mat('White display aluminium',(.70,.70,.66),.5,.35);GLASS=mat('Display glazing - low opacity',(.68,.79,.77),.05,.12,.065);GOLD=mat('Display furniture gilt',(.42,.25,.065),.72,.3);WOOD=mat('Dark cabinet wood',(.10,.038,.012),0,.35);CREAM=mat('Dining room pale damask backing',(.48,.47,.32),0,.85);PORCELAIN=mat('Context crockery - simplified white ceramic',(.83,.84,.81),0,.22);COBALT=mat('Context blue floral accents',(.025,.07,.20),0,.25);CLOTH=mat('Table cloth',(.75,.74,.65),0,.92);GREEN=mat('Plant leaves',(.055,.11,.035),0,.8)
LIGHT=mat('LED lenses',(.85,.83,.74),0,.4);bs=LIGHT.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(1,.88,.67,1);bs.inputs['Emission Strength'].default_value=3
# Authored wood texture from mathematical grain; no downloaded photographs.
im=bpy.data.images.new('Authored oak grain',width=1024,height=1024);yy,xx=np.mgrid[0:1024,0:1024];rng=np.random.default_rng(238);grain=np.sin(xx*.27+2*np.sin(yy*.009)+.7*np.sin(yy*.037))+ .6*np.sin(xx*.81+np.sin(yy*.01)*4);board=(xx//128);tone=np.array([.02,-.015,.035,-.03,.015,-.02,.04,0])[board];grain=grain*.022+tone+rng.normal(0,.008,(1024,1024));pixels=np.ones((1024,1024,4),np.float32)
for channel,base in enumerate([.49,.32,.18]):pixels[:,:,channel]=np.clip(base+grain,0,1)
pixels[:,(xx[0]%128)<2,:3]*=.55;im.pixels.foreach_set(pixels.ravel());im.pack();floor=mat('Authored repeating oak planks',(.4,.25,.12),0,.43);n=floor.node_tree.nodes.new('ShaderNodeTexImage');n.image=im;floor.node_tree.links.new(n.outputs['Color'],floor.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
o=box('Oak floor',(0,-.075,0),(8.8,.15,12.8),floor,.005)
for face in o.data.polygons:
 for li in face.loop_indices:
  co=o.data.vertices[o.data.loops[li].vertex_index].co;o.data.uv_layers.active.data[li].uv=(co.x*.65,co.y*.25)
box('Back wall',(0,1.8,-6.35),(8.8,3.6,.18),WALL)
box('Outer side wall left',(-4.35,1.8,0),(.18,3.6,12.8),WALL);box('Outer side wall right',(4.35,1.8,0),(.18,3.6,12.8),WALL)
box('White ceiling perimeter',(0,3.58,0),(8.8,.15,12.8),WHITE)
box('Black recessed ceiling',(-.15,3.48,0),(3.5,.10,12.4),BLACK)
for z in [-5,-3,-1,1,3,5]:
 box('Acoustic panel seam',(-.15,3.42,z),(3.5,.018,.018),BLACK)
 for x in [-.8,.7]:
  if z in [-3,3]:
   box('Ceiling cassette AC',(x,3.39,z),(.8,.07,.8),METAL)
   for k in range(9):box('HVAC louvre',(x-.28+k*.07,3.34,z),(.022,.018,.54),BLACK,.002)
for z in [-5.5,0,5.5]:box('White structural beam',(0,3.29,z),(8.65,.34,.32),WHITE)
for x in [-1.5,2.5]:
 box('Black lighting track',(x,3.30,0),(.055,.055,12),BLACK,.005)
 for z in [-5,-3.5,-2,-.5,1,2.5,4,5.5]:
  cyl('Spotlight pivot',(x,3.17,z),.035,.22,BLACK,24);o=cyl('Adjustable black track spotlight',(x,3.03,z),.065,.20,BLACK,32);o.rotation_euler[0]=.25*(1 if x<0 else -1);cyl('Spotlight lens',(x,2.935,z),.052,.012,LIGHT,32)
# Right-hand recessed glass display: blue bays and rose explanatory divisions.
for z,length in [(3.5,4.6),(-2.3,6.0)]:
 box('Blue backed wall case',(4.10,1.65,z),(.10,3.0,length),BLUE)
 box('Case white base rail',(3.25,.10,z),(1.7,.20,length),WHITE)
 box('Case white upper rail',(3.25,3.12,z),(1.7,.11,length),WHITE)
 box('Glazed case front',(2.38,1.66,z),(.012,2.90,length),GLASS,0)
 for zz in [z-length/2,z+length/2]:box('Case frame upright',(2.38,1.65,zz),(.03,3.0,.035),METAL,.003)
 for zz in np.arange(z-length/2+1,z+length/2,1.6):box('Glass panel joint',(2.38,1.66,float(zz)),(.017,2.9,.006),METAL,.001)
for z in [.88,-3.65]:
 box('Rose information column',(3.21,1.65,z),(1.84,3.05,.36),PINK)
 # Unreadable fine printed text is not invented as historical information.
 for k in range(20):box('Simplified information line',(2.275,1.9-k*.032,z),(.002,.006,.19 if k%4 else .14),WHITE,0)
# Two central freestanding case bases and glass covers, observed in photo 01.
def vitrine(x,z):
 box('Freestanding ivory pedestal',(x,.56,z),(.80,1.12,.80),WHITE,.012)
 box('White display top',(x,1.14,z),(.86,.055,.86),WHITE,.008)
 box('Case base plinth',(x,.035,z),(.94,.07,.94),METAL,.008)
 for xx in [-.48,.48]:box('Clear side glazing',(x+xx,1.42,z),(.012,2.75,.96),GLASS,0)
 for zz in [-.48,.48]:box('Clear front glazing',(x,1.42,z+zz),(.96,2.75,.012),GLASS,0)
 box('Clear top glazing',(x,2.79,z),(.97,.01,.97),GLASS,0)
 for xx in [-.48,.48]:
  for zz in [-.48,.48]:box('Green-tinted glass edge',(x+xx,1.42,z+zz),(.008,2.76,.008),METAL,.001)
 return (x,1.18,z)
vitrine(-.30,2.20);vitrine(-.45,-3.25)
# Context silhouettes follow visible shapes, not assigned collection identities.
blueVase=mat('Context cobalt vase silhouette',(.025,.10,.22),.1,.23);ivory=mat('Context pale moon-flask silhouette',(.69,.72,.65),0,.25)
lathe('Context tall blue vase - decoration simplified',[(0,.19),(.07,.20),(.25,.29),(.60,.33),(.83,.23),(1.02,.17),(1.16,.25)],blueVase,(-.45,1.18,-3.25))
o=lathe('Context flattened round flask - approximate',[(0,.18),(.09,.25),(.43,.37),(.7,.33),(.9,.13),(1.08,.11),(1.12,.15)],ivory,(-.30,1.18,2.20))
for vertex in o.data.vertices:vertex.co.y=-2.20+(vertex.co.y+2.20)*.57
for x,z,y in [(-.30,2.20,1.3),(-.45,-3.25,1.22)]:ring('Context vase gilt foot',(x,y,z),.20,GOLD,.012)
# Left dining diorama: glazing, wallpaper, furniture, carpet and place settings.
box('Dining room wallpaper backing',(-4.20,1.65,.8),(.10,3.15,7.7),CREAM)
box('Dining diorama glazing',(-1.78,1.6,.8),(.012,3.10,7.7),GLASS,0)
for z in [-3.05,4.65]:box('Dining display side return',(-2.99,1.65,z),(2.5,3.3,.13),WALL)
for y in [.06,3.17]:box('Dining window white frame',(-1.78,y,.8),(.055,.065,7.7),WHITE)
for z in [-3.05,.5,4.65]:box('Dining glass seam',(-1.78,1.6,z),(.016,3.10,.014),METAL,.001)
carpet=mat('Dining red-edged carpet',(.18,.15,.072),0,.95);box('Carpet',(-3.0,.012,.7),(2.18,.018,3.4),carpet,.003)
for xx in [-4.06,-1.94]:box('Carpet red border',(xx,.026,.7),(.045,.005,3.4),PINK,.001)
box('Dining table top',(-3.05,.83,.7),(1.55,.11,2.55),WOOD,.03)
for zz in [-.15,1.55]:
 box('Dining trestle',(-3.05,.40,zz),(.18,.75,.15),WOOD,.015);box('Dining trestle foot',(-3.05,.09,zz),(1.32,.12,.28),WOOD,.025)
box('White lace table cloth surface',(-3.05,.895,.7),(1.6,.015,2.60),CLOTH,.01)
for x in [-3.85,-2.25]:box('Hanging cloth valance',(x,.73,.7),(.015,.34,2.60),CLOTH,.01)
for z in [-.6,2]:box('Hanging cloth end',(-3.05,.73,z),(1.6,.34,.015),CLOTH,.01)
runner=mat('Blue table runner',(.11,.16,.18),0,.85);box('Dining table runner',(-3.05,.91,.7),(.37,.012,2.6),runner,.002)
for x in [-3.59,-2.51]:
 for z in [-.25,.40,1.05,1.70]:
  lathe('Context plate',[(0,.06),(.008,.11),(.02,.155)],PORCELAIN,(x,.92,z),n=48)
  lathe('Context teacup',[(0,.035),(.04,.057),(.08,.062)],PORCELAIN,(x,.94,z),n=48);ring('Context blue plate band',(x,.941,z),.14,COBALT,.003)
  handle(x+.06,1.0,z,.025,PORCELAIN,1,.35)
  tube('Context silver cutlery',[(x+.18,.93,z-.06),(x+.18,.93,z+.08)],.006,METAL)
for z in [.15,1.22]:
 cyl('Dining candlestick stem',(-3.05,1.11,z),.018,.40,PORCELAIN,32);ring('Candlestick blue detail',(-3.05,1.04,z),.037,COBALT,.005);cyl('Display candle',(-3.05,1.44,z),.017,.35,WHITE,24)
def cabinet(z):
 box('Dining cabinet back',(-4.04,1.0,z),(.15,1.8,.90),WOOD,.015)
 for zz in [z-.45,z+.45]:box('Gilt cabinet corner',(-3.68,1.0,zz),(.045,1.8,.045),GOLD,.009)
 for y in [.15,.35,.9,1.45,1.82]:box('Cabinet shelf',(-3.83,y,z),(.62,.045,.90),GOLD,.006)
 box('Cabinet display glass',(-3.51,1.03,z),(.012,1.48,.86),GLASS,0)
 for y in [.42,.97,1.52]:
  for zz in [z-.25,z+.25]:lathe('Context cabinet cup',[(0,.035),(.06,.06),(.09,.065)],PORCELAIN,(-3.8,y,zz),n=32)
cabinet(-2.1);cabinet(3.7)
# Arched mirror surround, at the observed diorama end; no invented garden view.
mirror=mat('Muted mirror reflection approximation',(.28,.34,.28),.92,.17)
for x in [-3.03]:
 box('Arched mirror lower field',(x,1.55,-2.96),(1.0,2.40,.025),mirror,.02)
 points=[(x-.56,.20,-2.92),(x-.56,2.3,-2.92)]+[(x+.56*math.cos(math.pi-i*math.pi/48),2.3+.56*math.sin(math.pi-i*math.pi/48),-2.92)for i in range(49)]+[(x+.56,.20,-2.92)]
 tube('White arched diorama mirror surround',points,.035,WHITE)
box('Gilt sideboard below portrait',(-3.91,.72,.4),(.50,.12,1.25),GOLD,.015)
for zz in [-.1,.9]:box('Sideboard foot',(-3.91,.36,zz),(.08,.72,.07),WOOD,.01)
def artwork(index,id,position,height,yaw=0):
 before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(R/f'public/models/painting-worlds-v2/artwork-{index}.glb'));obs=[o for o in bpy.context.scene.objects if o not in before];bpy.context.view_layer.update();pts=[o.matrix_world@Vector(p)for o in obs if o.type=='MESH'for p in o.bound_box];lo=Vector(tuple(min(p[i]for p in pts)for i in range(3)));hi=Vector(tuple(max(p[i]for p in pts)for i in range(3)));center=(lo+hi)/2;scale=height/(hi.z-lo.z)
 root=bpy.data.objects.new(f'MuseumArtwork_{id}',None);bpy.context.collection.objects.link(root);root['artifactId']=id
 for o in obs:
  if o.parent not in obs:o.parent=root
  if o.type=='MESH':o['artifactId']=id
 root.location=-center*scale;root.scale=(scale,)*3;bpy.context.view_layer.update()
 # A new parent applies target placement and wall orientation around the centered work.
 place=bpy.data.objects.new('Installed_'+id,None);bpy.context.collection.objects.link(place);root.parent=place;place.location=v(position);place.rotation_euler.z=yaw
artwork(1,'bcm-991',(3.99,2.02,3.55),.83,-math.pi/2)
artwork(5,'bcm-986',(3.99,2.02,1.92),.83,-math.pi/2)
artwork(2,'bcm-990',(.15,2.06,-6.20),1.25)
artwork(4,'bcm-988',(-4.10,2.05,.40),.85,math.pi/2)
from refine_modern_museum_details import refine
refine()
bpy.context.scene['reconstruction']='Bucheon City Museum, Integrated Hall 2F, European Porcelain Gallery, photographed passage. Photo-based approximate dimensions. Context vessels and patterned crockery simplified; no invented collection identities.'
bpy.context.scene['primary_source']='https://www.bcmuseum.or.kr/ko/pages/exhi_permanent'
save(SRC/'european-porcelain-passage.blend')
# Merge static building components for the web, retaining per-artwork click identities.
for o in list(bpy.context.scene.objects):
 if o.type=='CURVE':bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
groups={}
for o in bpy.context.scene.objects:
 if o.type=='MESH' and len(o.data.materials)==1:groups.setdefault((o.get('artifactId','building'),o.data.materials[0].name),[]).append(o)
for (id,m),obs in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0]
 if len(obs)>1:bpy.ops.object.join()
 if id!='building':bpy.context.object['artifactId']=id
export(OUT/'european-porcelain-passage-v2.glb')
# An actual rendered overview for source QA, not an image background in the game.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.world=bpy.data.worlds.new('Gallery ambient');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
bpy.ops.object.camera_add(location=v((1.1,1.65,5.7)));camera=bpy.context.object;camera.data.lens=24;camera.rotation_euler=(Vector(v((-.1,1.8,-4.5)))-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
for x in [-1.1,2]:
 for z in [-4,0,4]:
  bpy.ops.object.light_add(type='AREA',location=v((x,3.14,z)));o=bpy.context.object;o.data.energy=110;o.data.shape='DISK';o.data.size=2
scene.render.filepath=str(OUT/'overview.png');bpy.ops.render.render(write_still=True)
(OUT/'manifest.json').write_text(json.dumps({'region':'Integrated Hall 2F European Porcelain Gallery, photographed passage beside dining diorama','surveyed':False,'dimensions':'Estimated from photographs, not surveyed','officialSources':['https://www.bcmuseum.or.kr/ko/pages/facility','https://www.bcmuseum.or.kr/ko/pages/exhi_permanent'],'photoReferences':['https://www.bcmuseum.or.kr/common/images/person/bg/exhibition/bg_1_4_01.jpg','https://www.bcmuseum.or.kr/common/images/person/bg/exhibition/bg_1_4_02.jpg','https://www.bcmuseum.or.kr/common/images/person/bg/exhibition/bg_1_4_03.jpg'],'visibleVerifiedWorks':['bcm-991','bcm-986','bcm-990','bcm-988'],'simplifications':['Unsurveyed distances and unseen joins','Context vases and tableware decoration','Mirror reflection','Fine wall typography'],'newIndependentBatchPlaced':False,'detailRevision':2},ensure_ascii=False,indent=2),encoding='utf8')
print('MODERN_MUSEUM_READY',flush=True)

