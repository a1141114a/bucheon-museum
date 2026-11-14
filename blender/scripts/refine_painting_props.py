"""Detailed reading lectern; keep a reproducible editable prop beside the rooms."""
import bpy,pathlib,math
R=pathlib.Path(__file__).resolve().parents[2]
exec(compile((R/'blender/scripts/refine_painting_worlds.py').read_text(encoding='utf-8').split('for INDEX in range(5):')[0],'refined_helpers','exec'))
bpy.ops.wm.read_factory_settings(use_empty=True)
GOLD=solid('Lectern antique gilt',(.64,.39,.12),.72,.29);WOOD=solid('Lectern polished walnut',(.075,.028,.013),0,.36)
lathe('Turned reading pedestal',0,0,0,[(0,.29),(.045,.33),(.10,.32),(.14,.23),(.20,.20),(.26,.13),(.32,.16),(.40,.11),(.83,.095),(.91,.16),(1.00,.29)],WOOD,48)
for y,r in [(.09,.32),(.26,.13),(.34,.15),(.87,.12),(.98,.27)]:ring('Lectern gilt bead',(0,y,0),r,GOLD,.012)
for k in range(3):
 a=k*math.tau/3
 tube('Scroll foot',[(0,.20,0),(.24*math.cos(a),.18,.24*math.sin(a)),(.40*math.cos(a),.035,.40*math.sin(a))],.035,GOLD)
 leaf('Foot carved acanthus',(.20*math.cos(a),.16,.20*math.sin(a)),(math.cos(a),.3,math.sin(a)),.20,.045,GOLD)
o=box('Angled bookrest',(0,1.03,0),(.84,.075,.55),WOOD,.022);o.rotation_euler[0]=math.radians(12)
for side in [-1,1]:
 o=box('Gilded bookrest side',(side*.405,1.05,0),(.025,.04,.55),GOLD,.009);o.rotation_euler[0]=math.radians(12)
box('Raised book lip',(0,1.11,.25),(.84,.06,.045),GOLD,.009)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND/'lectern.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'lectern.glb'),export_format='GLB',export_apply=True,**DRACO)
print('DETAILED_LECTERN_COMPLETE',flush=True)

