"""Blender: blender -b -t 6 --python generate_model.py -- bcm-1072"""

import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.noise import noise_vector

ROOT = Path(__file__).resolve().parent
TAU = math.tau


def material(name, color, roughness, metallic=0, vertex_color=False):
    result = bpy.data.materials.new(name)
    result.diffuse_color = (*color, 1)
    result.use_nodes = True
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if vertex_color:
        attribute = result.node_tree.nodes.new("ShaderNodeVertexColor")
        attribute.layer_name = "Surface color"
        result.node_tree.links.new(attribute.outputs["Color"], shader.inputs["Base Color"])
    return result


def texture_node(surface, name, rgb, *, linear_data=False):
    height, width, _ = rgb.shape
    rgba = np.concatenate([np.clip(rgb, 0, 1), np.ones((height, width, 1), dtype=np.float32)], axis=-1)
    if not linear_data:
        srgb = rgba[..., :3]
        rgba[..., :3] = np.where(srgb <= .04045, srgb/12.92, ((srgb+.055)/1.055)**2.4)
    img = bpy.data.images.new(name, width=width, height=height)
    if linear_data:
        img.colorspace_settings.name = "Non-Color"
    img.pixels.foreach_set(rgba.astype(np.float32).ravel())
    img.pack()
    tree = surface.node_tree
    node = tree.nodes.new("ShaderNodeTexImage")
    node.image = img
    return node


def color_texture(surface, name, rgb):
    node = texture_node(surface, name, rgb)
    tree = surface.node_tree
    tree.links.new(node.outputs["Color"], tree.nodes.get("Principled BSDF").inputs["Base Color"])


def set_uv(obj, project, wrap_u=False):
    uv = obj.data.uv_layers.new()
    for polygon in obj.data.polygons:
        points = [project(obj.data.vertices[obj.data.loops[i].vertex_index].co)
                  for i in polygon.loop_indices]
        seam = wrap_u and max(u for u, _ in points) - min(u for u, _ in points) > .5
        for i, (u, v) in zip(polygon.loop_indices, points):
            uv.data[i].uv = (u + int(seam and u < .5), v)


def mesh(name, vertices, faces, surface, shade=None):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    edit = bmesh.new()
    edit.from_mesh(data)
    bmesh.ops.remove_doubles(edit, verts=list(edit.verts), dist=1e-7)
    bmesh.ops.recalc_face_normals(edit, faces=list(edit.faces))
    edit.to_mesh(data)
    edit.free()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(surface)
    for face in data.polygons:
        face.use_smooth = True
    if shade:
        colors = data.color_attributes.new(name="Surface color", type="FLOAT_COLOR", domain="POINT")
        for vertex in data.vertices:
            colors.data[vertex.index].color = (*shade(vertex.co), 1)
    return obj


def lathe(name, profile, surface, shade=None, radius_offset=None, segments=96):
    vertices = []
    faces = []
    for radius, z in profile:
        for i in range(segments):
            a = i * TAU / segments
            r = radius + (radius_offset(a, z) if radius_offset and radius > 0 else 0)
            vertices.append((r * math.cos(a), r * math.sin(a), z))
    for row in range(len(profile) - 1):
        for i in range(segments):
            j = (i + 1) % segments
            base = row * segments
            faces.append((base+i, base+j, base+segments+j, base+segments+i))
    return mesh(name, vertices, faces, surface, shade)


def lug(name, center, angle, height, reach, radius, surface, shade):
    radial = Vector((math.cos(angle), math.sin(angle), 0))
    tangent = Vector((-radial.y, radial.x, 0))
    up = Vector((0, 0, 1))
    vertices = []
    for i in range(21):
        t = math.pi * i / 20
        middle = Vector(center) + radial * (reach * math.sin(t)) + up * (height * math.cos(t) / 2)
        for j in range(12):
            a = j * TAU / 12
            outside = radial * math.sin(t) + up * math.cos(t)
            vertices.append(middle + radius * (tangent * math.cos(a) + outside * math.sin(a)))
    faces = [(i*12+j, i*12+(j+1)%12, (i+1)*12+(j+1)%12, (i+1)*12+j)
             for i in range(20) for j in range(12)]
    faces.extend((tuple(range(11, -1, -1)), tuple(range(240, 252))))
    return mesh(name, vertices, faces, surface, shade)


def clamp(value):
    return min(1.0, max(0.0, value))


def blend(first, second, amount):
    t = clamp(amount)
    return tuple(a * (1-t) + b*t for a, b in zip(first, second))


