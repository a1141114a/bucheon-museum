"""Production scenery refinement, using each supplied atlas and whole framed originals.
No segmented portrait silhouettes, height fields or scene-image backdrops.
Run Blender --background --factory-startup --python this_file.py
"""
import bpy, math, random, pathlib, json
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parents[2]
# Reuse the editable primitive/UV utilities, without executing the archived build.
exec(compile((R/'blender/scripts/create_painting_worlds.py').read_text(encoding='utf-8').split('for index in range(5):')[0], 'shared_model_utilities', 'exec'))
OUT=R/'public/models/painting-worlds-v2';OUT.mkdir(parents=True,exist_ok=True)
BLEND=R/'blender/blend/painting-worlds-v2';BLEND.mkdir(parents=True,exist_ok=True)
random.seed(20261115)
ART_RECTS=[(.096,.094,.904,.904),(.282,.058,.719,.943),(.086,.090,.910,.916),(.106,.096,.893,.900),(.082,.094,.918,.916)]
COUNTS=[]
DRACO=dict(export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=14,export_draco_normal_quantization=10,export_draco_texcoord_quantization=14)
HERO_LOCATIONS=[(-3.2,-.7),(0,-.8),(0,-.8),(0,-.8),(-3.7,1.4)]
_raw_tube=tube
CURVE_MATERIALS={}
def tube(name,points,r,mat,batch='static',cyclic=False):
 # Curves have generated length UVs, not mesh UVs. A cropped-atlas material
 # on them would sample neighbouring cells; use a matching solid fillet.
 if 'atlas_rect' in mat:
  key=mat.name
  if key not in CURVE_MATERIALS:
   color=(.83,.80,.70) if 'walnut' not in key.lower() else (.12,.055,.025)
   CURVE_MATERIALS[key]=solid(key+' curve fillet',color,0,.35)
  mat=CURVE_MATERIALS[key]
 if 3<=len(points)<=8 and not cyclic:
  # Smooth the actual sweep path: decorative legs and candle branches should
  # not retain the sharp kinks of their sparse authoring control points.
  out=[]
  for i in range(len(points)-1):
   p0=Vector(points[max(0,i-1)]);p1=Vector(points[i]);p2=Vector(points[i+1]);p3=Vector(points[min(len(points)-1,i+2)])
   for j in range(6):
    t=j/6;out.append(tuple(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)))
  out.append(points[-1]);points=out
 return _raw_tube(name,points,r,mat,batch,cyclic)

def material_cell(name,cell,metal=0,rough=.5):
 col,row=cell%4,cell//4;pad=.003
 m=atlasmat(name,DETAIL,(col/4+pad,row/4+pad,(col+1)/4-pad,(row+1)/4-pad))
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
 return m

def patchmat(name,rect,metal=0,rough=.6):
 m=atlasmat(name,SOURCE,rect);bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
 return m

def mesh_object(name,verts,faces,mat,uvs=None,batch='static',smooth=False):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata([v(p) for p in verts],[],faces);mesh.update()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
 if uvs:
  layer=mesh.uv_layers.new(name='UVMap')
  for poly in mesh.polygons:
   for li in poly.loop_indices:layer.data[li].uv=uvs[mesh.loops[li].vertex_index]
 for poly in mesh.polygons:poly.use_smooth=smooth
 return finish(o,name,mat,batch)

def lathe(name,x,y,z,profile,mat,n=48):
 low=min(p[0] for p in profile);high=max(p[0] for p in profile);span=max(.001,high-low);repeat_v=1
 if span>2 and all(profile[j+1][0]>=profile[j][0] for j in range(len(profile)-1)):
  repeat_v=max(1,round(span/1.1));ys=sorted(set([p[0] for p in profile]+[low+span*k/(repeat_v*4) for k in range(repeat_v*4+1)]));resampled=[]
  for yy in ys:
   for j in range(len(profile)-1):
    if profile[j][0]<=yy<=profile[j+1][0] and profile[j+1][0]>profile[j][0]:
     t=(yy-profile[j][0])/(profile[j+1][0]-profile[j][0]);resampled.append((yy,profile[j][1]*(1-t)+profile[j+1][1]*t));break
  profile=resampled
 verts=[];uv=[]
 for j,(yy,r) in enumerate(profile):
  for i in range(n+1):
   a=i*math.tau/n;verts.append((x+r*math.cos(a),y+yy,z+r*math.sin(a)));uv.append((i/n,(yy-low)/span))
 faces=[]
 for j in range(len(profile)-1):
  for i in range(n):
   a=j*(n+1)+i;faces.append((a,a+n+1,a+n+2,a+1))
 o=mesh_object(name,verts,faces,mat,uv,smooth=True)
 if repeat_v>1 and 'atlas_rect' in mat:repeat_mesh_uv(o,mat,1,repeat_v)
 return o

def leaf(name,base,direction,length,width,mat):
 # Curved, double-sided sculpted leaf/petal, with a center ridge and tapered tip.
 b=Vector(base);d=Vector(direction).normalized();across=d.cross(Vector((0,1,0)))
 if across.length<.01:across=Vector((1,0,0))
 across.normalize();verts=[];uv=[]
 for i in range(13):
  t=i/12;w=width*math.sin(math.pi*t)**.7
  for j in range(5):
   s=j/2-1;p=b+d*(length*t)+across*(s*w)+Vector((0,.10*length*math.sin(math.pi*t)*(1-s*s)+.15*length*t*t,0))
   verts.append(tuple(p));uv.append(((s+1)/2,t))
 faces=[]
 for i in range(12):
  for j in range(4):
   a=i*5+j;faces.append((a,a+1,a+6,a+5))
 return mesh_object(name,verts,faces,mat,uv,smooth=True)

def turned_column(x,z,h=5.7,r=.30,ceramic=False):
 mat=PORCELAIN if ceramic else MARBLE
 box('Dressed column plinth',(x,.16,z),(r*3.3,.32,r*3.3),MARBLE,.035)
 profile=[(.31,r*1.48),(.38,r*1.48),(.43,r*1.25),(.49,r*1.35),(.56,r*1.04),(.70,r), (h-.75,r*.84),(h-.65,r*.98),(h-.54,r*1.34),(h-.43,r*1.32),(h-.30,r*1.6),(h-.13,r*1.65)]
 lathe('Entasis shaft and turned mouldings',x,0,z,profile,mat)
 for yy,rr in [(.40,r*1.48),(.54,r*1.3),(h-.49,r*1.34),(h-.18,r*1.65)]:ring('Fine capital fillet',(x,yy,z),rr,GOLD,.018)
 for i in range(12):
  a=i*math.tau/12
  leaf('Carved acanthus capital',(x+math.cos(a)*r*.8,h-.67,z+math.sin(a)*r*.8),(math.cos(a),.8,math.sin(a)),r*1.05,r*.23,GOLD if INDEX in [2,3,4] else MARBLE)
  if not ceramic:tube('Shaft flute',[(x+math.cos(a)*r*.99,.75,z+math.sin(a)*r*.99),(x+math.cos(a)*r*.85,h-.78,z+math.sin(a)*r*.85)],.011,IVORY)
 box('Abacus',(x,h-.04,z),(r*3.4,.16,r*3.4),MARBLE,.022)

def arch_points(cx,z,w,rise,spring,pointed=False):
 pts=[]
 for i in range(49):
  t=i/48;xx=-w/2+w*t
  yy=math.sqrt(max(0,(w)**2-(abs(xx)+w/2)**2))/(math.sqrt(3)*w/2) if pointed else math.sqrt(max(0,1-(2*xx/w)**2))
  pts.append((cx+xx,spring+rise*yy,z))
 return pts

