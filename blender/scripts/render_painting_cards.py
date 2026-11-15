"""Render the existing game frame and genuine 3D previews; original photographs stay unchanged."""
import bpy,math,pathlib
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[2]
def setup(center,scale,frame=False):
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24;scene.cycles.use_denoising=True
 scene.render.resolution_x=1024 if frame else 768;scene.render.resolution_y=1024 if frame else 768;scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=frame
 scene.view_settings.view_transform='AgX'
 world=bpy.data.worlds.new('Card studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.09,.075,.055,1);world.node_tree.nodes['Background'].inputs[1].default_value=.6;scene.world=world
 bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=scale
 camera.location=center+Vector((0,0,5) if frame else (1.25,.48,5));camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
 for xyz,energy,size in [((-3,4,5),450,4),((3,1,4),250,3),((0,-3,3),100,3)]:
  bpy.ops.object.light_add(type='AREA',location=center+Vector(xyz));light=bpy.context.object;light.data.energy=energy;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
 return scene
def bounds(objects):
 bpy.context.view_layer.update();pts=[o.matrix_world@Vector(v) for o in objects for v in o.bound_box];lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)));return (lo+hi)/2,hi-lo
# glTF imports in Blender coordinate axes: photograph faces negative Y, Z is up.
def orient_camera(scene,center,frame=False):
 cam=scene.camera;cam.location=center+Vector((0,-5,0) if frame else (1.3,-5,.45));cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
 for o in scene.objects:
  if o.type=='LIGHT':
   d=o.location-center;o.location=center+Vector((d.x,-d.z,d.y));o.rotation_euler=(center-o.location).to_track_quat('-Z','Y').to_euler()
for i,id in enumerate([991,990,989,988,986]):
 bpy.ops.wm.open_mainfile(filepath=str(ROOT/f'blender/blend/painting-worlds-v2/world-{i+1}.blend'))
 hero=[o for o in bpy.context.scene.objects if o.get('batch')=='hero']
 if not hero:raise RuntimeError('Missing framed original')
 for o in bpy.context.scene.objects:o.hide_render=o not in hero
 center,dimensions=bounds(hero);scene=setup(center,max(dimensions.x,dimensions.z)*1.34);orient_camera(scene,center)
 scene.render.filepath=str(ROOT/f'public/models/bcm-{id}-preview.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'blender/blend/painting-worlds-v2/portal-frame.blend'))
objects=[o for o in bpy.context.scene.objects if o.type in ['MESH','CURVE']]
center,dimensions=bounds(objects);scene=setup(center,max(dimensions.x,dimensions.z)*1.025,True);orient_camera(scene,center,True)
(ROOT/'public/ui').mkdir(exist_ok=True);scene.render.filepath=str(ROOT/'public/ui/painting-card-frame.png');bpy.ops.render.render(write_still=True)
print('PAINTING_CARD_RENDERS_READY',flush=True)

