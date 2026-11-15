"""Open every delivered editable source in Blender; no modifications are saved."""
import bpy,pathlib,json
R=pathlib.Path(__file__).resolve().parents[2]
rows=[]
for path in sorted((R/'blender/blend/collection-batch-20261115').glob('*.blend')):
 bpy.ops.wm.open_mainfile(filepath=str(path));meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];assert meshes,path
 assert bpy.context.scene.get('official_catalogue','').endswith(path.stem[4:]+'/view')
 rows.append({'id':path.stem,'meshes':len(meshes),'vertices':sum(len(o.data.vertices)for o in meshes),'openable':True})
assert len(rows)==30
bpy.ops.wm.open_mainfile(filepath=str(R/'blender/blend/modern-museum/european-porcelain-passage.blend'))
assert len([o for o in bpy.context.scene.objects if o.type in ['MESH','CURVE']])>100
ids={o.get('artifactId') for o in bpy.context.scene.objects if o.get('artifactId')}
assert ids=={'bcm-991','bcm-986','bcm-990','bcm-988'}
(R/'museum-assets/batches/model-validation-2026-11-15.json').write_text(json.dumps({'collection':rows,'museumSourceOpenable':True,'museumArtworkIds':sorted(ids)},indent=2),encoding='utf8')
print('ALL_31_BLEND_FILES_OPENED',flush=True)