def masonry_arch(cx,z,w,rise,spring,mat,pointed=False,thick=.22):
 if mat==PORCELAIN:mat=MARBLE
 pts=arch_points(cx,z,w,rise,spring,pointed)
 for k in range(0,48,2):
  a,b=Vector(pts[k]),Vector(pts[k+2]);normal=Vector((-(b-a).y,(b-a).x,0)).normalized()*thick
  if normal.y<0:normal=-normal
  corners=[tuple(a),tuple(b),tuple(b+normal),tuple(a+normal)]
  verts=[(x,y,zz+depth) for depth in [-.20,.20] for x,y,zz in corners]
  o=mesh_object('Cut arch voussoir',verts,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],mat,[(0,0),(1,0),(1,1),(0,1)]*2)
  bevel=o.modifiers.new('Stone arris','BEVEL');bevel.width=.009;bevel.segments=2
 for offset,radius in [(-.025,.026),(.08,.045)]:tube('Continuous archivolt',[(x,y+.06,zz+offset+.24) for x,y,zz in pts],radius,GOLD if INDEX!=1 else MARBLE)

def floor_grid(mat,step=1.05):
 verts=[];faces=[];uv=[]
 for ix in range(-9,9):
  for iz in range(-10,10):
   x=ix*step;z=iz*step
   if INDEX==0 and 2.05<x+step/2<5.45 and abs(z+step/2)<3.25:continue
   if abs(x)>9.2 or abs(z)>10.5:continue
   a=len(verts);verts.extend([(x+.008,0,z+.008),(x+step-.008,0,z+.008),(x+step-.008,0,z+step-.008),(x+.008,0,z+step-.008)]);faces.append((a,a+3,a+2,a+1));uv.extend([(0,0),(1,0),(1,1),(0,1)])
 mesh_object('Individually jointed paving',verts,faces,mat,uv)
 box('Structural subfloor',(0,-.14,0),(19,.2,22),DARK,.0)
 for x in [-6.55,6.55]:box('Inlaid border',(x,.009,0),(.04,.012,20.4),GOLD,.003)

def tiled_panel(name,x,y,z,w,h,mat,cols,rows):
 verts=[];faces=[];uv=[]
 for j in range(rows):
  for i in range(cols):
   xx=x-w/2+w*i/cols;yy=y-h/2+h*j/rows;a=len(verts)
   verts.extend([(xx,yy,z),(xx+w/cols,yy,z),(xx+w/cols,yy+h/rows,z),(xx,yy+h/rows,z)])
   faces.append((a,a+1,a+2,a+3));uv.extend([(0,0),(1,0),(1,1),(0,1)])
 return mesh_object(name,verts,faces,mat,uv)

def repeat_mesh_uv(o,mat,ru,rv):
 x0,y0,x1,y1=mat['atlas_rect'];layer=o.data.uv_layers.active
 for poly in o.data.polygons:
  local=[((layer.data[li].uv.x-x0)/(x1-x0),(layer.data[li].uv.y-(1-y1))/(y1-y0)) for li in poly.loop_indices]
  tu=math.floor(sum(u for u,vv in local)/len(local)*ru);tv=math.floor(sum(vv for u,vv in local)/len(local)*rv)
  for li,(u,vv) in zip(poly.loop_indices,local):layer.data[li].uv=(x0+(u*ru-tu)*(x1-x0),1-y1+(vv*rv-tv)*(y1-y0))

def wall_bay(x,z,w=3.0,h=6.8,side=False):
 before=set(bpy.context.scene.objects)
 # Lower stone dado, fine mouldings, separate framed material fields.
 box('Wall core',(x,h/2,z),(w,h,.28),WALL,.025)
 for y,hh,depth,mat in [(.18,.22,.39,MARBLE),(.95,1.30,.34,MARBLE),(1.68,.09,.42,GOLD),(h-.36,.12,.42,GOLD),(h-.13,.23,.5,MARBLE)]:box('Architectural dado/cornice',(x,y,z+.10),(w,hh,depth),mat,.018)
 panelmat=VELVET if INDEX==2 else (BLUE if INDEX==4 else WALL)
 if INDEX==2:tiled_panel('Woven damask wall field',x,(h+1.7)/2,z+.202,w-.34,h-2.08,panelmat,4,8)
 else:box('Recessed panel field',(x,(h+1.7)/2,z+.17),(w-.34,h-2.08,.05),panelmat,.005)
 for dx in [-w/2+.15,w/2-.15]:box('Panel fluted pilaster',(x+dx,(h+1.65)/2,z+.23),(.065,h-1.91,.10),GOLD,.01)
 for y in [1.86,h-.4]:box('Panel rail',(x,y,z+.24),(w-.28,.055,.10),GOLD,.01)
 if INDEX in [2,3,4]:
  for yy in [2.07,h-.62]:
   for xx in [-w/2+.38,w/2-.38]:scroll(x+xx,yy,z+.30,.11)
 if side:
  pivot=bpy.data.objects.new('Wall bay assembly',None);bpy.context.collection.objects.link(pivot);pivot.location=v((x,0,z));bpy.context.view_layer.update()
  for o in set(bpy.context.scene.objects)-before-{pivot}:o.parent=pivot;o.matrix_parent_inverse=pivot.matrix_world.inverted()
  pivot.rotation_euler[2]=math.pi/2

def vase_detail(x,z,y=0,scale=1,flowers=True):
 profile=[(0,.22),(.05,.27),(.10,.27),(.16,.19),(.30,.22),(.44,.36),(.70,.39),(.92,.29),(1.02,.17),(1.15,.16),(1.20,.22),(1.27,.22),(1.28,.16),(1.16,.12),(1.07,.13)]
 lathe('Hollow porcelain urn',x,y,z,[(a*scale,b*scale) for a,b in profile],PORCELAIN if INDEX in [0,4] else MARBLE)
 for yy,rr in [(.06,.27),(.19,.21),(1.21,.22)]:ring('Urn gilded rim',(x,y+yy*scale,z),rr*scale,GOLD,.012*scale)
 for side in [-1,1]:tube('Urn scroll handle',[(x+side*.28*scale,y+.72*scale,z),(x+side*.48*scale,y+.85*scale,z),(x+side*.48*scale,y+.55*scale,z),(x+side*.30*scale,y+.43*scale,z)],.027*scale,GOLD)
 if flowers:
  for i in range(7):
   a=i*2.3999;r=.18*scale*(i%3);xx=x+r*math.cos(a);zz=z+r*math.sin(a)
   lily(xx,y+(1.72+(i%3)*.12)*scale,zz,.52*scale) if INDEX in [0,3] else rose(xx,y+(1.50+(i%3)*.10)*scale,zz,.25*scale)

def lily(x,y,z,scale=1):
 tube('Lily stem',[(x-.08*scale,0.12,z),(x,y-.12*scale,z)],.018*scale,LEAF)
 for k in range(6):
  a=k*math.pi/3
  leaf('Curled lily petal',(x,y,z),(math.cos(a),.35,math.sin(a)),.58*scale,.17*scale,IVORY)
  tube('Lily stamen',[(x,y+.01,z),(x+.16*scale*math.cos(a),y+.22*scale,z+.16*scale*math.sin(a))],.008*scale,GOLD)
  sphere('Pollen anther',(x+.16*scale*math.cos(a),y+.23*scale,z+.16*scale*math.sin(a)),(.025*scale,.015*scale,.015*scale),GOLD)
 for side in [-1,1]:leaf('Lily lance leaf',(x,y*.55,z),(side,.35,.12),.6*scale,.09*scale,LEAF)

