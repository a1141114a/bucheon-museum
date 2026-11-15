import bpy,pathlib,math,json
from mathutils import Vector
from museum_model_utils import v,box,mat
R=pathlib.Path(__file__).resolve().parents[2]
PLACEMENTS=[('951',(-.30,1.18,2.20),1.10,0),('941',(-.45,1.18,-3.25),1.18,0),('978',(-3.05,.925,.45),.52,0),('985',(-3.05,.925,1.65),.15,0),('994',(-3.80,.375,-2.1),.30,math.pi/2),('995',(-3.80,.925,-2.1),.455,math.pi/2),('993',(-3.80,1.475,-2.1),.265,math.pi/2),('992',(-3.80,.925,3.7),.43,math.pi/2),('997',(-3.80,1.475,3.7),.16,math.pi/2),('996',(3.30,1.12,4.8),.43,-math.pi/2),('957',(3.30,1.12,-1.1),.23,-math.pi/2),('1000',(3.99,1.70,-2.8),.65,-math.pi/2)]
REMOVE=['Context','Applied loop handle','Dining candlestick','Candlestick blue','Display candle','Sideboard fruit bowl','Fine porcelain foot','Plate inner cobalt','Blue porcelain petal','Cup cobalt','Covered dining tureen','Tureen lid','Tureen finial','Blue tureen','Shaped gilt display foot','Curled gilt foot','Gilt mouth fillet','Moon flask shaped','Inclined museum object label','Object label fine rules']
def install():
 records=json.loads((R/'museum-assets/batches/candidates-2026-11-15.json').read_text(encoding='utf8'))+json.loads((R/'museum-assets/batches/museum-real-exhibits-2026-11-15.json').read_text(encoding='utf8'))
 names={a['id']:a['name']['en'] for a in records};names['bcm-997']='Galle signed glass mug'
 removed=[]
 for o in list(bpy.context.scene.objects):
  if any(o.name.startswith(s) for s in REMOVE):removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
 white=bpy.data.materials['Warm white painted museum joinery'];ink=mat('Catalogue label ink',(.035,.035,.035),0,.8)
 for id,pos,height,yaw in PLACEMENTS:
  aid='bcm-'+id;folder='museum-real-exhibits' if id in ['951','941','978'] else 'collection-batch-20261115';path=R/f'public/models/{folder}/{aid}.glb'
  if id=='997':path=R/'public/models/bcm-997-exhibit.glb'
  before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(path));obs=[o for o in bpy.context.scene.objects if o not in before];bpy.context.view_layer.update()
  pts=[o.matrix_world@Vector(p) for o in obs if o.type=='MESH' for p in o.bound_box];lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)));center=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z));scale=height/(hi.z-lo.z)
  root=bpy.data.objects.new('Collection_'+aid,None);bpy.context.collection.objects.link(root)
  for o in obs:
   if o.parent not in obs:o.parent=root
   o.name=aid+'_'+o.name
   if o.type=='MESH':o['artifactId']=aid
  root.location=-center*scale;root.scale=(scale,)*3
  place=bpy.data.objects.new('Installed_'+aid,None);bpy.context.collection.objects.link(place);root.parent=place;place.location=v(pos);place.rotation_euler.z=yaw;place['artifactId']=aid
  if id in ['996','957']:box('Collection plinth '+id,(pos[0],.56,pos[2]),(.55,1.12,.55),white,.008)
  x,y,z=pos;lp=(x+.18,y+.025,z+.28)
  if x< -2:lp=(x+.34,y+.025,z)
  if x>2:lp=(2.42,y-.10,z)
  plate=box('Collection label '+id,lp,(.36,.10,.012),white,.003);plate['artifactId']=aid
  bpy.ops.object.text_add(location=v((lp[0]-.165,lp[1]-.018,lp[2]+.008)));t=bpy.context.object;t.name='Catalogue name '+aid;t.data.body=names[aid];t.data.size=.022;t.data.extrude=.0001;t.rotation_euler=(math.pi/2,0,0);t.data.materials.append(ink);t['artifactId']=aid
  bpy.context.view_layer.update()
  if t.dimensions.x>.33:t.scale*=.33/t.dimensions.x
  bpy.ops.object.select_all(action='DESELECT');t.select_set(True);bpy.context.view_layer.objects.active=t;bpy.ops.object.convert(target='MESH');t.select_set(False)
 bpy.context.scene['removed_context_objects']=len(removed)
 return [{'id':'bcm-'+id,'position':list(pos),'height':height,'source':f'https://www.bcmuseum.or.kr/ko/collection/{id}/view','placement':'photo-corresponding main case' if id in ['951','941'] else 'approved replacement; not asserted original position'} for id,pos,height,yaw in PLACEMENTS]
