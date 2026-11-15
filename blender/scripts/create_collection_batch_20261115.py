"""30 user-approved independent collection studies, from official front photographs.
No guessed signatures/backstamps, no photo texture projection, no scene placement.
Models are interpretive, not scans. Run with Blender --background --python this.py.
Optional ID after -- generates one item. Editable source stays before export merging.
"""
import bpy,math,pathlib,sys,json,random
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from museum_model_utils import *
ROOT=pathlib.Path(__file__).resolve().parents[2]
DATA=ROOT/'museum-assets/batches/candidates-2026-11-15.json'
OUT=ROOT/'public/models/collection-batch-20261115';OUT.mkdir(parents=True,exist_ok=True)
SRC=ROOT/'blender/blend/collection-batch-20261115';SRC.mkdir(parents=True,exist_ok=True)
PROFILES={
1101:[(0,.31),(.07,.38),(.25,.44),(.59,.44),(.74,.36),(.79,.35)],1102:[(0,.29),(.08,.38),(.4,.47),(.7,.39),(.87,.15),(.96,.12),(1,.16)],1103:[(0,.27),(.08,.32),(.38,.41),(.65,.40),(.90,.22),(1,.23)],1104:[(0,.24),(.05,.29),(.18,.33),(.43,.40),(.57,.44)],1105:[(0,.27),(.12,.34),(.5,.42),(.73,.36),(.85,.31),(.98,.32)],1106:[(0,.34),(.05,.38),(.16,.47),(.40,.58),(.51,.60)],1107:[(0,.35),(.08,.40),(.35,.52),(.61,.57),(.66,.60)],1108:[(0,.20),(.09,.30),(.38,.39),(.7,.39),(.90,.32),(1,.29)],1109:[(0,.25),(.08,.34),(.24,.39),(.68,.40),(.86,.32),(.97,.27)],1110:[(0,.22),(.10,.28),(.50,.41),(.83,.40),(1.10,.25),(1.16,.23)],1111:[(0,.22),(.12,.29),(.5,.43),(.85,.42),(1.1,.29),(1.15,.27)],1112:[(0,.14),(.18,.15),(.23,.27),(.5,.49),(.6,.55)],1113:[(0,.23),(.03,.25),(.91,.25),(.96,.27)],1114:[(0,.25),(.11,.32),(.48,.46),(.85,.43),(1.07,.26),(1.12,.28)],1115:[(0,.21),(.12,.28),(.5,.42),(.88,.40),(1.10,.23),(1.15,.24)],1116:[(0,.25),(.1,.31),(.5,.44),(.83,.41),(1.05,.29),(1.10,.28)],1117:[(0,.21),(.13,.28),(.48,.44),(.73,.43),(.93,.26),(1.02,.23)],1120:[(0,.22),(.10,.34),(.4,.47),(.67,.43),(.82,.27),(.9,.23),(.96,.24)],1121:[(0,.24),(.1,.32),(.4,.44),(.7,.44),(.9,.32),(1,.32)],996:[(0,.16),(.08,.18),(.25,.25),(.65,.21),(1.1,.18),(1.28,.12),(1.37,.14)],995:[(0,.09),(.06,.14),(.20,.19),(.4,.14),(.57,.07),(1.50,.025),(1.58,.035)],994:[(0,.19),(.06,.20),(.5,.205),(1.13,.21),(1.17,.22)],993:[(0,.17),(.05,.18),(.4,.21),(.9,.27),(1.2,.30)],992:[(0,.16),(.05,.19),(.12,.11),(.20,.08),(.27,.13),(.65,.22),(1.15,.24),(1.24,.25)],985:[(0,.17),(.05,.19),(.16,.25),(.33,.29),(.39,.30)],957:[(0,.20),(.05,.23),(.12,.15),(.21,.22),(.4,.38),(.60,.37),(.73,.22),(.85,.26)],1074:[(0,.23),(.10,.31),(.48,.45),(.87,.43),(1.08,.28),(1.12,.29)],1075:[(0,.24),(.10,.30),(.45,.39),(.70,.35),(.95,.19),(1.02,.22)],1076:[(0,.28),(.09,.39),(.25,.48),(.46,.48),(.60,.37),(.67,.38)]}
COLORS={1101:(.19,.17,.12),1102:(.23,.12,.06),1103:(.085,.08,.065),1104:(.16,.15,.10),1105:(.22,.10,.045),1106:(.25,.10,.045),1107:(.27,.23,.12),1108:(.14,.065,.035),1109:(.21,.095,.04),1110:(.095,.045,.027),1111:(.31,.095,.052),1112:(.27,.13,.06),1113:(.17,.09,.045),1114:(.11,.045,.022),1115:(.09,.045,.024),1116:(.16,.065,.03),1117:(.16,.07,.025),1120:(.17,.065,.025),1121:(.17,.08,.04),1074:(.10,.045,.024),1075:(.16,.15,.12),1076:(.08,.045,.027),996:(.62,.30,.027),995:(.56,.32,.12),994:(.26,.12,.035),993:(.47,.10,.23),992:(.78,.30,.045),985:(.93,.91,.82),957:(.89,.87,.79)}
SAMPLE_CACHE={}
def profile_r(p,y):
 q=SAMPLE_CACHE.setdefault(tuple(p),smooth(p))
 for i in range(len(q)-1):
  if q[i][0]<=y<=q[i+1][0]:
   t=(y-q[i][0])/(q[i+1][0]-q[i][0]);return q[i][1]*(1-t)+q[i+1][1]*t
 return q[-1][1]