def rose(x,y,z,s=.25):
 for layer in range(3):
  for k in range(7):
   a=k*math.tau/7+layer*.4
   leaf('Layered rose petal',(x,y+layer*s*.07,z),(math.cos(a),.35+layer*.2,math.sin(a)),s*(1-layer*.2),s*.44,ROSE if k%3 else IVORY)
 leaf('Rose foliage',(x,y-.2,z),(1,.1,.4),s*1.1,s*.3,LEAF)

def vine_along(points,flowers=False):
 tube('Climbing vine',points,.022,LEAF)
 for i,p in enumerate(points):
  if i%2==0:
   leaf('Vine leaf',p,(math.sin(i*1.7),.4,math.cos(i*1.7)),.25,.09,LEAF)
   if flowers and i%6==0:rose(*p,.17)

def candelabrum(x,z,y=0,height=1.5,arms=5):
 lathe('Turned candelabrum',x,y,z,[(0,.18),(.05,.2),(.1,.12),(.3,.06),(.5,.11),(.6,.05),(height*.74,.045)],GOLD,32)
 for i in range(arms):
  a=i*math.tau/arms;r=height*.25;xx=x+r*math.cos(a);zz=z+r*math.sin(a);yy=y+height*.74
  tube('Curving candle arm',[(x,y+height*.4,z),(x+r*.45*math.cos(a),yy-.18,z+r*.45*math.sin(a)),(xx,yy,zz)],.024,GOLD)
  lathe('Candle drip tray',xx,yy,zz,[(0,.045),(.04,.09),(.08,.09)],GOLD,20)
  cyl('Ivory wax candle',(xx,yy+.23,zz),.036,.3,IVORY,20)
  sphere('Luminous flame',(xx,yy+.42,zz),(.025,.07,.025),GLOW)

def lantern_detail(x,z,y=4.2,scale=1):
 n=8;lathe('Perforated lantern crown',x,y,z,[(.2,.25),(.31,.24),(.48,.08),(.52,.04)],GOLD,n)
 lathe('Lantern lower bowl',x,y,z,[(-.36,.12),(-.25,.25),(-.20,.25)],GOLD,n)
 cyl('Amber glass lantern',(x,y,z),.225,.43,GLOW,n)
 for k in range(n):
  a=k*math.tau/n;xx=x+.235*math.cos(a);zz=z+.235*math.sin(a)
  tube('Lantern cast rib',[(xx,y-.23,zz),(xx,y+.25,zz)],.018,GOLD)
  for dy in [-.1,.1]:sphere('Lantern lattice bead',(xx,y+dy,zz),(.025,.025,.025),GOLD)
 if y>3:tube('Lantern suspension',[(x,y+.5,z),(x,7.3,z)],.018,GOLD)
 elif y>1:lathe('Lantern floor standard',x,0,z,[(0,.20),(.08,.24),(.16,.12),(.4,.055),(y-.38,.045)],GOLD,24)

def curtain(x,z,w=2,h=4.5,y=.8,white=False,side_wall=False):
 before=set(bpy.context.scene.objects)
 fabric=IVORY if white else VELVET
 for side in [-1,1]:
  verts=[];uv=[]
  for j in range(33):
   t=j/32;fall=y+h*(1-t);gather=.20+.8*abs(t-.43)
   for i in range(33):
    u=i/32;xx=x+side*(w*.33+u*w*.42*gather);zz=z+.10*math.cos(u*math.tau*7)*(1+.5*t)
    verts.append((xx,fall,zz));uv.append((u,t))
  faces=[]
  for j in range(32):
   for i in range(32):a=j*33+i;faces.append((a,a+1,a+34,a+33))
  o=mesh_object('Gathered fabric with real folds',verts,faces,fabric,uv,smooth=True)
  if 'atlas_rect' in fabric:repeat_mesh_uv(o,fabric,2,8)
  tube('Curtain gold tie',[(x+side*w*.35,y+h*.55,z+.16),(x+side*w*.55,y+h*.52,z+.18)],.026,GOLD)
  for k in range(10):
   xx=x+side*(w*.32+k*w*.024)
   tube('Valance fringe',[(xx,y+h-.25,z+.1),(xx,y+h-.43-.10*math.sin(k/9*math.pi),z+.1)],.008,GOLD)
 pts=[(x-w*.7+w*1.4*i/32,y+h-.08-.26*math.sin(math.pi*i/32),z+.05) for i in range(33)]
 tube('Swag cord',pts,.04,GOLD)
 if side_wall:
  pivot=bpy.data.objects.new('Wall mounted drapery',None);bpy.context.collection.objects.link(pivot);pivot.location=v((x,0,z));bpy.context.view_layer.update()
  for o in set(bpy.context.scene.objects)-before-{pivot}:o.parent=pivot;o.matrix_parent_inverse=pivot.matrix_world.inverted()
  pivot.rotation_euler[2]=math.pi/2

def chair(x,z,angle=0):
 before=set(bpy.context.scene.objects)
 box('Upholstered chair seat',(x,.55,z),(1.05,.2,.9),VELVET,.10)
 box('Carved chair seat rail',(x,.40,z),(1.1,.12,.94),GOLD,.03)
 for dx in [-.43,.43]:
  for dz in [-.36,.36]:tube('Cabriole chair leg',[(x+dx,0,z+dz),(x+dx*.8,.22,z+dz*.9),(x+dx,.47,z+dz)],.048,GOLD)
 for dx in [-.46,.46]:tube('Carved chair back upright',[(x+dx,.5,z-.35),(x+dx*1.10,1.3,z-.48),(x+dx*.7,1.62,z-.48)],.055,GOLD)
 sphere('Buttoned velvet back',(x,1.22,z-.44),(.47,.47,.10),VELVET)
 for k in range(10):
  a=k*math.tau/10;sphere('Upholstery nail',(x+.43*math.cos(a),1.22+.43*math.sin(a),z-.32),(.018,.018,.018),GOLD)
 for dx in [-.42,0,.42]:sphere('Tuft button',(x+dx*.55,1.2,z-.32),(.025,.025,.015),GOLD)
 pivot=bpy.data.objects.new('Chair arrangement',None);bpy.context.collection.objects.link(pivot);pivot.location=v((x,0,z));bpy.context.view_layer.update()
 for o in set(bpy.context.scene.objects)-before-{pivot}:o.parent=pivot;o.matrix_parent_inverse=pivot.matrix_world.inverted()
 pivot.rotation_euler[2]=angle

def console(x,z,w=2.4,y=1.05):
 box('Marble console top',(x,y,z),(w,.13,.9),MARBLE,.045)
 box('Carved apron',(x,y-.15,z),(w-.08,.22,.72),GOLD,.045)
 for side in [-1,1]:
  for dz in [-.29,.29]:
   xx=x+side*(w/2-.19)
   tube('Swept console leg',[(xx,.03,z+dz),(xx-side*.12,.36,z+dz*.6),(xx+side*.08,.76,z+dz),(xx,y-.15,z+dz)],.058,GOLD)
   leaf('Console acanthus knee',(xx,.70,z+dz+.03),(side,.5,0),.28,.09,GOLD)
 for xx in [-w*.27,0,w*.27]:scroll(x+xx,y-.15,z+.40,.11)

