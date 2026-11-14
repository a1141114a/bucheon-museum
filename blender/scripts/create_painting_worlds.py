"""Five authored, walkable painting worlds. Blender 5.x; no raster backdrops.
Atlas coordinates refer to the user-supplied material sheets. Original artwork
is projected on closed high-relief geometry; its unobserved depth is interpretive.
Run: blender --background --python blender/scripts/create_painting_worlds.py
"""
import bpy, math, random, pathlib, json
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parents[2]
OUT=R/'public/models/painting-worlds'; OUT.mkdir(parents=True,exist_ok=True)
BLEND=R/'blender/blend/painting-worlds'; BLEND.mkdir(parents=True,exist_ok=True)
random.seed(29)
def v(p):return (p[0],-p[2],p[1])
def solid(name,color,metal=0,rough=.6,emit=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Metallic'].default_value=metal;n.inputs['Roughness'].default_value=rough
 if emit:n.inputs['Emission Color'].default_value=(*color,1);n.inputs['Emission Strength'].default_value=emit
 return m
def atlasmat(name,img,rect):
 m=solid(name,(.8,.75,.65));n=m.node_tree.nodes;l=m.node_tree.links
 tex=n.new('ShaderNodeTexImage');tex.image=img
 # glTF does not preserve arbitrary Vector Math graphs. Bake the atlas crop
 # into the editable mesh UVs, retaining the unchanged original atlas image.
 m['atlas_rect']=list(rect)
 l.new(tex.outputs['Color'],n.get('Principled BSDF').inputs['Base Color'])
 return m
def finish(o,name,mat,batch='static'):
 o.name=name;o.data.materials.append(mat);o['batch']=batch
 if 'atlas_rect' in mat and o.type=='MESH' and o.data.uv_layers.active:
  x0,y0,x1,y1=mat['atlas_rect']
  for loop in o.data.uv_layers.active.data:
   u,vv=loop.uv;loop.uv=(x0+u*(x1-x0),1-y1+vv*(y1-y0))
 return o
def box(name,p,s,mat,bevel=.025,batch='static'):
 bpy.ops.mesh.primitive_cube_add(size=1,location=v(p));o=bpy.context.object;o.dimensions=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 # Give each cube face the full selected texture tile, rather than a UV cross.
 uv=o.data.uv_layers.active
 for poly in o.data.polygons:
  for j,li in enumerate(poly.loop_indices):uv.data[li].uv=((0,0),(1,0),(1,1),(0,1))[j%4]
 if bevel:
  mod=o.modifiers.new('Rounded stone and joinery','BEVEL');mod.width=bevel;mod.segments=2
 return finish(o,name,mat,batch)
def cyl(name,p,r,h,mat,vertices=24,batch='static'):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=h,location=v(p));o=bpy.context.object
 for poly in o.data.polygons:poly.use_smooth=abs(poly.normal.z)<.8
 return finish(o,name,mat,batch)
def sphere(name,p,s,mat,batch='static'):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,radius=1,location=v(p));o=bpy.context.object;o.scale=(s[0],s[2],s[1])
 for poly in o.data.polygons:poly.use_smooth=True
 return finish(o,name,mat,batch)
def tube(name,points,r,mat,batch='static',cyclic=False):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2;c.resolution_u=2
 sp=c.splines.new('POLY');sp.points.add(len(points)-1)
 for a,p in zip(sp.points,points):a.co=(*v(p),1)
 sp.use_cyclic_u=cyclic;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(mat);o['batch']=batch;return o
def ring(name,p,r,mat,thick=.025,vertical=False,batch='static'):
 points=[]
 for i in range(49):
  t=i*2*math.pi/48
  points.append((p[0]+r*math.cos(t),p[1]+r*math.sin(t) if vertical else p[1],p[2] if vertical else p[2]+r*math.sin(t)))
 return tube(name,points,thick,mat,batch)
