import bpy, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'assets','blender','nightfarers.blend'))
scene=bpy.context.scene
scene.cycles.samples=32
scene.render.resolution_x=320;scene.render.resolution_y=400;scene.render.resolution_percentage=100
scene.render.film_transparent=True
camera=scene.camera;camera.data.ortho_scale=2.7
out=os.path.join(ROOT,'assets','portraits');os.makedirs(out,exist_ok=True)
roots=[]
for obj in scene.objects:
    if obj.parent is None and obj.get('classId'):roots.append(obj)
floor=scene.objects.get('Studio plinth');floor.hide_render=True
for selected in roots:
    for root in roots:
        root.hide_render=root!=selected
        for child in root.children_recursive:child.hide_render=root!=selected
    x=selected.location.x
    camera.location=(x+2.2,-5,2.25)
    camera.rotation_euler=(Vector((x,0,1.22))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=os.path.join(out,selected['classId']+'.png')
    bpy.ops.render.render(write_still=True)