def waves(p,y,amplitude,m,periods=7):
 pts=[]
 for i in range(257):
  a=i*math.tau/256;yy=y+math.sin(a*periods)*amplitude;r=profile_r(p,yy)+.004;pts.append((r*math.cos(a),yy,r*math.sin(a)))
 tube('Finger-drawn glaze motif (approximate)',pts,.007,m)
def plant(p,front,base,height,m,leaf=True):
 # Slight raised material bands indicate visible decoration, not invented scans.
 pts=[]
 for i in range(40):
  yy=base+height*i/39;a=front+.06*math.sin(i/14);r=profile_r(p,yy)+.005;pts.append((r*math.cos(a),yy,r*math.sin(a)))
 tube('Botanical stem - simplified',pts,.007,m)
 for side,k in [(-1,.25),(1,.40),(-1,.58),(1,.72)]:
  yy=base+height*k;r=profile_r(p,yy)+.009;angle=front+side*.19
  tube('Botanical leaf contour',[(r*math.cos(front+side*.22*t),yy+height*.12*math.sin(t*math.pi/2),r*math.sin(front+side*.22*t))for t in [i/20 for i in range(21)]],.012,m)
def flower(p,y,a,m,petals=9,size=.08):
 for k in range(petals):
  pts=[]
  for i in range(49):
   t=i*math.tau/48;xx=size*math.sin(t)*.4;yy=size*(1+math.cos(t));ang=k*math.tau/petals;u=xx*math.cos(ang)-yy*math.sin(ang);vv=xx*math.sin(ang)+yy*math.cos(ang);r=profile_r(p,y+vv)+.008;aa=a+u/max(r,.1);pts.append((r*math.cos(aa),y+vv,r*math.sin(aa)))
  tube('Petal relief - approximate',pts,.004,m,True)