STORAGE_JAR_PROFILE = [
    (0, .001), (.086, .001), (.091, .004), (.095, .016), (.101, .03),
    (.113, .057), (.128, .093), (.143, .13), (.154, .168), (.161, .198),
    (.163, .211), (.164, .216), (.165, .221), (.166, .232), (.166, .248),
    (.166, .263), (.167, .266), (.167, .269), (.166, .286), (.164, .301),
    (.163, .306), (.162, .309), (.157, .329), (.147, .348), (.134, .366),
    (.118, .382), (.102, .397), (.087, .408), (.084, .416), (.088, .421),
    (.086, .425), (.079, .425), (.076, .420), (.077, .410), (.085, .398),
    (.116, .373), (.143, .339), (.155, .305), (.157, .264), (.156, .216),
    (.147, .174), (.133, .127), (.116, .084), (.096, .041), (.086, .017), (0, .013),
]


def storage_jar_throwing(a, z):
    wave = z - .217 - .004 * math.cos(a*7)
    incisions = sum(math.exp(-((z-h)/.0018)**2) for h in (.265, .306))
    return (.0011 * math.sin(a*3) * math.sin(z*7.4)
            + .0018 * math.exp(-(wave/.0033)**2)
            - .0015 * incisions * max(0, math.cos(a*34))**5
            + .00065 * math.sin(z*720)*math.sin(a*2+1))


def storage_jar():
    clay = material("Fired onggi, warm shoulder over charcoal clay", (.20, .15, .11), .81, vertex_color=True)

    def shade(v):
        coarse, fine, _ = noise_vector(v * 28)
        rim = clamp((v.z - .344 + .005*coarse) / .018)
        base = blend((.135, .122, .099), (.47, .295, .161), rim)
        streak = math.sin(550 * v.z + coarse) * .055
        return tuple(c * (1 + .23*coarse + .11*fine + streak) for c in base)

    fired = material("Unglazed clay | generated firing and tool marks", (.20, .15, .11), .84)
    v, u = np.mgrid[0:768, 0:1024].astype(np.float32)
    v /= 767
    u /= 1023
    angle = u*TAU
    rng = np.random.default_rng(1072)
    grit = rng.random(v.shape, dtype=np.float32)
    cloud = np.sin(angle*3 + np.sin(v*8)) * np.sin(v*11-angle)
    shoulder = np.clip((v-.81+.023*np.sin(angle*3))/.10, 0, 1)
    base = np.array([.37, .35, .30]) + shoulder[..., None]*np.array([.33, .22, .14])
    grooves = np.sin(v*410 + np.sin(angle*5))* .013
    dents = sum(np.exp(-((v-level-.004*np.sin(angle*7))/.006)**2)
                for level in (.62, .72)) * np.clip(np.cos(angle*32), 0, 1)**7
    dimples = np.where(grit < .018, -.16, 0)
    variation = (grit-.5)*.058 + cloud*.045 + grooves - dents*.125 + dimples
    color_texture(fired, "Original onggi firing and incisions", base+variation[..., None])
    jar = lathe("Onggi | hollow thrown body", STORAGE_JAR_PROFILE, fired, radius_offset=storage_jar_throwing)
    set_uv(jar, lambda p: ((math.atan2(p.y,p.x)/TAU)%1, p.z/.425), wrap_u=True)
    return [jar, *(lug(f"Side handle {i+1}", (.157 * sign, 0, .231), i * math.pi,
                      .044, .022, .007, clay, shade) for i, sign in enumerate((1, -1)))]


