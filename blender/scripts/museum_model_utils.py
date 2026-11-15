"""Editable modelling utilities. Input coordinates are game x,y-up,z."""
import bpy, math, pathlib
from mathutils import Vector
def v(p):return (p[0],-p[2],p[1])
def clear():
 bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name,color,metal=0,rough=.5,alpha=1):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,alpha);b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,alpha);b.inputs['Metallic'].default_value=metal;b.inputs['Roughness'].default_value=rough;b.inputs['Alpha'].default_value=alpha
 if alpha<1:m.surface_render_method='DITHERED';b.inputs['Transmission Weight'].default_value=.12
 return m
def finish(o,name,m):
 o.name=name
 if m:o.data.materials.append(m)
 return o
def box(name,p,s,m,bevel=.01):
 bpy.ops.mesh.primitive_cube_add(size=1,location=v(p));o=bpy.context.object;o.dimensions=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:q=o.modifiers.new('Soft manufactured edges','BEVEL');q.width=bevel;q.segments=3
 return finish(o,name,m)
def cyl(name,p,r,h,m,n=64):
 bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=h,location=v(p));o=bpy.context.object
 for f in o.data.polygons:f.use_smooth=abs(f.normal.z)<.8
 return finish(o,name,m)
def ball(name,p,s,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=v(p));o=bpy.context.object;o.scale=(s[0],s[2],s[1])
 for f in o.data.polygons:f.use_smooth=True
 return finish(o,name,m)
def tube(name,points,r,m,cyclic=False):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=3;c.resolution_u=12;sp=c.splines.new('POLY');sp.points.add(len(points)-1)
 for a,p in zip(sp.points,points):a.co=(*v(p),1)
 sp.use_cyclic_u=cyclic;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
def ring(name,p,r,m,thick=.008):return tube(name,[(p[0]+r*math.cos(i*math.tau/96),p[1],p[2]+r*math.sin(i*math.tau/96))for i in range(96)],thick,m,True)
def smooth(profile,steps=6):
 out=[]
 for i in range(len(profile)-1):
  a=Vector(profile[max(0,i-1)]);b=Vector(profile[i]);c=Vector(profile[i+1]);d=Vector(profile[min(len(profile)-1,i+2)])
  for j in range(steps):
   t=j/steps;q=.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);out.append((q.x,max(.004,q.y)))
 return out+[profile[-1]]
def lathe(name,profile,m,center=(0,0,0),n=96,shell=True,lobes=0):
 p=smooth(profile);thick=.018
 if shell:p=p+[(y,max(.005,r-thick))for y,r in reversed(p)]+[(p[0][0],p[0][1])]
 verts=[];uv=[]
 for y,r in p:
  for i in range(n+1):
   a=i*math.tau/n;rr=r*(1+lobes*.018*math.cos(a*8));verts.append(v((center[0]+rr*math.cos(a),center[1]+y,center[2]+rr*math.sin(a))));uv.append((i/n,y))
 faces=[]
 for j in range(len(p)-1):
  for i in range(n):k=j*(n+1)+i;faces.append((k,k+1,k+n+2,k+n+1))
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.data.materials.append(m);layer=me.uv_layers.new()
 for poly in me.polygons:
  poly.use_smooth=True
  for li in poly.loop_indices:layer.data[li].uv=uv[me.loops[li].vertex_index]
 return o
def handle(x,y,z,r,m,side=1,scale=1):
 return tube('Applied loop handle',[(x+side*r*(1-math.cos(a)),y+r*.8*math.sin(a),z)for a in [i*math.tau/64 for i in range(65)]],.022*scale,m)
def export(path):
 for o in list(bpy.context.scene.objects):
  if o.type=='CURVE':
   bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
 for o in bpy.context.scene.objects:
  if o.type=='MESH':
   bpy.context.view_layer.objects.active=o
   for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.ops.object.select_all(action='DESELECT')
 for o in bpy.context.scene.objects:
  if o.type=='MESH':o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_extras=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=14,export_draco_normal_quantization=10)
def save(path):bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)
def studio(output,size=512,scale=2.1,center=(0,.65,0)):
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True;scene.render.resolution_x=size;scene.render.resolution_y=size;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
 scene.world=bpy.data.worlds.new('Neutral studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.15,.14,.12,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
 bpy.ops.object.camera_add(location=v((2.4,1.65,3.6)));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=scale;cam.rotation_euler=(Vector(v(center))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
 for p,e,s in [((-3,4,4),400,4),((3,2,1),250,3),((0,3,-3),300,3)]:
  bpy.ops.object.light_add(type='AREA',location=v(p));o=bpy.context.object;o.data.energy=e;o.data.shape='DISK';o.data.size=s;o.rotation_euler=(Vector(v(center))-o.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(output);bpy.ops.render.render(write_still=True)
