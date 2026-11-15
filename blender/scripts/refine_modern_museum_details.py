"""Photo-led detail pass for the existing Bucheon gallery, not a new layout.
All ornamental textures below are authored mathematically, not copied photos.
Observed shapes/palette are retained; unresolved decorative marks stay schematic.
"""
import bpy,math,random,numpy as np
from museum_model_utils import *
def remove(prefixes):
 for o in list(bpy.context.scene.objects):
  if any(o.name.startswith(p)for p in prefixes):bpy.data.objects.remove(o,do_unlink=True)
def image_mat(name,pixels,rough=.5,metal=0):
 h,w,_=pixels.shape;img=bpy.data.images.new(name,width=w,height=h);img.pixels.foreach_set(pixels.astype(np.float32).ravel());img.pack();m=mat(name,(1,1,1),metal,rough);node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=img;m.node_tree.links.new(node.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);return m
def wall_uv(o,scale):
 for face in o.data.polygons:
  for li in face.loop_indices:
   co=o.data.vertices[o.data.loops[li].vertex_index].co;o.data.uv_layers.active.data[li].uv=(co.y*scale,co.z*scale)
def refine():
 rng=np.random.default_rng(482);random.seed(482)
 gold=bpy.data.materials['Display furniture gilt'];white=bpy.data.materials['Warm white painted museum joinery'];black=bpy.data.materials['Black acoustic panels and tracks'];porcelain=bpy.data.materials['Context crockery - simplified white ceramic'];blue=bpy.data.materials['Context blue floral accents'];wood=bpy.data.materials['Dark cabinet wood'];metal=bpy.data.materials['White display aluminium'];cream=bpy.data.materials['Table cloth']
 glass=bpy.data.materials['Display glazing - low opacity'];b=glass.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(.84,.92,.88,.035);b.inputs['Alpha'].default_value=.035;b.inputs['Transmission Weight'].default_value=0;b.inputs['Roughness'].default_value=.075;b.inputs['Metallic'].default_value=.12
 edge=mat('Polished green glass edges',(.055,.13,.10),.08,.22)
 for o in bpy.context.scene.objects:
  if o.type=='MESH'and o.name.startswith('Green-tinted glass edge'):o.data.materials.clear();o.data.materials.append(edge)
 bpy.data.materials['Black acoustic panels and tracks'].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.92
 # A staggered board mesh gives real joints and a less repetitive oak finish.
 yy,xx=np.mgrid[0:2048,0:512];warp=xx+3*np.sin(yy*.005)+1.5*np.sin(yy*.018);fine=np.sin(warp*.16+np.sin(yy*.006))*.003+np.sin(warp*.35)*.001;large=np.sin(warp*.025+np.sin(yy*.002))* .014;grain=fine+large+rng.normal(0,.001,xx.shape);px=np.ones((2048,512,4),np.float32)
 for k,c in enumerate([.48,.335,.215]):px[:,:,k]=c+grain
 floor=image_mat('Refined oak - long grain',px,.46)
 old=bpy.data.objects.get('Oak floor');old.data.materials.clear();old.data.materials.append(mat('Dark recessed plank joints',(.075,.045,.025),0,.8))
 verts=[];faces=[];uv=[];xmin=-4.4;zmin=-6.4;pitch=.155
 for col in range(math.ceil(8.8/pitch)):
  left=xmin+col*pitch+.00065;right=min(4.4,left+pitch-.0013);z=zmin-random.random()*1.5
  while z<6.4:
   length=random.uniform(.95,1.65);start=max(z,zmin)+.00065;end=min(6.4,z+length)-.00065
   if end>start:
    i=len(verts);verts += [v((left,.002,start)),v((right,.002,start)),v((right,.002,end)),v((left,.002,end))];faces.append((i,i+3,i+2,i+1));shift=random.random()*.5;uv += [(0,shift),(1,shift),(1,shift+(end-start)/2.4),(0,shift+(end-start)/2.4)]
   z+=length
 me=bpy.data.meshes.new('Staggered oak boards');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('Actual staggered floorboard joints',me);bpy.context.collection.objects.link(o);o.data.materials.append(floor);layer=me.uv_layers.new()
 for f in me.polygons:
  for li in f.loop_indices:layer.data[li].uv=uv[me.loops[li].vertex_index]
 # Repeating damask-like leaf medallions, close in scale and palette to photo 02.
 yy,xx=np.mgrid[0:512,0:512];u=xx/512-.5;w=yy/512-.5;r=np.hypot(u,w);a=np.arctan2(w,u);border=np.exp(-((r-(.24+.065*np.cos(4*a)))/.009)**2);petal=np.exp(-((r-(.12+.04*np.cos(8*a)))/.007)**2);dots=np.exp(-((r-.40)/.006)**2)*(.5+.5*np.cos(16*a))**12;pattern=border*.6+petal*.6+dots*.4;px=np.ones((512,512,4),np.float32)
 for k,c in enumerate([.57,.555,.405]):px[:,:,k]=c+pattern*.08+rng.normal(0,.002,(512,512))
 damask=image_mat('Woven damask wallpaper',px,.88)
 for o in bpy.context.scene.objects:
  if o.name.startswith('Dining room wallpaper'):o.data.materials.clear();o.data.materials.append(damask);wall_uv(o,2.3)
 # Cloth drapes over the tabletop with folds and a geometric lace hem.
 remove(['White lace table cloth surface','Hanging cloth valance','Hanging cloth end'])
 verts=[];faces=[];uv=[];nx=48;nz=72
 for i in range(nx+1):
  u=-.94+1.88*i/nx
  for j in range(nz+1):
   z=-1.45+2.90*j/nz;drop=max(0,abs(u)-.77)*1.8+max(0,abs(z)-1.27)*1.5;fold=.008*math.sin(j*.8+i*.2)*(min(1,drop*5));x=math.copysign(min(abs(u),.80),u);zz=math.copysign(min(abs(z),1.30),z);verts.append(v((-3.05+x+fold,.91-drop,.70+zz+fold)));uv.append((i/nx,j/nz))
 for i in range(nx):
  for j in range(nz):k=i*(nz+1)+j;faces.append((k,k+1,k+nz+2,k+nz+1))
 me=bpy.data.meshes.new('Draped tablecloth');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('Soft folded dining tablecloth',me);bpy.context.collection.objects.link(o);o.data.materials.append(cream);layer=me.uv_layers.new()
 for f in me.polygons:
  f.use_smooth=True
  for li in f.loop_indices:layer.data[li].uv=uv[me.loops[li].vertex_index]
 for side in [-1,1]:
  for j in range(36):
   z=-.59+j*.073;pts=[(-3.05+side*.805,.604+.012*math.sin(t),z+.027*math.cos(t))for t in np.linspace(0,math.tau,17)];tube('Scalloped lace edge',pts,.0019,cream,True)
 # Fine blue decoration, foot rings and bowls visible in the dining display.
 def blossom(cx,y,cz,r=.035):
  for k in range(5):
   a=k*math.tau/5;pts=[]
   for t in np.linspace(0,math.tau,17):d=r*(.5+.5*math.cos(t));pts.append((cx+math.cos(a)*d+math.sin(a)*r*.22*math.sin(t),y,cz+math.sin(a)*d-math.cos(a)*r*.22*math.sin(t)))
   tube('Blue porcelain petal',pts,.0015,blue,True)
 for x in [-3.59,-2.51]:
  for z in [-.25,.40,1.05,1.70]:
   ring('Fine porcelain foot',(x,.923,z),.056,porcelain,.003);ring('Plate inner cobalt line',(x,.94,z),.105,blue,.0018)
   for k in range(6):blossom(x+math.cos(k*math.tau/6)*.12,.944,z+math.sin(k*math.tau/6)*.12,.012)
   for k in range(5):
    a=k*math.tau/5;ball('Cup cobalt petals',(x+.060*math.cos(a),.985,z+.060*math.sin(a)),(.006,.010,.003),blue)
 for z in [-.05,.93]:
  lathe('Covered dining tureen',[(0,.045),(.035,.09),(.13,.12),(.18,.10)],porcelain,(-3.05,.925,z),n=64);lathe('Tureen lid',[(0,.105),(.018,.11),(.05,.08),(.07,.018)],porcelain,(-3.05,1.10,z),n=64,shell=False);ball('Tureen finial',(-3.05,1.18,z),(.022,.025,.022),porcelain)
  for side in [-1,1]:handle(-3.05+side*.105,1.05,z,.03,porcelain,side,.5)
  ring('Blue tureen shoulder',(-3.05,1.095,z),.11,blue,.003)
 # Authored illustrative ornaments on the two context vases. No invented labels.
 for name,dark in [('Context pale moon-flask silhouette',False),('Context cobalt vase silhouette',True)]:
  yy,xx=np.mgrid[0:1024,0:1024];u=xx/1024;w=yy/1024;px=np.ones((1024,1024,4),np.float32)
  base=[.10,.28,.43]if dark else [.77,.79,.74]
  for k,c in enumerate(base):px[:,:,k]=c
  if dark:
   vine=np.abs(np.sin((u*3+.14*np.sin(w*17))*math.tau))<.018
   px[vine,:3]=[.65,.44,.17]
   for q in range(19):
    cx=(q*.381)%1;cy=.1+(q*.173)% .8;du=(u-cx+.5)%1-.5;dv=w-cy;r=np.hypot(du,dv);ang=np.arctan2(dv,du);mask=r<(.013+.009*np.cos(5*ang));px[mask,:3]=[.83,.68,.65]if q%2 else[.82,.84,.76]
    leaf=((du/.016)**2+(dv/.04)**2<1)&(du*dv>0);px[leaf,:3]=[.27,.47,.39]
  else:
   maze=(np.abs(np.sin(u*95+np.cos(w*95)*1.9))<.17);px[maze,:3]=[.48,.58,.63]
   for q in range(9):
    du=(u-q*.381+.5)%1-.5;dv=w-(.17+(q*.137)% .70);angle=np.arctan2(dv/.065,du/.032);mask=(du/.032)**2+(dv/.065)**2<(1+.16*np.sin(angle*5))**2;px[mask,:3]=[.67,.49,.23];ink=mask&(np.sin(du*730+np.cos(dv*140))>.72)&(np.sin(dv*630)>.25);px[ink,:3]=[.18,.16,.10]
  m=image_mat('Illustrative photo-palette vase ornament '+str(dark),px,.20,.03)
  for o in bpy.context.scene.objects:
   if o.type=='MESH' and any(old.name==name for old in o.data.materials):o.data.materials.clear();o.data.materials.append(m)
 remove(['Context vase gilt foot'])
 for x,z in [(-.30,2.20),(-.45,-3.25)]:
  box('Shaped gilt display foot',(x,1.205,z),(.52,.055,.30),gold,.025)
  for side in [-1,1]:tube('Curled gilt foot',[(x+side*(.15+.075*math.cos(a)),1.23+.025*math.sin(a),z+.10)for a in np.linspace(0,math.pi*1.7,40)],.014,gold)
  ring('Gilt mouth fillet',(x,2.30 if x==-.30 else 2.34,z),.15 if x==-.30 else .25,gold,.006)
  plate=box('Inclined museum object label',(x+.20,1.19,z+.30),(.22,.012,.14),white,.002);plate.rotation_euler.x=.30
  for k in range(5):box('Object label fine rules',(x+.20,1.201,z+.27+k*.012),(.15 if k else .12,.002,.0025),metal,0)
  for dx in [-.26,.26]:cyl('Acrylic support stud',(x+dx,1.19,z+.17),.005,.035,metal,16)
 for side in [-1,1]:
  pts=[(-.30+side*(.13+.19*math.sin(t)),2.30-.33*t/(math.pi*.85),2.16)for t in np.linspace(0,math.pi*.85,48)]
  tube('Moon flask shaped shoulder handle',pts,.020,gold)
 # Solid cabinetry, raised mouldings, turned feet and small door pulls.
 for z in [-2.1,3.7]:
  for zz in [z-.45,z+.45]:box('Cabinet shaped side',(-3.81,.98,zz),(.61,1.65,.035),wood,.014)
  box('Cabinet lower drawer',(-3.80,.23,z),(.60,.25,.87),wood,.018)
  for yy in [.12,.35,1.82]:box('Cabinet raised moulding',(-3.48,yy,z),(.04,.035,.92),gold,.008)
  for zz in [z-.43,z+.43]:
   for xx in [-4.05,-3.55]:tube('Cabinet cabriole foot',[(xx,.15,zz),(xx+.02,.07,zz+.02),(xx+.045,.03,zz+.04)],.026,wood)
  ball('Gilt cabinet pull',(-3.465,.95,z),(.012,.023,.026),gold)
  tube('Arched cabinet crown',[(-3.80,1.83+.085*math.cos(t),z+.47*math.sin(t))for t in np.linspace(-math.pi/2,math.pi/2,40)],.018,gold)
 # Dense, correctly scaled grille detail instead of empty AC blocks.
 remove(['Ceiling cassette AC','HVAC louvre'])
 for z in [-3,3]:
  box('Ceiling cassette outer bezel',(.1,3.38,z),(.83,.05,.83),white,.02);box('Ceiling cassette dark filter',(.1,3.345,z),(.56,.025,.56),black,.009)
  for k in range(10):
   offset=-.28+k*.062;box('AC grille fin',(.1+offset,3.325,z),(.009,.012,.56),metal,.001)
  for k in range(9):box('AC cross grille',(.1,3.32,z-.26+k*.065),(.54,.009,.006),metal,.001)
 for x in [-1.5,2.5]:
  for z in [-5,-3.5,-2,-.5,1,2.5,4,5.5]:box('Spotlight mounting shoe',(x,3.27,z),(.10,.06,.10),black,.007)
 # Fruit and flowers in the observed dining-room context; no new collection IDs.
 fruit=mat('Context fruit warm colours',(.30,.085,.012),0,.5);leaf=mat('Context leaves',(.03,.11,.025),0,.65)
 lathe('Sideboard fruit bowl',[(0,.09),(.06,.16),(.10,.20)],porcelain,(-3.90,.79,.4),n=48)
 for q in range(7):ball('Context fruit',(-3.90+math.cos(q*2.4)*.11,.93+(q%2)*.035,.40+math.sin(q*2.4)*.10),(.045,.05,.045),fruit)
 for q in range(6):
  z=1.9+q*.025;tube('Context flower stem',[(-2.02,.5,2.5),(-2.02+.08*math.sin(q),.9+q*.035,2.5+.08*math.cos(q))],.004,leaf)
 bpy.context.scene['detail_revision']='2: staggered floorboards, cloth folds, blue-white tableware, glass cabinet joinery, authored illustrative vase ornaments and directed lighting targets.'