def placenta_jars():
    body_mat = material("Warm white porcelain", (.81, .72, .57), .32, vertex_color=True)
    lid_mat = material("Pale glazed porcelain", (.79, .82, .74), .26, vertex_color=True)
    result = []
    for label, x, scale, stained in (("Outer jar", -.081, 1, False), ("Inner jar", .113, .68, True)):
        width = 1 if not stained else .78

        def surface_color(v, base=(.81, .73, .60)):
            broad, stain, _ = noise_vector(v * 37)
            original = tuple(channel * (.96 + .13*broad) for channel in base)
            if stained:
                stain_line = clamp((stain - .28) * 7)
                return blend(original, (.46, .217, .079), stain_line * .60)
            return original

        def profile_at(profile):
            return [(r*scale*width, z*scale) for r, z in profile]

        body = lathe(f"{label} | body", profile_at([
            (0, .001), (.048, .001), (.056, .005), (.061, .014), (.068, .034),
            (.077, .057), (.088, .082), (.099, .11), (.108, .136),
            (.114, .159), (.115, .178), (.111, .192), (.103, .201),
            (.099, .205), (.098, .212), (.091, .212), (.090, .200),
            (.100, .190), (.106, .174), (.104, .152), (.092, .117),
            (.072, .067), (.051, .019), (0, .013),
        ]), body_mat, surface_color, segments=72)
        lid = lathe(f"{label} | removable lid", profile_at([
            (0, .212), (.081, .212), (.095, .208), (.100, .212), (.101, .219),
            (.098, .233), (.091, .247), (.078, .258), (.061, .265), (.041, .269),
            (.017, .271), (.013, .274), (.012, .279), (.019, .284), (.021, .290),
            (.019, .296), (.012, .300), (0, .301),
        ]), lid_mat, lambda v: surface_color(v, (.78, .82, .77)), segments=72)
        parts = [body, lid]
        for index, angle in enumerate((-2.22, -.92, .92, 2.22)):
            r = .107 * scale * width
            parts.append(lug(f"{label} | shoulder loop {index+1}",
                             (r*math.cos(angle), r*math.sin(angle), .179*scale),
                             angle, .026*scale, .009*scale, .004*scale, body_mat, surface_color))
        for part in parts:
            part.location.x = x
        result.extend(parts)
    return result


def arrowhead():
    bronze = material("Bronze with generated green patina", (.14, .20, .125), .69, .30)
    y,x = np.mgrid[0:512,0:256].astype(np.float32)
    rng = np.random.default_rng(937)
    grain = rng.random(y.shape, dtype=np.float32)
    cloud = np.sin(x*.12+y*.11+np.sin(y*.065)*2)*np.sin(y*.072-x*.082)
    pits = np.sin(x*.47+y*.31+3*np.sin(y*.18+x*.08))*np.sin(y*.39-x*.54+4*cloud)
    patina = np.clip(.48+.64*cloud+.18*pits+.12*(grain-.5),0,1)
    pale = np.clip(.1+.8*pits*cloud+.12*(grain-.5),0,1)
    base = (np.array([.35,.33,.24])+patina[...,None]*np.array([-.10,.12,.085])
            +pale[...,None]*np.array([.32,.29,.20])+(grain[...,None]-.5)*.14)
    color_texture(bronze, "Original bronze oxidation study", base)

    # Half sections: blade wings hang below the junction with the narrow tang.
    # Each section defines left x/z, ridge z, right x/z, ridge thickness.
    sections = [
        (-.00115, 0, .00045, .00104, .0003, .00061),
        (-.00142, .004, .004, .00125, .004, .00085),
        (-.00148, .010, .010, .00162, .0103, .00104),
        (-.00196, .0198, .0198, .0022, .020, .0013),
        (-.0026, .0221, .0223, .0029, .022, .00155),
        (-.0065, .0204, .0252, .0071, .0215, .00182),
        (-.0075, .0196, .0287, .0078, .0206, .00190),
        (-.0070, .0238, .0327, .0068, .0248, .00175),
        (-.0050, .0301, .0370, .0052, .0310, .00159),
        (-.0033, .0364, .042, .0036, .037, .0012),
        (-.0013, .044, .0470, .0014, .0445, .00071),
        (-.00035, .0484, .049, .0004, .0485, .00026),
        (-.00004, .050, .050, .00005, .050, .00007),
    ]
    vertices = []
    for left, lz, z, right, rz, depth in sections:
        vertices.extend([
            (left, 0, lz), (left*.58, -depth*.62, lz*.63+z*.37),
            (0, -depth, z), (right*.57, -depth*.62, rz*.62+z*.38), (right, 0, rz),
            (right*.57, depth*.56, rz*.62+z*.38), (0, depth*.86, z),
            (left*.58, depth*.56, lz*.63+z*.37),
        ])
    faces = [(r*8+j, r*8+(j+1)%8, (r+1)*8+(j+1)%8, (r+1)*8+j)
             for r in range(len(sections)-1) for j in range(8)]
    faces.extend((tuple(range(7, -1, -1)), tuple(range(len(vertices)-8, len(vertices)))))
    obj = mesh("Bronze arrowhead | upper row third from left", vertices, faces, bronze)
    set_uv(obj, lambda p: (.5+p.x/.017,.018+p.z/.052))
    return [obj]