def chandelier(z):
 x=0;y=5.2
 lathe('Chandelier central stem',x,y,z,[(0,.12),(.3,.16),(.55,.1),(1,.08),(1.5,.06)],GOLD,32)
 for tier,radius,n,dy in [(0,1.20,12,0),(1,.77,8,.7)]:
  ring('Chandelier arm ring',(0,y+dy,z),radius*.72,GOLD,.045)
  for k in range(n):
   a=k*math.tau/n;xx=radius*math.cos(a);zz=z+radius*math.sin(a)
   tube('S scroll candle branch',[(0,y+.4+dy,z),(xx*.7,y-.15+dy,z+(zz-z)*.7),(xx,y+.12+dy,zz)],.035,GOLD)
   lathe('Candle cup',xx,y+.1+dy,zz,[(0,.045),(.04,.11),(.1,.09)],GOLD,16)
   cyl('Chandelier wax',(xx,y+.33+dy,zz),.035,.27,IVORY,16);sphere('Candle flame',(xx,y+.51+dy,zz),(.026,.07,.026),GLOW)
   for t in range(5):
    u=t/4;cx=xx*(.28+.6*u);cz=z+(zz-z)*(.28+.6*u);cy=y+dy-.15-.35*math.sin(math.pi*u)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=v((cx,cy,cz)));o=bpy.context.object;o.scale=(.035,.035,.085);finish(o,'Faceted crystal pendant',CRYSTAL)
 tube('Chandelier chain',[(0,y+1.5,z),(0,8.2,z)],.035,GOLD)

def armillary(x,z,y=0,s=1):
 lathe('Armillary pedestal',x,y,z,[(0,.28*s),(.08*s,.33*s),(.17*s,.22*s),(.4*s,.1*s),(.7*s,.13*s),(.8*s,.07*s)],GOLD,32)
 center=Vector((x,y+1.23*s,z))
 for k in range(5):
  pts=[]
  for j in range(65):
   a=j*math.tau/64;xx=.5*s*math.cos(a);yy=.5*s*math.sin(a)
   t=k*.55;pts.append((center.x+xx,center.y+yy*math.cos(t),center.z+yy*math.sin(t)))
  tube('Armillary orbital ring',pts,.014*s,GOLD)
 sphere('Celestial globe',tuple(center),(.09*s,)*3,GOLD)
 tube('Celestial axis',[(x-.45*s,y+.8*s,z),(x+.45*s,y+1.7*s,z)],.02*s,GOLD)

def book(x,z,y=1.0):
 box('Book leather binding',(x,y,z),(.60,.10,.48),WOOD,.018)
 for side in [-1,1]:
  o=box('Open illuminated page',(x+side*.145,y+.07,z),(.29,.025,.44),IVORY,.005);o.rotation_euler[1]=side*.10
  for line in range(10):box('Illuminated manuscript line',(x+side*.145,y+.086,z-.17+line*.035),(.21,.002,.004),GOLD,.0)

def pew(x,z):
 box('Polished walnut seat',(x,.52,z),(2.8,.13,.68),WOOD,.035)
 box('Panelled walnut back',(x,.96,z-.28),(2.8,.78,.12),WOOD,.035)
 for dx in [-1.32,1.32]:
  box('Shaped pew end',(x+dx,.65,z),(.14,1.3,.86),WOOD,.055)
  ring('Pew end carved rosette',(x+dx,1.05,z+.43),.09,GOLD,.012,True)
 for dx in [-.85,0,.85]:
  for yy in [.72,1.18]:box('Pew panel rail',(x+dx,yy,z-.20),(.72,.03,.02),GOLD,.002)
  arch('Pew tracery',x+dx,z-.19,.62,.22,MARBLE,True,.86)
 for dx in [-1.1,1.1]:box('Pew foot',(x+dx,.2,z),(.15,.4,.5),WOOD,.025)

def carved_panel(x,z,s=1):
 # Preserve the detailed supplied carved angel within its complete stone panel.
 # A rectilinear carved stela is preferable to an inaccurate humanoid proxy.
 mat=patchmat('Original carved angel panel',(.544,.623,.621,.731) if INDEX==1 else (.734,.352,.856,.551))
 width=1.35*s;height=1.9*s;cy=1.40*s
 box('Devotional stone stela',(x,cy,z),(width+.13,height+.13,.24),MARBLE,.025)
 mesh_object('Preserved carved panel face',[(x-width/2,cy-height/2,z+.14),(x+width/2,cy-height/2,z+.14),(x+width/2,cy+height/2,z+.14),(x-width/2,cy+height/2,z+.14)],[(0,1,2,3)],mat,[(0,0),(1,0),(1,1),(0,1)])
 for side in [-1,1]:
  box('Stela stepped border',(x+side*(width/2+.08),cy,z+.12),(.08,height+.3,.13),GOLD,.018)
  box('Stela stepped border',(x,cy+side*(height/2+.08),z+.12),(width+.22,.08,.13),GOLD,.018)
 box('Stela pedestal',(x,.22*s,z),(width+.4,.44*s,.7),MARBLE,.04)
 masonry_arch(x,z+.08,width+.3,.48*s,cy+height/2+.14,MARBLE,True,.10)

def wall_picture(x,z,variant=0):
 mat=patchmat('Supplied salon framed portrait '+str(variant),(.006,.012,.147,.259) if variant==0 else (.158,.012,.29,.26))
 w=1.38;h=2.25;y=3.55
 box('Portrait backing',(x,y,z),(w,h,.16),WOOD,.025)
 mesh_object('Complete decorative portrait',[(x-w/2,y-h/2,z+.10),(x+w/2,y-h/2,z+.10),(x+w/2,y+h/2,z+.10),(x-w/2,y+h/2,z+.10)],[(0,1,2,3)],mat,[(0,0),(1,0),(1,1),(0,1)])
 for side in [-1,1]:
  box('Portrait physical moulding',(x+side*w/2,y,z+.1),(.035,h+.04,.07),GOLD,.01)
  box('Portrait physical moulding',(x,y+side*h/2,z+.1),(w+.04,.035,.07),GOLD,.01)

def angel(x,z,s=1):
 lathe('Angel statue pedestal',x,0,z,[(0,.58*s),(.12*s,.65*s),(.25*s,.56*s),(.42*s,.48*s)],MARBLE)
 # A draped, kneeling figure: shaped fold mesh instead of stacked ellipsoids.
 verts=[];uv=[]
 for j in range(33):
  t=j/32;yy=.43+1.12*t;radius=.46*(1-t)+.17*t
  for k in range(49):
   a=k*math.tau/48;rr=radius*(1+.07*math.sin(a*14+t*2));verts.append((x+s*rr*math.cos(a),s*yy,z+s*(rr*.7*math.sin(a)-.12*t)));uv.append((k/48,t))
 faces=[]
 for j in range(32):
  for k in range(48):a=j*49+k;faces.append((a,a+1,a+50,a+49))
 mesh_object('Sculpted flowing drapery',verts,faces,IVORY,uv,smooth=True)
 sphere('Inclined angel head',(x,1.79*s,z+.01*s),(.17*s,.23*s,.18*s),IVORY)
 sphere('Hair cap',(x,1.90*s,z-.035*s),(.18*s,.16*s,.17*s),MARBLE)
 for k in range(9):
  a=-1.1+k*.27;tube('Sculpted hair curl',[(x+.18*s*math.sin(a),1.94*s,z+.14*s*math.cos(a)),(x+.15*s*math.sin(a),1.82*s,z+.16*s*math.cos(a))],.013*s,MARBLE)
 sphere('Statue nose',(x,1.78*s,z+.18*s),(.035*s,.065*s,.055*s),IVORY)
 for side in [-1,1]:
  tube('Closed eyelid',[(x+side*.045*s,1.82*s,z+.165*s),(x+side*.10*s,1.815*s,z+.15*s)],.006*s,GOLD)
  tube('Draped arm',[(x+side*.20*s,1.47*s,z),(x+side*.32*s,1.28*s,z+.20*s),(x+side*.04*s,1.53*s,z+.38*s)],.08*s,IVORY)
  for f in range(4):tube('Praying finger',[(x+side*.025*s,1.48*s+f*.025*s,z+.39*s),(x+side*.018*s,1.66*s,z+.38*s+f*.012*s)],.013*s,IVORY)
  for layer in range(3):
   for k in range(12):
    a=.15+k*.11;length=(.72-layer*.12)*s
    leaf('Individually carved wing feather',(x+side*.17*s,1.48*s+layer*.09*s,z-.18*s),(side*(.5+math.sin(a)),.3+math.cos(a),-.18),length,.058*s,IVORY)

