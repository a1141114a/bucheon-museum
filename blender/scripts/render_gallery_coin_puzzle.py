"""Render the editable gallery coin head-on for the sliding puzzle."""
from pathlib import Path
import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(root / 'blender/blend/gallery-treasure.blend'))
scene = bpy.context.scene
for collection in scene.collection.children:
    collection.hide_render = not collection.name.startswith('03')
world = bpy.data.worlds.new('Coin studio')
world.use_nodes = True
nodes=world.node_tree.nodes
background=nodes.get('Background') or nodes.new('ShaderNodeBackground')
output=nodes.get('World Output') or nodes.new('ShaderNodeOutputWorld')
world.node_tree.links.new(background.outputs['Background'],output.inputs['Surface'])
background.inputs[0].default_value = (.42, .35, .25, 1)
background.inputs[1].default_value = .85
scene.world = world

for name,position,power,size in [
    ('Warm key',(-.16,-.25,.24),12,.19),
    ('Soft fill',(.15,-.18,.04),5,.23),
    ('Edge light',(.08,.10,.19),8,.10),
]:
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power
    data.size=size
    obj=bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.location=position
    obj.rotation_euler=(-Vector(position)).to_track_quat('-Z','Y').to_euler()

data=bpy.data.cameras.new('Coin face orthographic')
camera=bpy.data.objects.new('Coin face orthographic',data)
scene.collection.objects.link(camera)
camera.location=(0,-.6,0)
camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
data.type='ORTHO'
data.ortho_scale=.232
scene.camera=camera
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.film_transparent=True
scene.render.resolution_x=scene.render.resolution_y=420
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
scene.render.filepath=str(root / 'public/models/gallery-coin-puzzle.png')
bpy.ops.render.render(write_still=True)