def arch(name,x,z,w,h,mat,gothic=False,y=0):
 pts=[]
 for i in range(41):
  t=i/40
  if gothic:xx=(-w/2+w*t);yy=h*(1-abs(2*t-1)**1.7)
  else:xx=w/2*math.cos(math.pi*(1-t));yy=h*math.sin(math.pi*t)
  pts.append((x+xx,y+yy,z))
 tube(name,pts,.13,mat)
 tube(name+' gold fillet',[(a,b+.04,c+.09) for a,b,c in pts],.026,GOLD)
def column(x,z,h=5.5,r=.26):
 box('Plinth',(x,.16,z),(r*3,.32,r*3),STONE,.045)
 for y,rr,hh in [(.38,r*1.35,.12),(.52,r*1.15,.13),(h-.34,r*1.4,.16),(h-.1,r*1.8,.2)]:
  cyl('Turned moulding',(x,y,z),rr,hh,GOLD if y>h-.5 else STONE)
 cyl('Fluted column',(x,(h+.5)/2,z),r,h-.5,WALL,32)
 for i in range(12):
  a=i*math.pi/6;tube('Flute',[(x+r*math.cos(a),.65,z+r*math.sin(a)),(x+r*math.cos(a),h-.5,z+r*math.sin(a))],.012,GOLD)
 for i in range(8):
  a=i*math.pi/4
  sphere('Acanthus',(x+r*1.1*math.cos(a),h-.42,z+r*1.1*math.sin(a)),(.12,.22,.08),GOLD)
def vase(x,z,y=0,r=.25):
 for yy,rr,hh in [(0,.19,.10),(.13,.15,.2),(.38,.29,.38),(.64,.18,.15),(.75,.22,.08)]:cyl('Porcelain vase',(x,y+yy,z),rr*r/.25,hh,TILE)
def flower(x,y,z,scale=1):
 tube('Stem',[(x,y-.6*scale,z),(x,y,z)],.016*scale,LEAF)
 for k in range(6):
  a=k*math.pi/3
  o=sphere('Porcelain petal',(x+.15*scale*math.cos(a),y+.03,z+.15*scale*math.sin(a)),(.14*scale,.025*scale,.24*scale),IVORY)
  o.rotation_euler[2]=-a
 sphere('Flower heart',(x,y+.08,z),(.045*scale,.06*scale,.045*scale),GOLD)
def lantern(x,z,y=4.7):
 cyl('Lantern cap',(x,y+.33,z),.26,.12,GOLD,8)
 cyl('Lantern glass',(x,y,z),.21,.55,GLOW,8)
 cyl('Lantern foot',(x,y-.32,z),.24,.1,GOLD,8)
 for i in range(8):
  a=i*math.pi/4;tube('Lantern ribs',[(x+.22*math.cos(a),y-.3,z+.22*math.sin(a)),(x+.22*math.cos(a),y+.3,z+.22*math.sin(a))],.018,GOLD)
 tube('Lantern chain',[(x,y+.4,z),(x,7.4,z)],.025,GOLD)
def candles(x,z,y=0):
 for i in range(5):
  a=i*2*math.pi/5;xx=x+.27*math.cos(a);zz=z+.27*math.sin(a)
  tube('Candle arm',[(x,y+.6,z),(xx,y+.9,zz)],.028,GOLD)
  cyl('Wax',(xx,y+1.08,zz),.035,.36,IVORY,12)
  sphere('Flame',(xx,y+1.31,zz),(.035,.09,.035),GLOW)
 cyl('Candelabrum',(x,y+.35,z),.055,.7,GOLD)
def scroll(x,y,z,s=.3):
 pts=[]
 for j in range(40):
  t=j/39*math.pi*3.3;rr=s*(1-j/48)
  pts.append((x+rr*math.cos(t),y+rr*math.sin(t),z))
 tube('Cast scrollwork',pts,.022,GOLD)