def dome(x,z,base=6,r=1.4):
 prof=[(0,r*.95),(.18,r),(.44,r*1.08),(.75,r*1.04),(1.02,r*.87),(1.30,r*.62),(1.56,r*.31),(1.78,r*.07),(1.9,.02)]
 lathe('Onion dome',x,base,z,prof,BLUE,64)
 for k in range(16):
  a=k*math.tau/16;tube('Gilded dome meridian',[(x+(rr+.01)*math.cos(a),base+yy,z+(rr+.01)*math.sin(a)) for yy,rr in prof],.016,GOLD)
 for yy,rr in prof[1:-1:2]:ring('Dome decorative latitude',(x,base+yy,z),rr+.014,GOLD,.012)
 lathe('Dome finial',x,base+1.8,z,[(0,.10),(.10,.09),(.18,.03),(.50,.025)],GOLD,24)
 ring('Crescent finial',(x,base+2.42,z),.12,GOLD,.018,True)

def palm(x,z,s=1):
 lathe('Palm trunk',x,0,z,[(0,.15*s),(.6*s,.13*s),(1.3*s,.11*s),(2*s,.08*s)],WOOD,24)
 for k in range(13):
  a=k*2.399
  for j in range(8):
   t=j/7;xx=x+math.cos(a)*t*1.25*s;zz=z+math.sin(a)*t*1.25*s;yy=(2+.55*math.sin(math.pi*t)-.25*t)*s
   for side in [-1,1]:leaf('Palm frond leaflet',(xx,yy,zz),(math.cos(a+.8*side),.04,math.sin(a+.8*side)),.30*s,.042*s,LEAF)

def camel(x,z,s=.8):
 # Porcelain ornamental camel matching the palace reference props.
 sphere('Camel barrel',(x,1.23*s,z),(.82*s,.40*s,.32*s),IVORY)
 sphere('Camel hump',(x-.1*s,1.63*s,z),(.36*s,.48*s,.29*s),IVORY)
 for dx in [-.5,.50]:
  for dz in [-.23,.23]:
   tube('Camel leg',[(x+dx*s,1.13*s,z+dz*s),(x+(dx+.06)*s,.6*s,z+dz*s),(x+dx*s,.12*s,z+dz*s)],.075*s,IVORY)
   sphere('Cloven hoof',(x+dx*s,.09*s,z+dz*s),(.11*s,.08*s,.09*s),GOLD)
 tube('Camel curved neck',[(x+.57*s,1.30*s,z),(x+.87*s,1.67*s,z),(x+.80*s,2.07*s,z),(x+1.0*s,2.22*s,z)],.16*s,IVORY)
 sphere('Camel head',(x+1.08*s,2.22*s,z),(.27*s,.15*s,.15*s),IVORY)
 for side in [-1,1]:
  sphere('Camel ear',(x+.9*s,2.38*s,z+side*.14*s),(.06*s,.14*s,.04*s),IVORY)
  sphere('Camel eye',(x+1.09*s,2.29*s,z+side*.14*s),(.028*s,)*3,DARK)
 box('Blue saddlecloth',(x-.02*s,1.50*s,z),(.85*s,.13*s,.72*s),BLUE,.04)
 for side in [-1,1]:box('Saddle gilt border',(x-.02*s,1.50*s,z+side*.37*s),(.89*s,.045*s,.025*s),GOLD,.005)
 tube('Camel tail',[(x-.78*s,1.30*s,z),(x-.94*s,.75*s,z)],.025*s,IVORY)

def whole_artwork(index):
 before=set(bpy.context.scene.objects);photo=bpy.data.images.load(str(R/f'public/paintings/art-{index+1}.jpg'))
 rect=ART_RECTS[index];h=2.9;w=h*(rect[2]-rect[0])/(rect[3]-rect[1]);cy=1.97;zz=2.9
 art=atlasmat('Complete original including original frame',photo,rect)
 # The picture is an undistorted rectangular surface. Its frame, backing, side
 # walls and stepped mouldings are solid geometry; no contour extraction.
 mesh_object('Intact framed original front',[(-w/2,cy-h/2,zz+.17),(w/2,cy-h/2,zz+.17),(w/2,cy+h/2,zz+.17),(-w/2,cy+h/2,zz+.17)],[(0,1,2,3)],art,[(0,0),(1,0),(1,1),(0,1)],'hero')
 box('Artwork walnut backing',(0,cy,zz),(w+.045,h+.045,.24),WOOD,.015,'hero')
 for d in range(3):
  inset=.018+d*.024
  for side in [-1,1]:
   box('Artwork external moulding',(side*(w/2+inset),cy,zz+.10-d*.025),(.025,h+.04+inset*2,.09),GOLD,.008,'hero')
   box('Artwork external moulding',(0,cy+side*(h/2+inset),zz+.10-d*.025),(w+.04+inset*2,.025,.09),GOLD,.008,'hero')
 for o in set(bpy.context.scene.objects)-before:o['batch']='hero'
 # A proportionate supporting pedestal, not a large floating cutout.
 box('Framed work display support',(0,.30,2.9),(max(.95,w*.78),.60,.72),MARBLE,.045)
 box('Pedestal carved cornice',(0,.62,2.9),(max(1.05,w*.84),.10,.84),MARBLE,.028)
 for side in [-1,1]:box('Pedestal gold inlay',(side*max(.35,w*.31),.31,3.28),(.025,.40,.016),GOLD,.004)
 # Keep the central field of view open. The framed work becomes part of the
 # architectural composition rather than covering most of the room on entry.
 xx,new_z=HERO_LOCATIONS[index]
 for o in set(bpy.context.scene.objects)-before:o.location.x+=xx;o.location.y-=new_z-zz

def vault_ceiling(pointed=False):
 for zz in [-8,-3,2,7]:
  masonry_arch(0,zz,14.6,2.8,5.6,WALL,pointed,.28)
  # Real diagonal ribs across each vault bay.
  for side in [-1,1]:
   pts=[(side*7.2*(1-t),5.6+2.8*math.sin(t*math.pi/2),zz+2.4*t) for t in [i/24 for i in range(25)]]
   tube('Diagonal groin vault rib',pts,.065,GOLD if INDEX in [2,3] else MARBLE)
 for ix in range(32):
  x0=-7.5+15*ix/32;x1=-7.5+15*(ix+1)/32
  y0=5.65+2.85*math.sqrt(max(0,1-(x0/7.5)**2));y1=5.65+2.85*math.sqrt(max(0,1-(x1/7.5)**2))
  for iz in range(8):
   z=-11+iz*2.75;mesh_object('Curved vault web',[(x0,y0,z),(x1,y1,z),(x1,y1,z+2.75),(x0,y0,z+2.75)],[(0,3,2,1)],CEILING,[(0,0),(1,0),(1,1),(0,1)])