def stone_surface():
    """Draw an original mineral pattern; no source photograph is sampled."""
    surface = material("Polished rhyolite | original generated mineral pattern", (.34, .22, .09), .49)
    size = 1024
    y, x = np.mgrid[0:size, 0:size].astype(np.float32) / (size - 1)
    rng = np.random.default_rng(569)
    grain = rng.random((size, size), dtype=np.float32) - .5
    veins = np.sin(x*23 + y*21 + np.sin(y*22-x*13) * 2.8)
    waves = np.sin(x*60-y*28+3*np.sin(y*21)) * np.sin(y*59+x*32)
    palette = np.stack([.58+.077*veins, .468+.060*veins, .285+.037*veins], axis=-1)
    palette += (grain*.22 + waves*.046)[..., None]
    micro_height = waves * .000014
    for cx, cy, sx, sy, strength, rings in [
        (.49, .66, .318, .179, 1., 13), (.37, .32, .09, .073, .63, 4),
        (.67, .27, .062, .057, .32, 3), (.76, .51, .052, .047, .32, 3),
    ]:
        dx, dy = (x-cx)/sx, (y-cy)/sy
        theta = np.arctan2(dy, dx)
        r = np.hypot(dx, dy) * (1 + .025*np.cos(theta*3) + .015*np.sin(theta*7))
        fibers = np.sin(theta*107 + 1.8*np.sin(theta*17) + 1.3*np.sin(r*27+theta*9))
        band_phase = r*rings + .12*np.sin(r*21) + .11*fibers*np.clip(r*3, 0, 1)
        rings_dark = (.5 + .5*np.cos(TAU*band_phase))**4
        rays_dark = (.5 + .5*fibers)**7 * np.clip((r-.12)*4, 0, 1)
        pale = np.array([.78, .75, .63]) - rings_dark[..., None]*np.array([.32,.34,.32])
        pale -= rays_dark[..., None]*np.array([.19,.22,.21])
        pale += (grain*.18 + waves*.043)[..., None]
        core = np.clip((.81-r)*15, 0, 1)
        rim = np.exp(-((r-.89)/.114)**2)
        fine_edge = np.exp(-((r-.982)/.008)**2) * .17
        brown = palette*(1-.43*rim[..., None])+fine_edge[..., None]
        blend_weight = np.clip((1.045-r)*18, 0, 1)*strength
        color = brown*(1-core[..., None])+pale*core[..., None]
        palette = palette*(1-blend_weight[..., None])+color*blend_weight[..., None]
        micro_height += (1-rings_dark-.45*rays_dark) * core * strength * .00021
    color_texture(surface, "Original rhyolite mineral study", palette)
    # Fine relief on a polished face, encoded as a tangent-space GLB normal map.
    dz, dx = np.gradient(micro_height, .852/(size-1), .502/(size-1))
    normals = np.stack([-dx, -dz, np.ones_like(dx)], axis=-1)
    normals /= np.linalg.norm(normals, axis=-1, keepdims=True)
    node = texture_node(surface, "Rhyolite mineral micro-relief", normals*.5+.5, linear_data=True)
    tree = surface.node_tree
    normal_map = tree.nodes.new("ShaderNodeNormalMap")
    tree.links.new(node.outputs["Color"], normal_map.inputs["Color"])
    tree.links.new(normal_map.outputs["Normal"], tree.nodes.get("Principled BSDF").inputs["Normal"])
    return surface