def panel(x,z,width=3,h=4.8):
 box('Wall panel',(x,2.5,z),(width,5,.2),WALL,.04)
 for side in [-1,1]:box('Gilt panel stile',(x+side*(width/2-.14),2.5,z+.14),(.045,4.6,.05),GOLD,.01)
 for yy in [.24,4.76]:box('Gilt panel rail',(x,yy,z+.14),(width-.24,.045,.05),GOLD,.01)
def window(x,z,w=1.6,h=3.5,side=False):
 before=set(bpy.context.scene.objects)
 pane=box('Stained glass',(x,3.55,z),(w,h,.045),GLASS,.01)
 arch('Window arch',x,z+.04,w,h*.32,STONE,True,3.55+h*.18)
 for dx in [-w/2,w/2,0]:tube('Window tracery',[(x+dx,1.8,z+.08),(x+dx,4.5,z+.08)],.035,GOLD)
 for y in [2.5,3.5,4.5]:box('Window transom',(x,y,z+.08),(w,.04,.04),GOLD,.005)
 if side:
  pivot=bpy.data.objects.new('Side window assembly',None);bpy.context.collection.objects.link(pivot);pivot.location=v((x,0,z));bpy.context.view_layer.update()
  for o in set(bpy.context.scene.objects)-before-{pivot}:o.parent=pivot;o.matrix_parent_inverse=pivot.matrix_world.inverted()
  pivot.rotation_euler[2]=math.pi/2