def glazed_window(x,z,w=1.7,h=3.4,side=False,rose=False):
 before=set(bpy.context.scene.objects)
 if rose:
  bpy.ops.mesh.primitive_circle_add(vertices=64,radius=w/2,fill_type='NGON',location=v((x,5.5,z)));o=bpy.context.object;o.rotation_euler=(math.pi/2,0,0);finish(o,'Rose window glass',GLASS)
  ring('Rose window stone surround',(x,5.5,z+.04),w/2,MARBLE,.12,True)
  for k in range(12):
   a=k*math.tau/12;tube('Rose window tracery',[(x+.16*math.cos(a),5.5+.16*math.sin(a),z+.1),(x+w*.46*math.cos(a),5.5+w*.46*math.sin(a),z+.1)],.028,MARBLE)
 else:
  spring=2.5+h*.68
  mesh_object('Figurative stained glass panel',[(x-w/2,2.5,z),(x+w/2,2.5,z),(x+w/2,2.5+h,z),(x-w/2,2.5+h,z)],[(0,1,2,3)],GLASS,[(0,0),(1,0),(1,1),(0,1)])
  masonry_arch(x,z+.04,w,h*.32,spring,MARBLE,True,.13)
  for dx in [-w/2,w/2,0]:tube('Stone window mullion',[(x+dx,2.45,z+.10),(x+dx,spring,z+.10)],.035,MARBLE)
  for y in [2.5,3.3,4.1]:box('Window stone transom',(x,y,z+.11),(w,.045,.08),MARBLE,.01)
 if side:
  pivot=bpy.data.objects.new('Side stained glass assembly',None);bpy.context.collection.objects.link(pivot);pivot.location=v((x,0,z));bpy.context.view_layer.update()
  for o in set(bpy.context.scene.objects)-before-{pivot}:o.parent=pivot;o.matrix_parent_inverse=pivot.matrix_world.inverted()
  pivot.rotation_euler[2]=math.pi/2

def build_garden():
 for z in [-7,-2,3,8]:
  for x in [-7.3,7.3]:turned_column(x,z,5.6,.32,True)
  masonry_arch(0,z,14.6,2.0,5.55,PORCELAIN,False,.20)
 for x in [-8.65,8.65]:
  for z in [-7,-2,3,8]:
   # Open colonnade, low balustrade rather than an enclosed stone box.
   box('Garden perimeter sill',(x,.22,z),(.5,.44,4.8),MARBLE,.035)
   for k in range(10):lathe('Turned balustrade',x,.40,z-2.15+k*.47,[(0,.055),(.10,.08),(.35,.06),(.55,.1),(.70,.055)],MARBLE,16)
   box('Garden balustrade rail',(x,1.14,z),(.4,.12,4.85),PORCELAIN,.035)
   vine_along([(x-.15,4.8+math.sin(i*.3)*.35,z-2.3+i*.23) for i in range(21)],True)
 for x in [-5.5,-2.8,2.8,5.5]:
  masonry_arch(x,-10.3,2.7,1.2,3.8,PORCELAIN)
  for side in [-1,1]:turned_column(x+side*1.35,-10.3,3.8,.18,True)
 # Modelled bridge with curved masonry, moulded handrails and turned balusters.
 for i in range(33):
  t=i/32;z=-3.2+6.4*t;h=.10+.57*math.sin(math.pi*t)
  box('Bridge dressed deck',(3.7,h,z),(1.7,.18,.21),PORCELAIN,.014)
  if i%2==0:
   for x in [2.88,4.52]:lathe('Bridge turned baluster',x,h+.1,z,[(0,.045),(.1,.06),(.32,.045),(.5,.07),(.65,.04)],MARBLE,16)
 for x in [2.86,4.54]:
  tube('Bridge stone handrail',[(x,.91+.57*math.sin(math.pi*i/32),-3.2+6.4*i/32) for i in range(33)],.075,PORCELAIN)
  for z in [-3.2,3.2]:turned_column(x,z,1.2,.14,True);sphere('Bridge finial',(x,1.25,z),(.13,)*3,MARBLE)
 for x,z in [(1.4,-3.3),(5.8,-3.4),(1.5,3.4),(5.9,3.3)]:
  for i in range(5):
   xx=x+random.uniform(-.4,.4);zz=z+random.uniform(-.35,.35)
   sphere('Garden bank rock',(xx,.15,zz),(.32,.22,.25),STONE);lily(xx,random.uniform(.5,1.1),zz,.8)
 for x,z in [(-5.6,-6),(-5.8,1.4),(-4.6,6.3),(6.1,6.8),(6.2,-6.3),(-1.9,-7)]:vase_detail(x,z,0,1.1)
 for x,z in [(-5.8,4.2),(-5.8,-3.5),(6.1,4.5),(6.1,-5.5)]:
  lantern_detail(x,z,2.3);vine_along([(x+.1*math.sin(i),.3+i*.15,z) for i in range(25)],True)
 # Sculpted porcelain frog and lily pads are actual geometry.
 x,z=5.7,2.8;sphere('Porcelain frog body',(x,.50,z),(.30,.18,.38),PORCELAIN);sphere('Frog head',(x,.62,z+.24),(.25,.17,.22),IVORY)
 for side in [-1,1]:
  sphere('Frog folded thigh',(x+side*.27,.40,z-.10),(.20,.12,.24),PORCELAIN);sphere('Frog glass eye',(x+side*.14,.76,z+.27),(.055,)*3,DARK)
  for k in range(3):tube('Frog toes',[(x+side*.23,.32,z+.1),(x+side*(.25+k*.04),.29,z+.37)],.015,IVORY)
 for i in range(8):
  xx=2.3+(i%3)*1.2;zz=-2.7+i*.7
  leaf('Floating lily pad',(xx,.066,zz),(1,0,.1),.46,.31,LEAF)
  if i%3==0:lily(xx,.18,zz,.40)
 for x,z in [(-5.8,7),(5.8,-3)]:
  vase_detail(x,z,.1,1.35,False)
 # Layered vegetation behind the arcade, not an empty sky beyond the railings.
 for x,z in [(-11,-7),(-12,1),(-11,8),(11,-7),(12,2),(11,9),(-5,-13),(5,-13)]:
  tube('Twisting garden tree trunk',[(x,0,z),(x+.2,1.2,z+.1),(x-.1,2.6,z),(x+.15,4.2,z+.2)],.12,WOOD)
  for k in range(65):
   a=k*2.399;r=.2+1.4*(k%13)/12;xx=x+r*math.cos(a);zz=z+r*math.sin(a);yy=3.5+(k%5)*.3
   leaf('Garden tree leaf cluster',(xx,yy,zz),(math.cos(a),.3,math.sin(a)),.5,.18,LEAF)
  for k in range(5):rose(x+.8*math.cos(k),4.5,z+.8*math.sin(k),.24)

