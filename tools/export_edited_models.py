"""Export the edited .blend without regenerating its meshes."""
import bpy, os, json
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'assets','blender','nightfarers.blend'))
manifest_path=os.path.join(ROOT,'assets','models','manifest.json')
with open(manifest_path,encoding='utf-8') as f:manifest=json.load(f)
for root in list(bpy.context.scene.objects):
    if root.parent is not None or not root.get('classId'):continue
    origin=root.location.copy()
    root.location=(0,0,0)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    for obj in [root]+list(root.children_recursive):obj.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'assets','models',root['classId']+'.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False)
    meshes=[o for o in root.children_recursive if o.type=='MESH']
    heights=[(o.matrix_world@Vector(corner)).z for o in meshes for corner in o.bound_box]
    for info in manifest['models']:
        if info['id']==root['classId']:
            info.update(bytes=os.path.getsize(os.path.join(ROOT,info['file'])),triangles=sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),meshCount=len(meshes),height=round(max(heights)-min(heights),3))
    root.location=origin
with open(manifest_path,'w',encoding='utf-8') as f:json.dump(manifest,f,ensure_ascii=False,indent=2)
