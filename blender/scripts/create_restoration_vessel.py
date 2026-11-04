"""Original game prop, not a real collection replica. Blender 5.2 tested.
Creates nine matching solid shards, editable source and textured GLB.
"""
import math
import random
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
TAU = math.tau
profile = [(0, .40), (.08, .44), (.28, .61), (.55, .70), (.82, .68),
           (1.08, .57), (1.28, .39), (1.40, .35), (1.48, .355),
           (1.51, .405), (1.55, .425), (1.59, .405), (1.60, .365)]

def radius(z):
    for i in range(len(profile)-1):
        a, b = profile[i], profile[i+1]
        if z <= b[0]:
            p = profile[max(0, i-1)]
            n = profile[min(len(profile)-1, i+2)]
            m0 = (b[1]-p[1])/(b[0]-p[0])
            m1 = (n[1]-a[1])/(n[0]-a[0])
            d = b[0]-a[0]
            t = max(0, min(1, (z-a[0])/d))
            return ((2*t**3-3*t*t+1)*a[1] + (t**3-2*t*t+t)*d*m0
                    + (-2*t**3+3*t*t)*b[1] + (t**3-t*t)*d*m1)
    return profile[-1][1]

# Original deterministic glaze texture. No museum photography is used.
random.seed(17)
size = 512
image = bpy.data.images.new('Original_Amber_Glaze', width=size, height=size)
pixels = []
for y in range(size):
    t = y/(size-1)
    for x in range(size):
        u = x/size
        noise = random.uniform(-.018, .018)
        mottling = .025*math.sin(u*43+t*11)*math.sin(u*18-t*27)
        throwing = .008*math.sin(t*480+math.sin(u*TAU)*.5)
        speck = -.09 if random.random() < .008 else 0
        glaze = noise+mottling+throwing+speck
        pixels.extend((max(0,.285+glaze),max(0,.135+glaze*.6),max(0,.06+glaze*.3),1))
image.pixels = pixels
image.pack()
glaze = bpy.data.materials.new('Amber glaze · original study')
glaze.use_nodes = True
nodes = glaze.node_tree.nodes
bsdf = next((n for n in nodes if n.type == 'BSDF_PRINCIPLED'), None) or nodes.new('ShaderNodeBsdfPrincipled')
out = next((n for n in nodes if n.type == 'OUTPUT_MATERIAL'), None) or nodes.new('ShaderNodeOutputMaterial')
texture = nodes.new('ShaderNodeTexImage'); texture.image = image
glaze.node_tree.links.new(texture.outputs['Color'], bsdf.inputs['Base Color'])
glaze.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
bsdf.inputs['Roughness'].default_value = .31
bsdf.inputs['Metallic'].default_value = .025
bsdf.inputs['Coat Weight'].default_value = .22
bsdf.inputs['Coat Roughness'].default_value = .25
clay = bpy.data.materials.new('Exposed clay fracture')
clay.diffuse_color = (.43,.27,.14,1)
clay.use_nodes = True
cb = next(n for n in clay.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
cb.inputs['Base Color'].default_value = (.43,.27,.14,1)
cb.inputs['Roughness'].default_value = .88

N, M = 64, 28
# Unequal angular spans and height-varying fracture contours. Every adjacent
# fragment evaluates the same boundary function, so the rebuilt vessel has no gaps.
sector_cuts = [0, .20, .63, 1]
def triangle_wave(value):
    return math.asin(math.sin(value))*2/math.pi

def surface_coordinates(band, sector, u, v):
    alpha = (sector_cuts[sector] + u*(sector_cuts[sector+1]-sector_cuts[sector]))*TAU
    lower = .26+.105*math.sin(alpha*2+.3)+.025*triangle_wave(alpha*7+.6)
    upper = .68+.11*math.sin(alpha*3+1.2)+.04*triangle_wave(alpha*5-.8)
    cuts = [0, lower, upper, 1]
    t = cuts[band]+v*(cuts[band+1]-cuts[band])
    angle = alpha+math.sin(math.pi*t)*(.16*math.sin(alpha*2+t*7)+.055*math.sin(alpha*5-t*4))
    return alpha, t, angle

for band in range(3):
    for sector in range(3):
        verts, uvs = [], []
        for inner in (False, True):
            for j in range(M+1):
                for i in range(N+1):
                    alpha, t, angle = surface_coordinates(band, sector, i/N, j/M)
                    z = t*1.60
                    r = radius(z)+.0018*math.sin(z*150)
                    if inner:
                        r = max(0,r-.047)*min(1,t/.045)
                        z = max(.065,z)
                    verts.append((r*math.cos(angle),r*math.sin(angle),z))
                    uvs.append((alpha/TAU,t))
        stride = N+1
        layer = (N+1)*(M+1)
        faces, caps = [], []
        for inner in (0,1):
            for j in range(M):
                for i in range(N):
                    a=inner*layer+j*stride+i
                    face=(a,a+1,a+stride+1,a+stride)
                    faces.append(face if not inner else tuple(reversed(face)))
                    caps.append(False)
        for j in (0,M):
            for i in range(N):
                a=j*stride+i
                faces.append((a,a+1,a+1+layer,a+layer)); caps.append(True)
        for i in (0,N):
            for j in range(M):
                a=j*stride+i
                faces.append((a,a+stride,a+stride+layer,a+layer)); caps.append(True)
        mesh=bpy.data.meshes.new(f'ShardMesh_{band}_{sector}')
        mesh.from_pydata(verts,[],faces);mesh.update()
        obj=bpy.data.objects.new(f'shard_{band}_{sector}',mesh)
        bpy.context.collection.objects.link(obj)
        mesh.materials.append(glaze);mesh.materials.append(clay)
        uv=mesh.uv_layers.new(name='GlazeUV')
        for poly,cap in zip(mesh.polygons,caps):
            poly.material_index=1 if cap else 0
            poly.use_smooth=not cap
            for loop in poly.loop_indices: uv.data[loop].uv=uvs[mesh.loops[loop].vertex_index]
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True);bpy.context.view_layer.objects.active=obj
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.remove_doubles(threshold=.00001)
        bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode='OBJECT')
        obj['artifact_status']='original-test-prop-not-a-real-collection'
        obj['fragment_id']=f'shard_{band}_{sector}'
        obj['band']=band;obj['sector']=sector
        obj['fracture_layout']='irregular-v2: unequal widths and interlocking height contours'

bpy.context.scene.unit_settings.system='METRIC'
bpy.context.scene.unit_settings.scale_length=1
bpy.context.preferences.filepaths.save_version=0
blend=ROOT/'blender/blend/restoration_vessel.blend'
glb=ROOT/'public/models/restoration_vessel.glb'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',export_extras=True,export_yup=True)
print('GENERATED',blend,glb)