def create(id):
 clear();random.seed(id);bpy.context.scene['official_catalogue']=f'https://www.bcmuseum.or.kr/ko/collection/{id}/view';bpy.context.scene['accuracy']='Interpretive from official front image; hidden surfaces/backstamps unverified.'
 gold=mat('Restrained gilt',(.56,.32,.08),.7,.28);paint=mat('Pale finger-glaze',(.50,.32,.15),0,.58);red=mat('Botanical enamel',(.30,.025,.012),0,.4);green=mat('Green botanical enamel',(.025,.14,.065),0,.4)
 if id==1000:
  wine=mat('Burgundy mount',(.13,.009,.018));white=mat('Porcelain',(.88,.86,.78),.0,.24);blue=mat('Documented blue mark family - schematic',(.02,.055,.16));box('Solid frame backing',(0,.7,0),(1.3,1.3,.06),wine)
  for w,h in [(1.4,1.4),(1.30,1.30),(1.12,1.12)]:
   for x in [-w/2,w/2]:box('Gilded moulding',(x,.7,.035),(.035,h,.07),gold,.01)
   for y in [.7-h/2,.7+h/2]:box('Gilded moulding',(0,y,.035),(w,.035,.07),gold,.01)
  o=cyl('Circular ceramic plaque',(0,.7,.07),.46,.025,white,128);o.rotation_euler[0]=math.pi/2
  for x in [-.21,0,.21]:
   for y in [.46,.70,.94]:
    tube('Schematic crossed-sword mark',[(x-.035,y-.038,.09),(x+.035,y+.038,.09)],.0035,blue);tube('Schematic crossed-sword mark',[(x+.035,y-.038,.09),(x-.035,y+.038,.09)],.0035,blue)
  return
 p=PROFILES[id];c=tuple(x**2.2 for x in COLORS[id]);body=mat('Artifact body',c,0,(.76 if id in [1101,1103,1104,1075] else .33) if id>=1074 else .23, .88 if id in [993] else 1)
 base=lathe('Continuous hollow vessel with formed lip',p,body,lobes=1 if id in [985,957] else 0)
 if id not in [1112,1107]:cyl('Closed base',(0,.015,0),p[0][1]-.012,.03,body)
 if id==1107:
  bottom=cyl('Perforated steaming base',(0,.025,0),.35,.035,body)
  cutters=[]
  for x,z in [(0,0)]+[(.20*math.cos(i*math.tau/7),.20*math.sin(i*math.tau/7))for i in range(7)]:cutters.append(cyl('Steam hole cutter',(x,.025,z),.043,.12,None,24))
  bpy.ops.object.select_all(action='DESELECT')
  for o in cutters:o.select_set(True)
  bpy.context.view_layer.objects.active=cutters[0];bpy.ops.object.join();tool=bpy.context.object;bpy.context.view_layer.objects.active=bottom;q=bottom.modifiers.new('Actual open steam holes','BOOLEAN');q.operation='DIFFERENCE';q.object=tool;bpy.ops.object.modifier_apply(modifier=q.name);bpy.data.objects.remove(tool,do_unlink=True)
 if id in [1101,1111,1116]:
  y=p[-1][0]+.018;r=p[-1][1]+.03
  if id==1101:lathe('Lidded domed cover',[(y,r),(y+.025,r*1.06),(y+.08,r*.85),(y+.11,.05)],body,shell=False);ball('Lid knob',(0,y+.13,0),(.035,.025,.035),body)
  else:lathe('Inverted basin cover',[(y,r*1.17),(y+.03,r*1.15),(y+.15,r*.83),(y+.17,r*.78)],body,shell=False);cyl('Cover top',(0,y+.17,0),r*.78,.02,body)
 if id in [1103,1104,1106,1107,1113,1120,1076,1075]:
  y=p[-1][0]*.62;r=profile_r(p,y)
  for side in [-1,1]:handle(side*r,y,0,.075 if id!=1120 else .09,body,side)
 if id==1113:
  for o in list(bpy.context.scene.objects):
   if o.type in ['MESH','CURVE']:o.location.x+=.29
  lathe('Second smaller fermenting jar',[(y*.72,r*.75)for y,r in p],body,(-.29,0,.035));cyl('Second closed base',(-.29,.015,.035),.17,.03,body)
 if id in [1104,1106,1107,1109,1076]:
  ys=[.13,.24,.38,.50] if id!=1109 else [.18+k*.075 for k in range(9)]
  for y in ys:
   if y<p[-1][0]:ring('Wheel-thrown ridge',(0,y,0),profile_r(p,y)+.005,body,.008 if id!=1109 else .016)
 if id in [1105,1114,1116,1120,1121,1074]:
  for y in [.37*p[-1][0],.70*p[-1][0]]:waves(p,y,.035 if id!=1116 else .015,paint,8 if id!=1116 else 14)
 if id in [1110,1114,1117,1120,1121]:
  for a in [math.pi/2,math.pi/2+.9,math.pi/2-.9]:plant(p,a,.22,p[-1][0]*.57,paint)
 if id==1117:
  white=mat('White-clay slip bands',(.65,.56,.40))
  for y in [.67,.77,.87]:waves(p,y,.012,white,20)
 if id==1102:
  rope=mat('Straw cord',(.47,.31,.14),0,.95)
  for j in range(72):
   y=.03+j*.012;r=profile_r(p,y)+.014;tube('Woven horizontal straw',[(r*math.cos(a),y+.003*math.sin(a*42+j*math.pi),r*math.sin(a))for a in [i*math.tau/144 for i in range(145)]],.0045,rope)
  for j in range(42):
   a=j*math.tau/42;pts=[]
   for k in range(100):y=.03+k*.0085;r=profile_r(p,y)+.014+.004*math.sin(k*math.pi*.71);pts.append((r*math.cos(a),y,r*math.sin(a)))
   tube('Interwoven vertical straw',pts,.0045,rope)
 if id==1076:
  # Short open spout, aligned to the side seen in the official photograph.
  o=lathe('Open pouring spout',[(0,.08),(.10,.07),(.20,.09)],body);o.location=v((-.34,.48,.15));o.rotation_euler[1]=-math.pi/3
 if id in [996,995,994,992]:
  for a in [math.pi/2,0,math.pi,-math.pi/2]:plant(p,a,p[-1][0]*.20,p[-1][0]*.60,red if id in [992,994] else paint)
  if id in [992,994]:flower(p,.70,math.pi/2,red,10 if id==994 else 6,.10)
  for y in [p[-1][0]-.008,.04]:ring('Rim and foot highlight',(0,y,0),profile_r(p,y)+.003,gold,.004)
 if id==993:
  pale=mat('Rose cameo glass',(.80,.43,.53),0,.30,.86)
  for row in range(4):
   for k in range(8):flower(p,.2+row*.23,k*math.tau/8+row*.3,pale,5,.026)
  for y in [.05,1.18]:ring('Crystal rim',(0,y,0),profile_r(p,y),pale,.012)
 if id==985:
  lathe('Matching scalloped saucer',[(0,.14),(.012,.21),(.020,.38),(.045,.43)],body,lobes=1);ring('Saucer gilt',(0,.046,0),.43,gold,.004)
  handle(.29,.22,0,.12,gold,1,.6);ring('Cup gilt',(0,.39,0),.30,gold,.004);flower(p,.17,math.pi/2,green,8,.046)
 if id==957:
  for side in [-1,1]:handle(side*.33,.52,0,.17,green,side)
  ring('Crown gilt lip',(0,.85,0),.26,gold,.007)
  for a in [i*math.tau/12 for i in range(12)]:ball('Crown scallop',(math.cos(a)*.26,.87,math.sin(a)*.26),(.025,.035,.025),body)
  for y in [.12,.24,.66]:ring('Green and gilt band',(0,y,0),profile_r(p,y)+.004,green,.012)
  for a in [i*math.tau/8 for i in range(8)]:flower(p,.64,a,red,6,.025)
 if id in [1114,1115]:
  def stroke(points):
   out=[]
   for u,w in points:
    y=.89+w*.095;a=math.pi/2+u*.095/profile_r(p,y);r=profile_r(p,y)+.009;out.append((r*math.cos(a),y,r*math.sin(a)))
   tube('Visible front mark - schematic, not a signature',out,.004,paint)
  if id==1114:
   for a in [i*math.pi/4 for i in range(4)]:stroke([(-math.cos(a),-math.sin(a)),(math.cos(a),math.sin(a))])
  else:
   for line in [[(-1,-1),(-.8,.7)],[(-1.4,0),(-1,.4)],[(-.7,.1),(-.4,.5)],[(-1,-.2),(-1.5,-.9)],[(-.95,-.2),(-.45,-.85)],[(0,.8),(1.3,.8)],[(.1,.5),(1.2,.5),(1.2,-.2),(.1,-.2),(.1,.5)],[(.48,.5),(.48,-.2)],[(.83,.5),(.83,-.2)],[(0,-.55),(1.3,-.55)],[(.65,-.25),(.65,-.9)],[(0,-.9),(1.3,-.9)]]:stroke(line)
 # Fine throwing lines are actual shallow relief, not flat stripes.
 if id>=1074:
  for j in range(12):
   y=.08+j*(p[-1][0]-.14)/12;ring('Subtle potter wheel trace',(0,y,0),profile_r(p,y)+.0015,body,.0017)
