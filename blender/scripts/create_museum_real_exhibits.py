"""Approved and identified museum objects 951 / 941 / 978.
Reference: official photographs/records, approved 2026-11-15. No photo projection.
Visible construction is modelled; minute painting and hidden surfaces approximate.
"""
import bpy,math,pathlib,sys,json,random,numpy as np
from mathutils import Vector
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from museum_model_utils import *
from refine_modern_museum_details import image_mat
R=pathlib.Path(__file__).resolve().parents[2];OUT=R/'public/models/museum-real-exhibits';OUT.mkdir(parents=True,exist_ok=True);SRC=R/'blender/blend/museum-real-exhibits';SRC.mkdir(parents=True,exist_ok=True)
def radius(profile,y):
 p=smooth(profile)
 for a,b in zip(p,p[1:]):
  if a[0]<=y<=b[0]:return a[1]+(b[1]-a[1])*(y-a[0])/(b[0]-a[0])
 return p[-1][1]
def finish_mesh(name,verts,faces,m):
 me=bpy.data.meshes.new(name);me.from_pydata([v(p)for p in verts],[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.data.materials.append(m)
 for f in me.polygons:f.use_smooth=True
 return o
def coin(cx,y,z,r,gold):
 verts=[];faces=[];n=80
 for back in [0,.009]:
  for inner in [False,True]:
   for i in range(n):a=i*math.tau/n;rr=.023/max(abs(math.cos(a)),abs(math.sin(a)))if inner else r;verts.append((cx+rr*math.cos(a),y+rr*math.sin(a),z+back))
 for i in range(n):j=(i+1)%n;faces += [(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)]
 o=finish_mesh('Coin with actual square opening - no invented inscription',verts,faces,gold)
 for f in o.data.polygons:f.use_smooth=False
 for rr in [r*.92,r*.85]:tube('Coin raised concentric rim',[(cx+rr*math.cos(a),y+rr*math.sin(a),z+.012)for a in np.linspace(0,math.tau,81)],.002,gold,True)
def profile_ornament(p,y,angle,size,m,flatten=1):
 # Five-petal white-clay or painted blossom, in the actual vessel surface.
 for k in range(5):
  a=k*math.tau/5;pts=[]
  for t in np.linspace(0,math.tau,25):
   u=size*(.5+.5*math.cos(t))*math.cos(a)+size*.23*math.sin(t)*math.sin(a);w=size*(.5+.5*math.cos(t))*math.sin(a)-size*.23*math.sin(t)*math.cos(a);yy=y+w;rr=radius(p,yy)+.002;aa=angle+u/max(rr,.05);pts.append((rr*math.cos(aa),yy,rr*math.sin(aa)*flatten))
  tube('Photographed floral motif - approximate detail',pts,.0016,m,True)
def make951(gold,ivory,rose,green):
 p=[(.075,.17),(.13,.23),(.30,.31),(.50,.315),(.67,.25),(.76,.10),(.95,.10),(.97,.11)]
 yy,xx=np.mgrid[0:1024,0:1024];u=xx/1024;w=yy/1024;px=np.ones((1024,1024,4),np.float32);field=(np.sin(u*420+np.sin(w*370)*1.2)>.90)|(np.sin(w*520+np.cos(u*480))>.93)
 for k,c in enumerate([.86,.87,.84]):px[:,:,k]=c
 px[field,:3]=[.63,.68,.75];m=image_mat('951 blue-white geometric enamel study',px,.22)
 o=lathe('951 flattened flask with hollow neck',p,m,n=144)
 for vertex in o.data.vertices:vertex.co.y*=.43
 ring('951 gold mouth',(0,.97,0),.11,gold,.004)
 # Gold cloud handles follow the outline visible beside the long neck.
 for side in [-1,1]:
  path=[(side*.10,.91,-.012),(side*.15,.90,-.015),(side*.16,.86,-.015),(side*.20,.84,-.015),(side*.21,.79,-.015),(side*.245,.75,-.015),(side*.245,.69,-.015)]
  tube('951 cloud-shaped gilt ear',path,.016,gold);tube('951 inner ear fillet',[(x-side*.018,y-.006,z+.002)for x,y,z in path],.005,ivory)
 box('951 shaped gilt support',(0,.045,0),(.57,.07,.22),gold,.025)
 for x in [-.19,0,.19]:
  for sign in [-1,1]:tube('951 scrolling support volute',[(x+sign*.055*math.cos(a),.045+.030*math.sin(a),.12)for a in np.linspace(0,math.pi*1.8,50)],.010,gold)
 for cx,cy,rr,dz in [(-.04,.61,.075,.008),(.08,.64,.070,.016),(.045,.52,.073,.021)]:coin(cx,cy,radius(p,cy)*.43+dz,rr,gold)
 # Bamboo and fan motifs are modeled, but no unreadable characters are invented.
 ink=mat('951 dark enamel outline',(.03,.045,.06),0,.4)
 for side in [-1,1]:
  for offset in [-.06,.025]:
   pts=[]
   for y in np.linspace(.23,.70,35):x=side*(.17+offset+.02*math.sin(y*6));rr=radius(p,y);z=math.sqrt(max(.001,rr*rr-x*x))*.43+.004;pts.append((x,y,z))
   tube('951 bamboo stem ornament',pts,.0025,gold)
  for y in [.28,.39,.72]:profile_ornament(p,y,math.pi/2+side*.7,.025,gold,.43)
 for y,a in [(.28,.9),(.40,2.2),(.83,1.57)]:
  r=radius(p,y);center=(r*math.cos(a),y,r*math.sin(a)*.43+.005)
  for k in range(7):
   t=-.6+k*.2;tube('951 fan ribs',[(center[0],y,center[2]),(center[0]+.055*math.sin(t),y+.065*math.cos(t),center[2]+.001)],.0015,gold)
def make941(gold,ivory,rose,green):
 p=[(.12,.09),(.18,.11),(.35,.16),(.53,.17),(.68,.135),(.82,.097),(.91,.12),(.97,.167),(.985,.172)]
 yy,xx=np.mgrid[0:1024,0:1024];u=xx/1024;w=yy/1024;du=(u-.25+.5)%1-.5;cartouche=np.exp(-((du/.13)**4+((w-.49)/.23)**4));px=np.ones((1024,1024,4),np.float32)
 for k,(base,pale)in enumerate(zip([.07,.24,.43],[.60,.75,.73])):px[:,:,k]=base*(1-cartouche)+pale*cartouche
 body=image_mat('941 cobalt and turquoise enamel field',px,.20,.03);lathe('941 hollow porcelain vase',p,body,n=144)
 cyl('941 closed foot',(0,.125,0),.09,.03,ivory)
 ring('941 porcelain mouth rim',(0,.985,0),.172,ivory,.004)
 for y,r in [(.125,.095),(.14,.092),(.97,.167)]:ring('941 gilt shoulder and foot line',(0,y,0),r,gold,.0025)
 box('941 ormolu base lower step',(0,.015,0),(.38,.03,.28),gold,.007);box('941 dark inset plinth',(0,.052,0),(.34,.045,.24),mat('941 dark base inset',(.025,.023,.014),.15,.4),.006);box('941 ormolu top step',(0,.087,0),(.37,.025,.27),gold,.008)
 for x in [-.16,.16]:
  for z in [-.10,.10]:box('941 gilt corner foot',(x,.028,z),(.035,.05,.035),gold,.006)
 for z in [-.13,.13]:
  tube('941 base ornamental band',[(x,.08+.004*math.sin(x*140),z)for x in np.linspace(-.16,.16,100)],.003,gold)
 # Dove shallow relief, a principal documented identifying motif.
 front=radius(p,.50)+.003;ball('941 white-clay dove body',(0,.49,front),(.040,.017,.0045),ivory);ball('941 dove head',(-.038,.50,front+.002),(.011,.011,.005),ivory)
 tube('941 dove beak',[(-.046,.501,front+.003),(-.060,.502,front+.004),(-.047,.496,front+.003)],.0017,ivory)
 for i in range(11):
  t=i/10;endx=-.035+t*.052;endy=.555+.045*math.sin(t*math.pi);tube('941 individual raised wing feather',[(.008,.50,front+.006),(endx*.65,.53,front+.007),(endx,endy,front-.003)],.0026,ivory)
 for i in range(5):tube('941 tail feather',[(.03,.49,front),(.055+i*.005,.506+i*.006,front-.004)],.002,ivory)
 for side in [-1,1]:
  pts=[]
  for y in np.linspace(.23,.83,65):a=math.pi/2+side*(.40+.13*math.sin(y*9));r=radius(p,y)+.002;pts.append((r*math.cos(a),y,r*math.sin(a)))
  tube('941 flowering branch',pts,.0028,gold)
  for j,y in enumerate([.29,.37,.62,.72,.81]):
   a=math.pi/2+side*(.42+.10*math.sin(y*9));profile_ornament(p,y,a,.024,rose if j%2 else ivory)
   r=radius(p,y);aa=a+side*.12;ball('941 layered clay leaf',(r*math.cos(aa),y-.025,r*math.sin(aa)),(.006,.019,.003),green)
  pts=[]
  for y in np.linspace(.25,.77,80):a=math.pi/2+side*(.63+.06*math.sin(y*18));r=radius(p,y)+.003;pts.append((r*math.cos(a),y,r*math.sin(a)))
  tube('941 cartouche side arabesque',pts,.0028,gold)
def dinner_flower(x,y,z,r,m):
 for k in range(7):
  a=k*math.tau/7;pts=[]
  for t in np.linspace(0,math.tau,21):d=r*(.5+.5*math.cos(t));pts.append((x+d*math.cos(a)+r*.24*math.sin(t)*math.sin(a),y,z+d*math.sin(a)-r*.24*math.sin(t)*math.cos(a)))
  tube('978 floral painted petal',pts,.0015,m,True)
def make978(gold,ivory,rose,green):
 purple=mat('978 purple flower enamel',(.25,.03,.15),0,.34);red=mat('978 orange red flower enamel',(.47,.075,.015),0,.34)
 def plate(name,x,y,z,r,oval=1):
  before=set(bpy.context.scene.objects);o=lathe(name,[(0,.4*r),(.015,.65*r),(.025,.83*r),(.05,r)],ivory,(x,y,z),n=96);o.scale.x=oval
  # Scale around the plate center rather than moving the arrangement.
  o.location.x=x*(1-oval)
  rim=ring(name+' gilt rim',(x,y+.05,z),r,gold,.002);rim.scale.x=oval;rim.location.x=x*(1-oval)
  well=cyl(name+' closed porcelain well',(x,y+.007,z),r*.4,.016,ivory,96);well.scale.x=oval
  for k in range(9):a=k*math.tau/9;dinner_flower(x+math.cos(a)*r*.73*oval,y+.051,z+math.sin(a)*r*.73,.020,purple if k%2 else red)
  dinner_flower(x,y+.017,z,r*.22,purple)
  return [o for o in bpy.context.scene.objects if o not in before]
 plate('978 round serving plate',-.34,.015,.37,.24);plate('978 smaller round dish',.39,.015,.36,.20)
 plate('978 small oval tray',0,.015,.13,.14,1.3)
 objects=plate('978 large oval platter',0,0,0,.29,1.50)
 # The large platter is displayed upright, as in the reference set photograph.
 pivot=bpy.data.objects.new('978 upright platter display',None);bpy.context.collection.objects.link(pivot)
 for o in objects:o.parent=pivot
 pivot.rotation_euler.x=math.pi/2; pivot.location=v((0,.44,-.35))
 for x,z in [(-.37,-.16),(.37,-.15)]:
  lathe('978 covered soup bowl',[(0,.10),(.03,.12),(.15,.18),(.20,.195)],ivory,(x,.015,z),n=96);ring('978 bowl gilt rim',(x,.215,z),.195,gold,.002)
  cyl('978 closed soup bowl base',(x,.025,z),.10,.03,ivory)
  lathe('978 raised removable lid',[(0,.19),(.018,.195),(.055,.15),(.08,.04)],ivory,(x,.218,z),n=96,shell=False)
  cyl('978 closed lid crown',(x,.298,z),.04,.008,ivory)
  for side in [-1,1]:handle(x+side*.18,.17,z,.06,ivory,side,.5)
  for k in range(7):a=k*math.tau/7;dinner_flower(x+math.cos(a)*.12,.27,z+math.sin(a)*.12,.023,purple if k%3 else red)
  for k in range(6):a=k*math.tau/6;ball('978 rose lid finial',(x+.018*math.cos(a),.31,z+.018*math.sin(a)),(.014,.012,.009),rose)
def mesh_delivery():
 for o in list(bpy.context.scene.objects):
  if o.type=='CURVE':bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
 groups={}
 for o in bpy.context.scene.objects:
  if o.type=='MESH'and len(o.data.materials)==1:groups.setdefault(o.data.materials[0].name,[]).append(o)
 for obs in groups.values():
  bpy.ops.object.select_all(action='DESELECT')
  for o in obs:o.select_set(True)
  bpy.context.view_layer.objects.active=obs[0]
  if len(obs)>1:bpy.ops.object.join()
def main(only=None):
 for id in [951,941,978]:
  if only and id!=only:continue
  clear();random.seed(id);gold=mat('Gilt detail',(.44,.25,.055),.72,.28);ivory=mat('White porcelain or layered clay',(.82,.84,.80),0,.22);rose=mat('Pink floral enamel',(.50,.20,.24),0,.4);green=mat('Leaf enamel',(.045,.18,.085),0,.4)
  {951:make951,941:make941,978:make978}[id](gold,ivory,rose,green);bpy.context.scene['official_catalogue']=f'https://www.bcmuseum.or.kr/ko/collection/{id}/view';bpy.context.scene['accuracy']='Photo-based reconstruction, minute ornament and hidden surfaces approximate; no invented inscriptions.';save(SRC/f'bcm-{id}.blend');mesh_delivery();export(OUT/f'bcm-{id}.glb');bpy.context.view_layer.update();pts=[o.matrix_world@Vector(p)for o in bpy.context.scene.objects if o.type=='MESH'for p in o.bound_box];lo=Vector(tuple(min(p[i]for p in pts)for i in range(3)));hi=Vector(tuple(max(p[i]for p in pts)for i in range(3)));center=((lo.x+hi.x)/2,(lo.z+hi.z)/2,-(lo.y+hi.y)/2);studio(R/f'public/models/bcm-{id}-preview.png',512,max(hi.z-lo.z,hi.x-lo.x)*1.45,center);print('REAL_EXHIBIT_READY',id,flush=True)
if __name__=='__main__':main(int(sys.argv[sys.argv.index('--')+1])if'--'in sys.argv else None)