def build_cathedral():
 for z in [-7,-2,3,8]:
  for x in [-7.3,7.3]:turned_column(x,z,5.65,.38)
 vault_ceiling(True)
 for x in [-8.7,8.7]:
  for z in [-7,-2,3,8]:wall_bay(x,z,4.95,7.7,True);glazed_window(x+(.20 if x<0 else -.2),z,1.9,3.5,True)
 for x in [-5.5,-2.8,2.8,5.5]:wall_bay(x,-10.2,2.7,8.0);glazed_window(x,-9.98,1.6,3.7)
 glazed_window(0,-10.1,3.2,rose=True)
 for x in [-3.8,3.8]:
  for z in [-3,0]:pew(x,z)
 for x in [-5.7,5.7]:
  carved_panel(x,-5.8,.95)
  console(x,1.4,2.0,1.0);book(x,1.4,1.08);candelabrum(x-.55,1.4,1.08,.8,3)
  for z in [-6.4,-.4,5.5]:lantern_detail(x,z,3.4)
 for x in [-2.4,2.4]:candelabrum(x,2.6,0,1.75,7)
 for x in [-5.8,5.8]:
  box('Side altar',(x,.56,-7.4),(2.0,1.1,.9),MARBLE,.04)
  box('Side altar moulding',(x,1.15,-7.4),(2.2,.15,1.05),MARBLE,.035)
  for xx in [-.60,0,.60]:candelabrum(x+xx,-7.4,1.22,.65,1)
  vine_along([(x,1+i*.16,-9.6+.09*math.cos(i)) for i in range(25)])

def build_salon():
 for z in [-7,-2,3,8]:
  for x in [-7.3,7.3]:turned_column(x,z,5.7,.34)
 vault_ceiling(False)
 for x in [-8.7,8.7]:
  for z in [-7,-2,3,8]:wall_bay(x,z,4.95,7.2,True)
 for x in [-5.6,-2.8,2.8,5.6]:wall_bay(x,-10.2,2.8,7.4)
 for x in [-5.7,5.7]:
  for z in [-6.5,.6,6.3]:curtain(-8.35 if x<0 else 8.35,z,2.4,4.6,1.4,side_wall=True)
  console(x,0,2.6,1.05);vase_detail(x,0,1.13,.65);candelabrum(x-.8,0,1.13,.65,3)
  chair(x-.5,5, .15 if x<0 else -.15);chair(x+.7,5.4,-.15 if x<0 else .15)
  armillary(x,-6.4,1.12,.65)
  console(x,-6.6,2.4,1.05)
  for n,z in enumerate([-8.7,-3.6,3.0,8.0]):
   before=set(bpy.context.scene.objects);wall_picture(0,0,n%2)
   pivot=bpy.data.objects.new('Salon portrait wall placement',None);bpy.context.collection.objects.link(pivot)
   for o in set(bpy.context.scene.objects)-before-{pivot}:o.parent=pivot
   pivot.rotation_euler[2]=math.pi/2 if x<0 else -math.pi/2;pivot.location=v((-8.35 if x<0 else 8.35,0,z))
 for z in [-4.3,4.7]:chandelier(z)
 # Real tessellated carpet, border and gold tassels.
 carpet=tiled_panel('Finely woven carpet',0,0,0,3.6,10.2,RUG,8,24)
 carpet.rotation_euler[0]=math.pi/2;carpet.location=v((0,.022,-.8))
 for x in [-1.75,1.75]:box('Carpet woven border',(x,.033,-.8),(.07,.008,10.1),GOLD,.001)
 for z in [-5.85,4.25]:
  for i in range(50):tube('Carpet fringe',[(-1.75+i*.071,.028,z),(-1.75+i*.071,.028,z+(.12 if z>0 else -.12))],.005,GOLD)
 for x in [-2.5,2.5]:
  vase_detail(x,-7.2,0,1.0);candelabrum(x,2.7,0,1.7,5)

def build_sanctuary():
 for z in [-7,-2,3,8]:
  for x in [-7.3,7.3]:turned_column(x,z,5.7,.36)
 vault_ceiling(True)
 for x in [-8.7,8.7]:
  for z in [-7,-2,3,8]:wall_bay(x,z,4.95,7.8,True);glazed_window(x+(.2 if x<0 else -.2),z,2.15,3.9,True)
 for x in [-5.6,-2.8,2.8,5.6]:wall_bay(x,-10.2,2.8,8);glazed_window(x,-9.98,1.6,4)
 ring('Sanctuary solar aureole',(0,5.7,-9.85),2.0,GOLD,.065,True)
 for k in range(72):
  a=k*math.tau/72;r=2.35 if k%3 else 2.7
  tube('Sunburst gold ray',[(1.98*math.cos(a),5.7+1.98*math.sin(a),-9.84),(r*math.cos(a),5.7+r*math.sin(a),-9.84)],.017,GOLD)
 for x in [-4.3,4.3]:
  carved_panel(x,-1.9,1.15);armillary(x,-6.7,0,.95)
  vase_detail(x,5.2,0,1.2)
 for x in [-2.4,2.4]:candelabrum(x,2.7,0,1.8,7)
 for x in [-5.8,5.8]:
  console(x,-7.5,2.6,1.0);book(x,-7.5,1.07)
  for xx in [-.9,.9]:candelabrum(x+xx,-7.5,1.07,.7,3)
 # Inlaid stone roundel around the observation mark; solid brass and marble.
 for radius in [.82,1.08,1.14]:ring('Sanctuary floor inlay',(0,.015,-4.8),radius,GOLD,.013)

def build_palace():
 for z in [-7,-2,3,8]:
  for x in [-7.3,7.3]:turned_column(x,z,5.7,.34,True)
  masonry_arch(0,z,14.6,2.6,5.65,PORCELAIN,True,.20)
 for x in [-8.7,8.7]:
  for z in [-7,-2,3,8]:wall_bay(x,z,4.95,6.4,True)
 for x in [-5.6,-2.8,2.8,5.6]:wall_bay(x,-10.2,2.8,7.0)
 for x in [-5.7,5.7]:
  lathe('Dome drum',x,5.8,-9.5,[(0,1.4),(.1,1.5),(.3,1.4),(.6,1.4),(.7,1.48)],MARBLE,48);dome(x,-9.5,6.5,1.4)
  turned_column(x+(-1.7 if x<0 else 1.7),-9.4,8.1,.20,True)
  for z in [-5.8,1.2,6.5]:lantern_detail(x,z,3.7);palm(x+.5,z-1.0,.88)
  curtain(x,-7.8,2.3,3.9,1.2,True)
  vase_detail(x,-6.5,0,1.25,False);armillary(x+.75,-6.5,0,.65)
 # Octagonal, profiled fountain with hollow basin and sculpted bowls.
 lathe('Fountain basin',0,0,-1.7,[(0,1.85),(.13,1.95),(.26,1.9),(.55,1.8),(.62,1.87),(.69,1.87),(.69,1.67),(.3,1.61)],PORCELAIN,64)
 for yy,r in [(.25,1.91),(.62,1.87)]:ring('Fountain gilded edge',(0,yy,-1.7),r,GOLD,.025)
 for y,r in [(1.10,1.02),(1.95,.64),(2.55,.28)]:
  lathe('Turned fountain support',0,y-.58,-1.7,[(0,.15),(.10,.2),(.22,.13),(.50,.10)],MARBLE,32)
  lathe('Scalloped fountain bowl',0,y,-1.7,[(0,.13),(.08,r*.6),(.18,r),(.26,r),(.26,r*.88),(.12,.22)],MARBLE,64)
  ring('Fountain lip',(0,y+.24,-1.7),r,GOLD,.016)
 for k in range(8):
  a=k*math.tau/8;lantern_detail(math.cos(a)*2.17,-1.7+math.sin(a)*2.17,.46)
 for x,z in [(-5.7,3.6),(5.7,3.6),(-5.7,-3.8),(5.7,-4.8)]:
  vase_detail(x,z,0,.75,False)
 lathe('Final key offering pedestal',-5.8,0,-4.8,[(0,.40),(.1,.43),(.18,.34),(.86,.26),(1.04,.38),(1.13,.4)],MARBLE,48)
 for x in [-5.4,5.4]:
  console(x,5.8,2.2,.85);armillary(x,5.8,.92,.6)
 for x in [-2.3,2.3]:lantern_detail(x,-7.8,2.5)
 door_leaf(-1);door_leaf(1)
 masonry_arch(0,-8.36,3.4,1.5,3.65,PORCELAIN,True,.22)
 for x in [-1.75,1.75]:turned_column(x,-8.5,3.7,.16,True)