def sunflower_stone():
    front = stone_surface()
    back = material("Weathered rhyolite | sides and unseen rear", (.16, .11, .052), .82, vertex_color=True)
    count = 88
    layers = [(0, -.114), (.32, -.114), (.66, -.113), (.85, -.109),
              (.95, -.095), (1, -.064), (1, .005), (.97, .051),
              (.89, .083), (.73, .107), (.42, .115), (0, .115)]
    vertices = []
    for scale, depth in layers:
        for i in range(count):
            a = i * TAU / count
            sn, cs = math.sin(a), math.cos(a)
            rough = 1+.018*math.cos(a*5)+.012*math.sin(a*9)
            z = max(0, .405 + scale * (.405 if sn>0 else .49) * math.copysign(abs(sn)**.84, sn))
            taper = .89 + .12 * min(z/.56, 1)
            x = .242 * scale * math.copysign(abs(cs)**(.86 if sn>0 else .46), cs) * taper * rough
            y = depth + (scale*.009*math.sin(a*4+.6) if depth > -.1 else 0)
            vertices.append((x, y, min(.81, z)))
    faces = []
    for r in range(len(layers)-1):
        for j in range(count):
            k = (j+1) % count
            faces.append((r*count+j, r*count+k, (r+1)*count+k, (r+1)*count+j))
    obj = mesh("Sunflower stone | polished front and rounded slab", vertices, faces, front)
    obj.data.materials.append(back)
    uv = obj.data.uv_layers.new(name="Planar mineral map")
    colors = obj.data.color_attributes.new(name="Surface color", type="FLOAT_COLOR", domain="POINT")
    for v in obj.data.vertices:
        n, m, _ = noise_vector(v.co*38)
        colors.data[v.index].color = (*blend((.085, .047, .016), (.23, .147, .054), .43+.6*n+.2*m), 1)
    for polygon in obj.data.polygons:
        mean_y = sum(obj.data.vertices[i].co.y for i in polygon.vertices)/len(polygon.vertices)
        polygon.material_index = int(mean_y > -.03)
        for index in polygon.loop_indices:
            v = obj.data.vertices[obj.data.loops[index].vertex_index].co
            uv.data[index].uv = (.5+v.x/.502, .026+v.z/.852)
    return [obj]


def world_bounds(objects):
    bpy.context.view_layer.update()
    corners = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    return [Vector(fn(v[i] for v in corners) for i in range(3)) for fn in (min, max)]


def preview_scene(scene, low, high, artifact_id):
    center = (low + high) / 2
    size = max(high - low)
    world = bpy.data.worlds.new("Neutral studio")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (.20, .24, .31, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = .65
    scene.world = world
    bpy.ops.mesh.primitive_plane_add(size=size*200, location=(0, 0, low.z-size*.004))
    ground = bpy.context.object
    ground.name = "Preview floor | excluded from GLB"
    ground.data.materials.append(material("Studio floor", (.084, .092, .106), .87))

    def light(name, offset, power, width, color):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = power*size**2
        data.shape = "DISK"
        data.size = width*size
        data.color = color
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = center + Vector(offset)*size
        obj.rotation_euler = (center-obj.location).to_track_quat("-Z", "Y").to_euler()

    light("Key", (-2, -3, 3), 380, 2.2, (1, .91, .77))
    light("Fill", (2, -2, 1), 170, 2.6, (.80, .89, 1))
    light("Rim", (1, 2, 3), 350, 1.9, (1, .97, .89))
    camera = bpy.data.cameras.new("Preview camera")
    obj = bpy.data.objects.new("Preview camera", camera)
    scene.collection.objects.link(obj)
    scene.camera = obj
    x = .18 if artifact_id in {"bcm-937", "bcm-569"} else .82
    obj.location = center + Vector((x, -3.8, .95))*size
    obj.rotation_euler = (center-obj.location).to_track_quat("-Z", "Y").to_euler()
    camera.type = "ORTHO"
    camera.ortho_scale = size*1.32
    camera.clip_start = size*.02
    camera.clip_end = size*100
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 840
    scene.render.resolution_y = 840
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"


def main():
    builders = {"bcm-1072": storage_jar, "bcm-exh-1659-tae": placenta_jars,
                "bcm-937": arrowhead, "bcm-569": sunflower_stone}
    artifact_id, = sys.argv[sys.argv.index("--")+1:]
    output = ROOT / "artifacts" / artifact_id
    output.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    objects = builders[artifact_id]()
    low, high = world_bounds(objects)
    origin = Vector(((low.x+high.x)/2, (low.y+high.y)/2, low.z))
    for obj in objects:
        obj.location -= origin
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    low, high = world_bounds(objects)
    scene["model_id"] = artifact_id
    scene["source_note"] = "Reference-based interpretation; see metadata.json for inferred dimensions and surfaces."
    bpy.ops.export_scene.gltf(filepath=str(output/"model.glb"), use_selection=True, export_yup=True,
                              export_tangents=artifact_id == "bcm-569")
    stats = {"bounds_m_blender_xyz": [round(x, 6) for x in high-low], "mesh_objects": len(objects),
             "source_triangles": sum(len(face.vertices)-2 for obj in objects for face in obj.data.polygons)}
    preview_scene(scene, low, high, artifact_id)
    scene.render.filepath = str(output/"preview.png")
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(output/"model.blend"), compress=True)
    bpy.ops.render.render(write_still=True)
    (output/"model-stats.json").write_text(json.dumps(stats, indent=2)+"\n", encoding="utf-8")


if __name__ == "__main__":
    main()