def merge_for_export():
 # Keep editable components in .blend; deliver few draw calls in the GLB.
 for o in list(bpy.context.scene.objects):
  if o.type=='CURVE':bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
 groups={}
 for o in bpy.context.scene.objects:
  if o.type=='MESH':groups.setdefault(o.data.materials[0].name if o.data.materials else 'none',[]).append(o)
 for obs in groups.values():
  bpy.ops.object.select_all(action='DESELECT')
  for o in obs:o.select_set(True)
  bpy.context.view_layer.objects.active=obs[0]
  if len(obs)>1:bpy.ops.object.join()
def surface_colors():
 for o in list(bpy.context.scene.objects):
  if o.type=='CURVE':bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
 body=bpy.data.materials.get('Artifact body')
 if not body:return
 base=body.diffuse_color[:3];n=body.node_tree.nodes.new('ShaderNodeVertexColor');n.layer_name='SurfaceColor';body.node_tree.links.new(n.outputs['Color'],body.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 for o in bpy.context.scene.objects:
  if o.type!='MESH' or not o.data.materials or o.data.materials[0]!=body:continue
  attr=o.data.color_attributes.new(name='SurfaceColor',type='FLOAT_COLOR',domain='POINT')
  for vertex,color in zip(o.data.vertices,attr.data):
   q=o.matrix_world@vertex.co;noise=.94+.13*math.sin(q.x*21+q.y*9)*math.sin(q.z*27)+random.uniform(-.055,.055)
   color.color=(*(min(1,max(0,c*noise))for c in base),1)
def main(only=None):
 records=json.loads(DATA.read_text(encoding='utf8'))
 for a in records:
  id=int(a['id'][4:])
  if only and id!=only:continue
  create(id);surface_colors();bpy.context.scene['source_image_url']=a['photo']['sourceUrl'];save(SRC/f'bcm-{id}.blend');merge_for_export();export(OUT/f'bcm-{id}.glb')
  bpy.context.view_layer.update();points=[o.matrix_world@Vector(p)for o in bpy.context.scene.objects if o.type=='MESH'for p in o.bound_box];lo=Vector(tuple(min(p[i]for p in points)for i in range(3)));hi=Vector(tuple(max(p[i]for p in points)for i in range(3)));height=hi.z-lo.z;center=((lo.x+hi.x)/2,(lo.z+hi.z)/2,-(lo.y+hi.y)/2)
  studio(ROOT/f'public/models/bcm-{id}-preview.png',384,max(height,hi.x-lo.x)*1.55,center)
  print('COLLECTION_READY',id,flush=True)
if __name__=='__main__':main(int(sys.argv[sys.argv.index('--')+1]) if '--'in sys.argv else None)