def export_world(index):
 scene=bpy.context.scene
 bpy.ops.object.camera_add(location=v((0,1.9,8)));cam=bpy.context.object;cam.rotation_euler=(Vector(v((0,2,-2)))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
 bpy.ops.object.light_add(type='AREA',location=v((-3,7,5)));bpy.context.object.data.energy=1800;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=7
 for img in bpy.data.images:
  if img.filepath and img.source=='FILE':img.pack()
 bpy.ops.wm.save_as_mainfile(filepath=str(BLEND/f'world-{index+1}.blend'),compress=True)
 originals=list(scene.objects);dg=bpy.context.evaluated_depsgraph_get();batches={};exports=[]
 for o in originals:
  if o.type not in ['MESH','CURVE'] or o.get('batch') in ['hero','door']:continue
  mesh=bpy.data.meshes.new_from_object(o.evaluated_get(dg),depsgraph=dg);copy=bpy.data.objects.new('Export',mesh);scene.collection.objects.link(copy);copy.matrix_world=o.matrix_world.copy();batches.setdefault(o.data.materials[0].name,[]).append(copy)
 for name,objects in batches.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name='Detailed '+name;exports.append(objects[0])
 bpy.ops.object.select_all(action='DESELECT')
 for o in exports+[o for o in originals if o.get('batch')=='door' or o.name.startswith('FinalDoor')]:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'room-{index+1}.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_image_format='JPEG',export_jpeg_quality=95,**DRACO)
 bpy.ops.object.select_all(action='DESELECT')
 for o in originals:
  if o.get('batch')=='hero':o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/f'artwork-{index+1}.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_image_format='JPEG',export_jpeg_quality=96,**DRACO)
 COUNTS.append({'room':index+1,'editableObjects':len(originals),'renderBatches':len(exports),'vertices':sum(len(o.data.vertices) for o in exports),'framedOriginal':True})
 print('DETAILED_WORLD_READY',index+1,flush=True)

for INDEX in range(5):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 CURVE_MATERIALS={}
 DETAIL=bpy.data.images.load(str(R/'environment-assets/painting-worlds/refinement/material-atlas-v2.png'))
 SOURCE=bpy.data.images.load(str(R/f'environment-assets/painting-worlds/source/atlas-{INDEX+1}.png'))
 GOLD=solid('Hand chased antique gilt',(.68,.42,.13),.72,.27);IVORY=solid('Warm porcelain ivory',(.88,.86,.77),.03,.30)
 STONE=solid('Garden rock',(.42,.45,.38),0,.84);DARK=solid('Dark recess',(.045,.035,.03),0,.8);LEAF=solid('Garden leaves',(.075,.19,.06),0,.72)
 GLOW=solid('Warm lamp glass',(1,.66,.27),0,.4,2.8);ROSE=solid('Flower petals',(.08,.23,.58) if INDEX==0 else (.55,.08,.10),0,.58);CRYSTAL=solid('Cut crystal',(.7,.8,.86),.22,.12)
 MARBLE=material_cell('Ivory marble',1,0,.28);PORCELAIN=material_cell('Cobalt floral porcelain',0,.05,.24);BLUE=material_cell('Blue gilded lattice',7,.08,.28)
 WOOD=material_cell('Polished dark walnut',5,0,.42);VELVET=material_cell('Red brocade',4,0,.93);RUG=material_cell('Persian carpet',10,0,1)
 WALL=material_cell('Limestone ashlar',2,0,.86) if INDEX==1 else (material_cell('Ivory brocade stone',9,0,.65) if INDEX in [2,3] else MARBLE)
 CEILING=material_cell('Vaulted stone',2 if INDEX==1 else 9,0,.8)
 TILE=PORCELAIN
 GLASS=patchmat('Original figurative stained glass',(.64,.217,.685,.422)) if INDEX==1 else patchmat('Original sanctuary glass',(.633,.023,.737,.305)) if INDEX==3 else material_cell('Blue patterned glass',13,0,.35)
 if INDEX in [1,3]:
  node=GLASS.node_tree.nodes.get('Principled BSDF');texture=next(n for n in GLASS.node_tree.nodes if n.type=='TEX_IMAGE');GLASS.node_tree.links.new(texture.outputs['Color'],node.inputs['Emission Color']);node.inputs['Emission Strength'].default_value=.65
 floor=material_cell('Fine floor tile',15 if INDEX in [1,2,3] else 11 if INDEX==0 else 8,0,.24 if INDEX!=1 else .65)
 floor_grid(floor)
 if INDEX!=0:
  for ix in range(-9,9):
   for iy in range(8):box('Continuous rear masonry',(ix+.5,iy+.5,-10.5),(.995,.995,.18),WALL,.004)
 whole_artwork(INDEX)
 [build_garden,build_cathedral,build_salon,build_sanctuary,build_palace][INDEX]()
 if INDEX<4:
  for x in [-2.05,2.05]:turned_column(x,-8.7,4.1,.15,INDEX==0)
  masonry_arch(0,-8.9,4.15,1.25,4.05,MARBLE,INDEX in [1,3],.14)
 ring('Fixed observation medallion',(0,.012,-4.8),.67,GOLD,.025)
 for k in range(16):
  a=k*math.tau/16;tube('Observation compass ray',[(.48*math.cos(a),.014,-4.8+.48*math.sin(a)),(.61*math.cos(a),.014,-4.8+.61*math.sin(a))],.014,GOLD)
 export_world(INDEX)
(R/'environment-assets/painting-worlds/refinement/model-manifest.json').write_text(json.dumps(COUNTS,indent=2),encoding='utf-8')
bpy.ops.wm.read_factory_settings(use_empty=True)
DETAIL=bpy.data.images.load(str(R/'environment-assets/painting-worlds/refinement/material-atlas-v2.png'))
GOLD=solid('Carved antique gilt',(.68,.42,.13),.72,.27);WOOD=material_cell('Walnut backing',5,0,.55)
for d in range(5):
 offset=.512+d*.025;depth=.025+d*.012
 for side in [-1,1]:
  box('Stepped portal moulding',(side*offset,0,depth),(.025,1.19+d*.045,.10),GOLD,.009)
  box('Stepped portal moulding',(0,side*offset,depth),(1.19+d*.045,.025,.10),GOLD,.009)
for side in [-1,1]:
 for k in range(20):
  t=-.56+k*1.12/19
  sphere('Portal beaded inner rail',(side*.537,t,.1),(.012,.012,.015),GOLD)
  sphere('Portal beaded inner rail',(t,side*.537,.1),(.012,.012,.015),GOLD)
 for corner in [-1,1]:
  for k in range(7):
   a=k*math.pi/3.5
   leaf('Portal carved corner acanthus',(side*.60,corner*.60,.06),(math.cos(a)*side,math.sin(a)*corner,.2),.10,.023,GOLD)
for img in bpy.data.images:
 if img.filepath and img.source=='FILE':img.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND/'portal-frame.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'portal-frame.glb'),export_format='GLB',export_apply=True,**DRACO)
print('FIVE_DETAILED_WORLDS_COMPLETE',flush=True)

