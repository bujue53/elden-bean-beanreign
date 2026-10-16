"""Reference-guided reconstruction of the in-game Nightlord, not a ripped asset."""
import os, sys, math, json
import bpy
from mathutils import Vector
sys.path.insert(0,os.path.dirname(__file__))
import build_nightfarers as a

a.M['nightplate']=a.material('Nightlord blackened steel',(.15,.18,.23),.85,.32,True)
a.M['nightedge']=a.material('Nightlord etched silver',(.39,.44,.52),.83,.30,True)
a.M['void']=a.material('Nightlord hollow shadow',(.012,.014,.024),0,.92)
a.M['spectral']=a.material('Nightlord spectral blade',(.32,.54,.95),.5,.25)
a.M['cloak']=a.material('Nightlord indigo mantle',(.065,.035,.18),0,.87,True)
a.M['bronze']=a.M['nightplate']
a.M['leather']=a.M['void']
p,_,_=a.base('heolstor');root=p['root'];b=p['body'];h=p['head']

# Thin, tall, segmented cuirass with an open shadowed abdomen.
a.shell('Ribbed black cuirass',[(1.05,.16,.10,0),(1.22,.185,.13,0),(1.43,.255,.145,0),(1.54,.21,.105,0)],'nightplate',b,36)
for s in [-1,1]:
    for j in range(7):
        y=1.11+j*.052
        a.tube('Raised rib armour',[(s*.02,y,.139),(s*.09,y+.015,.151),(s*.18,y+.045,.12),(s*.23,y+.07,.06)],.007,'nightedge',b)
    a.ell('Angular breastplate',(s*.14,1.40,.105),(.12,.13,.068),'nightplate',b)
    arm=p['armL' if s<0 else 'armR']
    for j in range(4):
        a.ell('Segmented spiked pauldron',(s*(.26+j*.026),1.51-j*.027,0),(.145-j*.016,.055,.15-j*.01),'nightplate',arm)
    for j in range(5):
        a.rod('Shoulder spear',(s*(.24+j*.035),1.52-j*.022,-.015),(s*(.29+j*.05),1.68-j*.015,-.04),.025,'nightedge',arm,r2=0)
    a.relief('Gauntlet engraving',(s*.31,1.07,.075),.065,.19,'nightedge',arm,5)
    for j in range(5):
        a.ell('Layered hip plate',(s*.15,.99-j*.07,.09),(.105,.055,.04),'nightplate',root)
    a.relief('Long thigh engraving',(s*.11,.69,.086),.09,.27,'nightedge',p['legL' if s<0 else 'legR'],5)

# The characteristic sealed, pointed crown rather than a pair of bean horns.
a.ell('Sealed pointed helmet',(0,1.82,0),(.119,.173,.12),'nightplate',h,32)
for i in range(9):
    angle=(i/8)*math.pi
    x=math.cos(angle)*.115;z=math.sin(angle)*.085
    length=.17+.10*abs(math.cos(angle*2))
    a.rod('Crown narrow spike',(x,1.94,z),(x*1.23,1.94+length,z*.8),.017,'nightedge',h,r2=.001)
for s in [-1,1]:
    for j in range(6):
        a.tube('Helmet layered grooves',[(s*.012,1.72+j*.032,.123),(s*.07,1.75+j*.031,.111),(s*.11,1.78+j*.027,.052)],.004,'nightedge',h)
    a.tube('Helmet eye slit',[(s*.013,1.855,.122),(s*.083,1.871,.10)],.004,'void',h)
a.relief('Helmet front script',(0,1.82,.125),.14,.22,'nightedge',h,9)
a.ell('Hollow chest',(0,1.25,.137),(.075,.19,.015),'void',b)
anchor=a.empty('criticalAnchor',(0,1.26,.15),b);anchor['part']='criticalAnchor'