def relief(index,img):
 # Projection frame in photo pixels. A finite depth field is inverse-projected
 # so frontal recognition is retained while side walls and a solid back exist.
 crops=[(210,205,795,795),(349,128,652,874),(210,205,795,795),(218,215,783,791),(212,212,790,790)]
 polys=[
 None,
 [(390,825),(612,825),(612,421),(583,420),(590,210),(567,421),(510,174),(442,423),(407,420)],
 [(422,404),(467,379),(525,389),(565,423),(598,471),(627,609),(570,633),(420,630),(414,577),(456,522),(455,471),(420,446)],
 [(425,674),(377,637),(395,566),(414,511),(420,427),(449,387),(500,373),(544,386),(567,427),(592,486),(616,548),(635,640),(599,675)],
 [(341,600),(357,510),(348,471),(366,437),(407,432),(447,415),(500,415),(541,390),(555,351),(584,330),(615,333),(635,373),(646,442),(650,527),(677,653),(609,698),(430,690)]
 ]
 def inside(x,y,poly):
  hit=False;j=len(poly)-1
  for i in range(len(poly)):
   a,b=poly[i],poly[j]
   if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:hit=not hit
   j=i
  return hit
 x0,y0,x1,y1=crops[index];nx=180;ny=240;H=2*4.5*math.tan(math.radians(45/2));W=H*(x1-x0)/(y1-y0);pixels=list(img.pixels[:]);iw,ih=img.size
 verts=[];uvs=[];valid=[]
 for j in range(ny+1):
  for i in range(nx+1):
   u=i/nx;vv=j/ny;px=x0+(x1-x0)*u;py=y0+(y1-y0)*vv
   mask=((px-500)**2+(py-505)**2<178**2) if index==0 else inside(px,py,polys[index])
   valid.append(mask)
   q=4*((ih-1-min(ih-1,int(py)))*iw+min(iw-1,int(px)));lum=sum(pixels[q:q+3])/3
   depth=.16+.38*math.sin(math.pi*u)*math.sin(math.pi*vv)+.17*lum
   if index in [2,3]:depth+=.23*math.exp(-((u-.49)**2/.012+(vv-.46)**2/.03))
   if index==0:depth=.14+.23*math.sqrt(max(0,1-((px-500)**2+(py-505)**2)/178**2))+.08*lum
   ratio=(4.5-depth)/4.5
   verts.append(v(((u-.5)*W*ratio,1.65+(.5-vv)*H*ratio,3.5+depth)));uvs.append((px/1000,1-py/1000))
 count=len(verts);verts += [(a,b+.25,c) for a,b,c in verts];uvs+=uvs[:]
 faces=[];mats=[];edges={}
 for j in range(ny):
  for i in range(nx):
   a=j*(nx+1)+i;b=a+1;c=a+nx+2;d=a+nx+1
   if not all(valid[k] for k in [a,b,c,d]):continue
   faces.append((a,d,c,b));mats.append(0);faces.append((a+count,b+count,c+count,d+count));mats.append(1)
   for e in [(a,b),(b,c),(c,d),(d,a)]:
    key=tuple(sorted(e));edges[key]=edges.get(key,0)+1
 for (a,b),n in edges.items():
  if n==1:faces.append((a,b,b+count,a+count));mats.append(1)
 mesh=bpy.data.meshes.new('Closed sculptural relief');mesh.from_pydata(verts,[],faces);mesh.update()
 o=bpy.data.objects.new('ArtworkSculpture',mesh);bpy.context.collection.objects.link(o)
 paint=solid('Original artwork projection',(.8,.8,.8),.05,.65);tex=paint.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img;paint.node_tree.links.new(tex.outputs['Color'],paint.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 mesh.materials.append(paint);mesh.materials.append(IVORY)
 uv=mesh.uv_layers.new(name='UVMap')
 for poly,mi in zip(mesh.polygons,mats):
  poly.material_index=mi;poly.use_smooth=True
  for li in poly.loop_indices:uv.data[li].uv=uvs[mesh.loops[li].vertex_index]
 o['batch']='hero';o['construction']='Closed inverse-projected high relief; depth interpretive'
 return o
def door_leaf(side):
 hinge=side*1.45
 e=bpy.data.objects.new('FinalDoorLeft' if side<0 else 'FinalDoorRight',None);bpy.context.collection.objects.link(e);e.location=v((hinge,0,-8.3))
 bpy.context.view_layer.update()
 for yy,ww,hh,mat in [(1.85,1.43,3.7,TILE),(.14,1.43,.15,GOLD),(3.5,1.43,.15,GOLD)]:
  o=box('Carved final door',(side*.725,yy,-8.3),(ww,hh,.16),mat,.025,'door')
  o.parent=e;o.matrix_parent_inverse=e.matrix_world.inverted()
 for y in [.8,2.0,3.05]:
  for dx in [-.4,.4]:
   o=sphere('Door star',(side*.725+dx,y,-8.17),(.10,.10,.025),GOLD,'door');o.parent=e;o.matrix_parent_inverse=e.matrix_world.inverted()
 return e
def save_export(index,hero):
 scene=bpy.context.scene
 bpy.ops.object.camera_add(location=v((0,2.1,8)));cam=bpy.context.object;cam.rotation_euler=(Vector(v((0,2,-1)))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
 bpy.ops.object.light_add(type='AREA',location=v((0,7,4)));bpy.context.object.data.energy=2200;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=8
 for image in bpy.data.images:
  if image.filepath and image.source=='FILE':image.pack()
 bpy.ops.wm.save_as_mainfile(filepath=str(BLEND/f'world-{index+1}.blend'),compress=True)
 dg=bpy.context.evaluated_depsgraph_get();batches={};originals=list(scene.objects);exports=[]
 for original in originals:
  if original.type not in ['MESH','CURVE'] or original.get('batch') in ['hero','door']:continue
  mesh=bpy.data.meshes.new_from_object(original.evaluated_get(dg),depsgraph=dg)
  o=bpy.data.objects.new('Export',mesh);scene.collection.objects.link(o);o.matrix_world=original.matrix_world.copy()
  batches.setdefault(original.data.materials[0].name,[]).append(o)
 for name,objects in batches.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name='Architecture '+name;exports.append(objects[0])
 bpy.ops.object.select_all(action='DESELECT')
 for o in exports+[o for o in originals if o.get('batch')=='door' or o.name.startswith('FinalDoor')]:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'room-{index+1}.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_image_format='JPEG',export_jpeg_quality=88)
 bpy.ops.object.select_all(action='DESELECT');hero.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'sculpture-{index+1}.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_image_format='JPEG',export_jpeg_quality=94)
 print('WORLD_READY',index+1,flush=True)
rects=[
 [(.128,.75,.212,.866),(.403,.75,.489,.867),(.314,.75,.389,.867),(.22,.75,.298,.866)],
 [(.553,.88,.616,.967),(.914,.761,.98,.849),(.627,.88,.68,.969),(.64,.217,.685,.422)],
 [(.558,.864,.637,.984),(.295,.866,.38,.983),(.103,.866,.18,.983),(.467,.866,.544,.985)],
 [(.012,.86,.086,.976),(.098,.86,.17,.976),(.012,.86,.086,.976),(.633,.023,.737,.305)],
 [(.24,.872,.314,.981),(.547,.872,.617,.981),(.405,.872,.471,.981),(.405,.872,.471,.981)],
]
for index in range(5):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 atlas=bpy.data.images.load(str(R/f'environment-assets/painting-worlds/source/atlas-{index+1}.png'))
 photo=bpy.data.images.load(str(R/f'public/paintings/art-{index+1}.jpg'))
 GOLD=solid('Antique gilt',(.68,.39,.095),.7,.3);IVORY=solid('Porcelain ivory',(.84,.82,.72),.12,.38)
 STONE=solid('Warm cut stone',(.66,.61,.50),0,.7);LEAF=solid('Leaf green',(.12,.25,.12),0,.8);GLOW=solid('Warm luminous glass',(1,.60,.17),0,.25,1.8)
 FLOOR=atlasmat('Floor tile',atlas,rects[index][0]);WALL=atlasmat('Architectural stone',atlas,rects[index][1]);TILE=atlasmat('Decorative ceramic',atlas,rects[index][2]);GLASS=atlasmat('Decorated glass',atlas,rects[index][3])
 for ix in range(-4,5):
  for iz in range(-5,6):
   if index==0 and ix in [1,2] and iz in [-1,0,1]:continue
   box('Individual floor tile',(ix*2,-.08,iz*2),(1.985,.16,1.985),FLOOR,.012)
 # Individual wall bays, mouldings and real columns establish parallax.
 for z in [-7,-2,3,8]:
  for x in [-7.3,7.3]:column(x,z,5.6 if index in [0,2,4] else 6.4)
 for x in [-6,-3,0,3,6]:
  if abs(x)>1.4:panel(x,-10)
 for x in [-8.8,8.8]:
  for z in [-7,-2,3,8]:
   wall=box('Side masonry',(x,2.7,z),(.22,5.4,4.95),WALL,.035)
   box('Cornice',(x,5.5,z),(.45,.22,5),GOLD,.025)
 for z in [-7,-2,3,8]:
  arch('Cross vault',0,z,14.6,2.9 if index in [1,3] else 2,STONE,index in [1,3],5.6 if index in [0,2,4] else 6.4)
 # Hero sculpture is the first object seen on entry, not a scene billboard.
 hero=relief(index,photo)
 cyl('Sculpture pedestal',(0,.18,3.5),1.12,.36,TILE,48)
 ring('Pedestal gilt lip',(0,.38,3.5),1.08,GOLD,.035)
 # Placement niche and physical floor observation medallion.
 for sx in [-1,1]:column(sx*1.95,-8.65,4.5,.18)
 arch('Portal alcove',0,-8.8,3.9,1.25,GOLD,False,3.9)
 ring('Observation mark',(0,.012,-4.8),.67,GOLD,.025)
 for a in range(8):
  t=a*math.pi/4;box('Compass point',(.5*math.cos(t),.02,-4.8+.5*math.sin(t)),(.035,.025,.22),GOLD,.005).rotation_euler[2]=-t
 if index==0:
  for z in [-7,-2,3,8]:
   for x in [-7.3,7.3]:
    arch('Garden arcade',x,z,2.5,1.2,TILE,False,4.4)
    vase(x,z,4.5,.18)
    for k in range(5):flower(x+(k-2)*.17,5.35+random.random()*.2,z,.7)
  for x,z in [(3.7,-3),(3.7,3),(1,-3),(6,-3),(1,3),(6,3)]:
   sphere('Water garden rock',(x,.16,z),(.5,.28,.4),STONE);flower(x,.8,z,.9)
  # Arched bridge deck and turned balustrade, actually modelled in depth.
  for i in range(24):
   z=-3.1+i*.27;h=.10+.57*math.sin(math.pi*i/23)
   box('Bridge voussoir',(3.7,h,z),(1.8,.16,.28),TILE,.02)
   if i%3==0:
    for x in [2.85,4.55]:cyl('Bridge baluster',(x,h+.5,z),.07,.8,IVORY)
  for x in [2.85,4.55]:tube('Bridge handrail',[(x,.95+.57*math.sin(math.pi*i/23),-3.1+i*.27) for i in range(24)],.065,TILE)
  for x,z in [(-5,-5),(-5,2),(5,6),(5,-6),(-3,7)]:
   vase(x,z);flower(x,1.5,z,1.1)
  for z in [-5,0,5]:lantern(-6.5,z,3.8)
 elif index==1:
  for x in [-7.8,7.8]:
   for z in [-5,1,6]:window(x,z,1.1,3.5,True)
  for x in [-3.8,3.8]:
   for z in [-3,0]:
    box('Carved pew seat',(x,.52,z),(2.6,.14,.7),GOLD,.04);box('Pew back',(x,1,z+.3),(2.6,.9,.12),WALL,.04)
    for xx in [-1.1,1.1]:box('Pew end',(x+xx,.65,z),(.13,1.3,.85),STONE,.04)
  for step in range(4):box('Altar step',(0,step*.1,-6-step*.3),(6.5-step*.3,.14,1.6),WALL,.025)
  box('Side altar',(-4.7,.95,-6.6),(2.7,1.1,1),TILE,.04)
  for x in [-2.7,-1.5,1.5,2.7]:candles(x,-6,.45)
  for z in [-5,1,6]:lantern(0,z,6.4)
 elif index==2:
  velvet=solid('Crimson velvet',(.24,.018,.025),0,.85)
  box('Long palace carpet',(0,.012,-1),(2.8,.035,15),GLASS,.005)
  for x in [-5.4,5.4]:
   for z in [-5,1,6]:
    panel(x,z,2.2)
    box('Curtain fall',(x,.0+3.3,z+.15),(1.2,4.4,.2),velvet,.06)
    for k in range(6):tube('Velvet fold',[(x-.5+k*.2,1.1,z+.18),(x-.5+k*.2,5.5,z+.32)],.055,velvet)
   box('Salon console',(x,1.1,0),(2.2,.13,1),GOLD,.05)
   for dx in [-.9,.9]:
    for dz in [-.35,.35]:tube('Cabriole leg',[(x+dx,1,0+dz),(x+dx*.86,.55,dz),(x+dx*.94,.06,dz)],.065,GOLD)
   vase(x,0,1.2)
   box('Velvet chair seat',(x,.58,5),(1,.22,.85),velvet,.12);box('Velvet chair back',(x,1.22,5.35),(1,.95,.18),velvet,.14)
  for z in [-4,3]:
   ring('Chandelier hoop',(0,5.4,z),1.0,GOLD,.07)
   for k in range(12):
    a=k*math.pi/6;xx=math.cos(a);zz=z+math.sin(a)
    tube('Chandelier sweep',[(0,6.3,z),(xx*.65,5.5,zz),(xx,5.6,zz)],.04,GOLD)
    cyl('Chandelier candle',(xx,5.8,zz),.035,.4,IVORY,12);sphere('Chandelier flame',(xx,6.04,zz),(.035,.08,.035),GLOW)
    for t in range(3):sphere('Crystal drop',(xx*.8,5.1-t*.12, z+(zz-z)*.8),(.04,.085,.04),IVORY)
   tube('Chandelier stem',[(0,5.2,z),(0,7.5,z)],.06,GOLD)
 elif index==3:
  for x in [-6,6]:
   for z in [-4,2,7]:window(x,z,1.6,3.8,True)
  ring('Solar halo',(0,4,-6),2.1,GOLD,.07,True)
  for k in range(40):
   t=k*math.pi/20;tube('Halo ray',[(1.95*math.cos(t),4+1.95*math.sin(t),-6),(2.45*math.cos(t),4+2.45*math.sin(t),-6)],.025,GOLD)
  for step in range(5):box('Sanctuary step',(0,.06*step,-5.8-step*.3),(7-step*.4,.14,1.3),WALL,.025)
  box('Sanctuary side altar',(-4.7,.85,-6.9),(2.4,1.2,1),TILE,.05)
  for x in [-4,4]:
   # Draped, volumetric angels with feathered wings.
   cyl('Angel stand',(x,.3,-5),.65,.6,WALL)
   sphere('Draped body',(x,1.35,-5),(.38,.75,.30),IVORY);sphere('Angel head',(x,2.2,-5),(.19,.24,.19),IVORY)
   for side in [-1,1]:
    for k in range(9):sphere('Wing feather',(x+side*(.4+k*.065),1.85+k*.07,-5.1),(.12,.45-k*.02,.06),IVORY)
   candles(x,-4,.4)
 elif index==4:
  cyl('Fountain basin',(0,.25,-1.7),1.8,.5,TILE,64)
  for y,r in [(.7,1.05),(1.6,.68),(2.35,.35)]:
   cyl('Fountain stem',(0,y-.28,-1.7),.12,.55,IVORY)
   cyl('Fountain bowl',(0,y,-1.7),r,.13,TILE,48)
   ring('Fountain gilt rim',(0,y+.07,-1.7),r,GOLD,.035)
  for x in [-5.8,5.8]:
   for z in [-6,1,7]:lantern(x,z,4.6);vase(x,z)
  for x in [-6,6]:
   cyl('Dome drum',(x,5.7,-9),1.25,1.2,TILE,32)
   sphere('Blue gold dome',(x,6.5,-9),(1.35,1.5,1.35),TILE)
   cyl('Dome finial',(x,8.1,-9),.05,.7,GOLD,12);ring('Finial moon',(x,8.5,-9),.16,GOLD,.03,True)
  door_leaf(-1);door_leaf(1)
  arch('Final arch',0,-8.35,3.4,1.3,GOLD,True,3.7)
  for x in [-1.7,1.7]:box('Final door jamb',(x,1.85,-8.3),(.20,3.7,.35),TILE)
  for x,z in [(-5.8,-4.8),(5.8,-4.8)]:cyl('Side offering stand',(x,.6,z),.5,1.2,TILE,32)
 if index in [1,2,3]:
  roof=solid('Vaulted ceiling',(.13,.15,.18) if index==1 else ((.3,.22,.15) if index==2 else (.55,.52,.44)),0,.8)
  box('Continuous roof',(0,7.9,0),(18,.18,21),roof)
  for zz in [-7,-2,3,8]:
   arch('Ceiling vault rib',0,zz,14.6,2.0,GOLD if index!=1 else STONE,index==1,5.7)
  if index==2:
   for xx in [-5,0,5]:
    for zz in [-6,-1,4]:
     box('Coffered ceiling panel',(xx,7.72,zz),(4.6,.12,4.5),WALL,.02)
     ring('Ceiling medallion',(xx,7.6,zz),.5,GOLD,.04)
 # All remaining spaces retain open floor paths around the hero and furniture.
 save_export(index,hero)
print('PAINTING_WORLDS_COMPLETE',flush=True)
