"""Build nine interlocking game shards from the bcm-1072 reconstruction."""

import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'museum-assets'))
from generate_model import STORAGE_JAR_PROFILE, material, mesh, set_uv, storage_jar, storage_jar_throwing

TAU = math.tau
SECTOR_CUTS = (0, .20, .63, 1)
GAME_SCALE = 1.60 / .424
WIDTH_STEPS, HEIGHT_STEPS = 48, 28
OUTER = STORAGE_JAR_PROFILE[1:31]
INNER = tuple(reversed(STORAGE_JAR_PROFILE[31:-1]))


def radius_at(profile, z):
    for (r0, z0), (r1, z1) in zip(profile, profile[1:]):
        if z <= z1:
            return r0 + (r1-r0) * max(0, (z-z0)/(z1-z0))
    return profile[-1][0]


def section(band, sector, u, v):
    alpha = .31 + TAU*(SECTOR_CUTS[sector] + u*(SECTOR_CUTS[sector+1]-SECTOR_CUTS[sector]))
    lower = .27 + .10*math.sin(2*alpha+.3) + .027*math.asin(math.sin(7*alpha+.6))*2/math.pi
    upper = .71 + .093*math.sin(3*alpha+1.2) + .039*math.asin(math.sin(5*alpha-.8))*2/math.pi
    cuts = (0, lower, upper, 1)
    t = cuts[band] + v*(cuts[band+1]-cuts[band])
    angle = alpha + math.sin(math.pi*t)*(.15*math.sin(2*alpha+t*7)+.055*math.sin(5*alpha-t*4))
    return t, angle


def shard(band, sector, outside, inside, fracture):
    vertices, faces, materials = [], [], []
    stride = WIDTH_STEPS + 1
    rows = HEIGHT_STEPS + 1 + int(band == 0)
    layer = rows * stride
    for inner in (False, True):
        for j in range(rows):
            row = j - int(band == 0)
            for i in range(stride):
                t, angle = section(band, sector, i/WIDTH_STEPS, max(0,row)/HEIGHT_STEPS)
                z = max(.017 if inner else .001, .001+t*.424)
                radius = radius_at(INNER if inner else OUTER, z) + storage_jar_throwing(angle, z)
                if row < 0:
                    z, radius = (.013 if inner else .001), 0
                vertices.append(tuple(GAME_SCALE*v for v in (radius*math.cos(angle), radius*math.sin(angle), z-.001)))

    def face(indices, material_index):
        faces.append(indices)
        materials.append(material_index)

    for j in range(rows-1):
        for i in range(WIDTH_STEPS):
            a = j*stride+i
            face((a,a+1,a+stride+1,a+stride), 0)
            face((a+layer,a+stride+layer,a+stride+1+layer,a+1+layer), 1)
    for j in (0,rows-1):
        if j == 0 and band == 0:
            continue
        for i in range(WIDTH_STEPS):
            a = j*stride+i
            face((a,a+1,a+1+layer,a+layer), 0 if j == rows-1 and band == 2 else 2)
    for i in (0,WIDTH_STEPS):
        for j in range(rows-1):
            a = j*stride+i
            face((a,a+stride,a+stride+layer,a+layer), 2)

    name = f'shard_{band}_{sector}'
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    for surface in (outside,inside,fracture):
        data.materials.append(surface)
    for polygon, material_index in zip(data.polygons, materials):
        polygon.material_index = material_index
        polygon.use_smooth = material_index != 2
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=.00001)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)
    set_uv(obj, lambda p: ((math.atan2(p.y,p.x)/TAU)%1, (p.z/GAME_SCALE+.001)/.425), wrap_u=True)
    return obj


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    body, positive_handle, negative_handle = storage_jar()
    outside = body.data.materials[0]
    outside.name = 'Storage jar exterior'
    inside = outside.copy()
    inside.name = 'Storage jar interior'
    bpy.data.objects.remove(body, do_unlink=True)
    fracture = material('Exposed onggi fracture', (.21,.145,.092), .89)
    shards = {(band,sector):shard(band,sector,outside,inside,fracture)
              for band in range(3) for sector in range(3)}
    for handle, sector in ((positive_handle,2),(negative_handle,1)):
        handle.parent = shards[1,sector]
        handle.scale = (GAME_SCALE,)*3
        handle.location.z = -.001*GAME_SCALE
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/blend/bcm-1072-restoration.blend'), compress=True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/bcm-1072-restoration.glb'), export_yup=True)


if __name__ == '__main__':
    main()