# Long asymmetrical ragged strips, with actual mesh folds and torn hems.
for j in range(11):
    x=-.26+j*.052
    lower=.16+.16*(.5+.5*math.sin(j*2.3))
    cape=a.cloth('Torn indigo cape', (x,1.50,-.14),(x*1.65,lower,-.30-.06*math.sin(j)),.047,.06,'cloak',b,.028)
    if j==0:cape['part']='cape'
for j in range(7):
    x=-.17+j*.056
    a.tube('Cape silver frayed seam',[(x,1.46,-.18),(x*1.2,.95,-.24),(x*1.5,.34,-.34)],.002,'nightedge',b)

# Broad pointed greatsword, with a separate dark off-hand blade.
wh=p['weaponHolder'];x=.305
a.rod('Greatsword long grip',(x,.75,.055),(x,1.09,.055),.026,'void',wh)
a.ell('Greatsword pommel',(x,.75,.055),(.045,.045,.04),'nightedge',wh)
a.tube('Swept crossguard',[(x-.17,1.08,.055),(x-.10,1.04,.055),(x,1.09,.055),(x+.10,1.04,.055),(x+.17,1.08,.055)],.022,'nightedge',wh)
verts=[(x-.065,1.10,.035),(x+.065,1.10,.035),(x+.08,2.35,.035),(x,2.60,.035),(x-.08,2.35,.035),(x,1.20,.073),(x,2.36,.073)]
blade=a.mesh('Spectral greatsword',verts,[(0,1,5),(1,2,6,5),(2,3,6),(3,4,6),(4,0,5,6)],'spectral',wh);blade['part']='blade'
for j in range(13):
    y=1.23+j*.077
    a.tube('Greatsword arcane rune',[(x-.025,y,.077),(x+.018,y+.025,.077),(x-.014,y+.047,.077)],.003,'nightedge',wh)
left=p['armL']
a.rod('Offhand black sword grip',(-.305,.8,.055),(-.305,1.0,.055),.024,'void',left)
a.mesh('Offhand narrow dark blade',[(-.34,1.02,.055),(-.27,1.02,.055),(-.275,1.81,.055),(-.305,1.95,.055),(-.335,1.81,.055)],[(0,1,2,3,4)],'nightplate',left)

for name in ['body','head','armL','armR','legL','legR','weaponHolder']:
    p[name]['part']=name;p[name].name=name
root.scale=(2,2,2)
root['classId']='heolstor'
info=a.export(p,'heolstor')
manifest_path=os.path.join(a.OUT,'manifest.json')
with open(manifest_path,encoding='utf-8') as f:manifest=json.load(f)
manifest['models']=[m for m in manifest['models'] if m['id']!='heolstor']+[info]
with open(manifest_path,'w',encoding='utf-8') as f:json.dump(manifest,f,ensure_ascii=False,indent=2)

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=40
scene.world.color=(.07,.08,.12)
a.box('Preview pedestal',(0,-.08,0),(3,.15,3),'nightplate',None,.03)
for name,position,energy,color in [('Key',(-3,6,5),1500,(.75,.84,1)),('Fill',(4,4,2),1000,(1,.80,.57)),('Rim',(0,5,-3),2000,(.5,.35,1))]:
    light=bpy.data.lights.new(name,'AREA');light.energy=energy;light.size=4;light.color=color
    obj=bpy.data.objects.new(name,light);scene.collection.objects.link(obj);obj.location=a.xyz(position)
    obj.rotation_euler=(a.xyz((0,2,0))-obj.location).to_track_quat('-Z','Y').to_euler()
camera_data=bpy.data.cameras.new('Heolstor camera');camera=bpy.data.objects.new('Heolstor camera',camera_data);scene.collection.objects.link(camera)
camera.location=a.xyz((5,3.7,8));camera.rotation_euler=(a.xyz((0,2.2,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.type='ORTHO';camera_data.ortho_scale=6.3;scene.camera=camera
scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(a.BLEND,'heolstor.blend'))
scene.render.filepath=os.path.join(a.PREVIEW,'heolstor.png');bpy.ops.render.render(write_still=True)
print(json.dumps(info),flush=True)
