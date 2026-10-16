"""Original, reference-guided meshes. Run with Blender --background --python this_file.
Coordinates in helpers are game coordinates: +Y up, +Z forward.
Official reference links and reconstruction limits are in docs/MODELS.md.
"""
import bpy
import bmesh
import math
import os
import json
import random
import numpy as np
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'models')
BLEND = os.path.join(ROOT, 'assets', 'blender')
PREVIEW = os.path.join(ROOT, 'docs', 'models')
for folder in (OUT, BLEND, PREVIEW):
    os.makedirs(folder, exist_ok=True)
random.seed(17)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def xyz(p):
    return Vector((p[0], -p[2], p[1]))

def parent_to(obj, parent):
    if parent:
        bpy.context.view_layer.update()
        world = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_world = world
    return obj

def empty(name, p, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = xyz(p)
    return parent_to(obj, parent)

def material(name, color, metal=0, rough=.6, patina=False):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bs = mat.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Metallic'].default_value = metal
    bs.inputs['Roughness'].default_value = rough
    if patina:
        rng = np.random.default_rng(sum(map(ord, name)))
        yy, xx = np.mgrid[0:256, 0:256]
        grain = rng.random((256, 256))
        bands = np.sin(xx * .15 + np.sin(yy * .06) * 3) * .08
        stains = np.sin(xx * .027) * np.cos(yy * .032) * .13
        factor = np.clip(.7 + grain * .35 + bands + stains, .42, 1.2)
        rgba = np.ones((256, 256, 4), dtype=np.float32)
        for i in range(3):
            rgba[:, :, i] = np.clip(color[i] * factor, 0, 1)
        image = bpy.data.images.new(name + '_surface', width=256, height=256)
        image.pixels.foreach_set(rgba.ravel())
        image.pack()
        tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image = image
        mat.node_tree.links.new(tex.outputs['Color'], bs.inputs['Base Color'])
    return mat

M = {
    'bronze': material('Weathered crucible bronze', (.30,.19,.10), .78,.35,True),
    'edge': material('Worn gold edges', (.58,.40,.19), .82,.28,True),
    'silver': material('Guardian engraved silver', (.43,.49,.53), .86,.32,True),
    'blackmetal': material('Dark iron', (.09,.115,.13), .72,.38,True),
    'leather': material('Oiled leather', (.09,.055,.034), .05,.78,True),
    'green': material('Executor green cloth', (.09,.16,.145), 0,.95,True),
    'linen': material('Guardian ivory tabard', (.59,.62,.57), 0,.94,True),
    'fur': material('Raider fur', (.16,.14,.12), 0,.97,True),
    'bone': material('Raider horn', (.63,.59,.48), .03,.63,True),
    'purple': material('Recluse faded plum', (.20,.085,.19), 0,.9,True),
    'darkcloth': material('Recluse charcoal silk', (.055,.065,.08), 0,.8,True),
    'hair': material('Silver hair', (.57,.65,.69), .12,.68),
    'skin': material('Weathered skin', (.36,.24,.16), 0,.82),
    'witchskin': material('Recluse dusk skin', (.16,.19,.22), 0,.72),
    'feather': material('Guardian golden feathers', (.33,.22,.10), .05,.87,True),
    'wing': material('Guardian dark wing feathers', (.085,.06,.045), .05,.86),
    'rune': material('Silver embroidery', (.66,.64,.52), .5,.45),
    'gem': material('Arcane green crystal', (.20,.55,.29), .4,.22),
}

def finish(obj, name, mat, parent=None, smooth=True):
    obj.name = name
    obj.data.materials.append(M[mat] if isinstance(mat,str) else mat)
    if smooth and hasattr(obj.data,'polygons'):
        for face in obj.data.polygons:
            face.use_smooth = True
    return parent_to(obj,parent)

def ell(name, p, scale, mat, parent=None, seg=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=12, location=xyz(p))
    obj=bpy.context.object
    obj.scale=(scale[0],scale[2],scale[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj,name,mat,parent)

def box(name,p,scale,mat,parent=None,bevel=.018):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p))
    obj=bpy.context.object
    obj.scale=(scale[0],scale[2],scale[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=obj.modifiers.new('Forged bevel','BEVEL'); mod.width=bevel; mod.segments=2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(obj,name,mat,parent)

def rod(name,a,b,r,mat,parent=None,r2=None,vertices=12):
    av,bv=xyz(a),xyz(b)
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r if r2 is None else r2,depth=(bv-av).length,location=(av+bv)/2)
    obj=bpy.context.object
    obj.rotation_mode='QUATERNION'
    obj.rotation_quaternion=(bv-av).to_track_quat('Z','Y')
    return finish(obj,name,mat,parent)

def tube(name,pts,r,mat,parent=None):
    curve=bpy.data.curves.new(name,'CURVE'); curve.dimensions='3D'; curve.resolution_u=2
    curve.bevel_depth=r; curve.bevel_resolution=1
    spline=curve.splines.new('POLY'); spline.points.add(len(pts)-1)
    for v,p in zip(spline.points,pts):v.co=(*xyz(p),1)
    obj=bpy.data.objects.new(name,curve); bpy.context.collection.objects.link(obj)
    obj.data.materials.append(M[mat]); parent_to(obj,parent)
    bpy.context.view_layer.objects.active=obj; obj.select_set(True)
    bpy.ops.object.convert(target='MESH'); obj.select_set(False)
    return obj

def mesh(name,verts,faces,mat,parent=None):
    data=bpy.data.meshes.new(name); data.from_pydata([xyz(v) for v in verts],[],faces); data.update()
    obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj)
    uv=data.uv_layers.new(name='UVMap')
    for poly in data.polygons:
        for li in poly.loop_indices:
            v=verts[data.loops[li].vertex_index]; uv.data[li].uv=(v[0]*2,v[1]*2)
    return finish(obj,name,mat,parent)

def shell(name,rings,mat,parent=None,steps=28):
    # rings: height, half-width, half-depth, forward offset.
    verts=[]
    for y,rx,rz,zoff in rings:
        for j in range(steps):
            a=j/steps*math.tau; verts.append((rx*math.cos(a),y,rz*math.sin(a)+zoff))
    faces=[]
    for k in range(len(rings)-1):
        for j in range(steps):
            a=k*steps+j; b=k*steps+(j+1)%steps
            faces.append((a,b,b+steps,a+steps))
    faces += [tuple(reversed(range(steps))),tuple((len(rings)-1)*steps+j for j in range(steps))]
    return mesh(name,verts,faces,mat,parent)

def cloth(name,top,bottom,width_top,width_bottom,mat,parent,fold=.04,rows=7,cols=20):
    verts=[]
    for iy in range(rows+1):
        t=iy/rows
        for ix in range(cols+1):
            u=ix/cols*2-1
            w=width_top*(1-t)+width_bottom*t
            verts.append((top[0]*(1-t)+bottom[0]*t+u*w,
                          top[1]*(1-t)+bottom[1]*t+(math.cos(u*13)*.015 if iy==rows else 0),
                          top[2]*(1-t)+bottom[2]*t+math.cos(u*math.pi*5)*fold*(.25+t)))
    faces=[]
    for iy in range(rows):
        for ix in range(cols):
            a=iy*(cols+1)+ix;faces.append((a,a+1,a+cols+2,a+cols+1))
    obj=mesh(name,verts,faces,mat,parent)
    obj.data.materials[0].use_backface_culling=False
    return obj

def feather(name,a,b,width,mat,parent):
    d=Vector(b)-Vector(a); side=Vector((d.y,-d.x,0)).normalized()*width
    av,bv=Vector(a),Vector(b);mid=av+d*.55
    return mesh(name,[tuple(av),tuple(mid+side),tuple(bv),tuple(mid-side),tuple(mid+Vector((0,0,.018)))],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],mat,parent)

def relief(name,center,w,h,mat,parent,count=7):
    x,y,z=center
    for i in range(count):
        u=(i-(count-1)/2)/max(1,count-1)
        pts=[(x+u*w+math.sin(t*math.pi*2+i*.6)*.013,y+(t-.5)*h,z+math.sin(t*math.pi)*.005) for t in np.linspace(0,1,16)]
        tube(name+str(i),pts,.0028,mat,parent)

def band(name,y,width,depth,mat,parent):
    pts=[(math.cos(a)*width,y,math.sin(a)*depth) for a in np.linspace(0,math.tau,49)]
    return tube(name,pts,.012,mat,parent)

def base(kind):
    root=empty(kind,(0,0,0))
    root['source']='Original reference-guided reconstruction; not an extracted game asset'
    body=empty('body',(0,1.03,0),root)
    head=empty('head',(0,1.74,0),body)
    wide=1.25 if kind=='raider' else 1.12 if kind=='guardian' else .86 if kind=='hermit' else 1
    parts={'root':root,'body':body,'head':head}
    armor='silver' if kind=='guardian' else 'blackmetal' if kind=='raider' else 'darkcloth' if kind=='hermit' else 'bronze'
    under='darkcloth' if kind=='hermit' else 'leather'
    shell('Torso undergarment',[(1.0,.15*wide,.11,0),(1.12,.18*wide,.12,0),(1.39,.235*wide,.13,0),(1.52,.24*wide,.105,0),(1.57,.115,.08,0)],under,body)
    ell('Pelvis',(0,.91,0),(.185*wide,.15,.125),under,root)
    rod('Neck',(0,1.54,0),(0,1.73,0),.065,under,head)
    for side,sign in [('L',-1),('R',1)]:
        x=sign*.285*wide
        arm=empty('arm'+side,(x,1.48,0),body);parts['arm'+side]=arm
        elbow=empty('elbow'+side,(x+sign*.03,1.17,.015),arm)
        rod('Upper arm '+side,(x,1.46,0),(x+sign*.03,1.18,.015),.075*wide,under,arm,r2=.062)
        rod('Forearm '+side,(x+sign*.03,1.17,.015),(x+sign*.02,.94,.05),.064*wide,armor,elbow,r2=.049)
        ell('Glove '+side,(x+sign*.02,.91,.045),(.052,.08,.045),'witchskin' if kind=='hermit' else 'leather',elbow)
        leg=empty('leg'+side,(sign*.10,.91,0),root);parts['leg'+side]=leg
        knee=empty('knee'+side,(sign*.115,.48,.015),leg); parts['knee'+side]=knee
        rod('Thigh '+side,(sign*.10,.89,0),(sign*.115,.49,.015),.10*wide,under,leg,r2=.075)
        rod('Shin '+side,(sign*.115,.47,.015),(sign*.12,.12,.01),.073*wide,armor,knee,r2=.052)
        ell('Boot '+side,(sign*.12,.07,.065),(.076*wide,.07,.14),armor,knee)
        if kind!='hermit':
            ell('Knee plate '+side,(sign*.115,.48,.077),(.09*wide,.1,.055),armor,knee)
            relief('Greave etching '+side,(sign*.12,.30,.073),.075,.24,'edge' if kind=='executioner' else 'rune',knee,3)
    handx=.305*wide
    weapon=empty('weaponHolder',(handx,.92,.055),parts['armR']);parts['weaponHolder']=weapon
    return parts,wide,armor

def executor():
    p,w,arm=base('executioner');b=p['body'];h=p['head']
    shell('Fluted crucible cuirass',[(1.02,.168,.12,0),(1.16,.205,.143,0),(1.39,.25,.155,0),(1.48,.20,.125,0)],'bronze',b)
    for s in [-1,1]:
        for j in range(6):
            y=1.18+j*.045
            tube('Raised breast ribs',[(s*.015,y+.015,.16),(s*.08,y,.165),(s*.18,y+.06,.145),(s*.23,y+.09,.10)],.008,'edge',b)
        for j in range(3):
            ell('Overlapping pauldron',(s*(.255+j*.022),1.48-j*.032,-.008),(.13-j*.012,.055,.15-j*.01),'bronze',p['armL' if s<0 else 'armR'])
        armnode=p['armL' if s<0 else 'armR']
        relief('Bracer leaf veins',(s*.31,1.08,.073),.06,.19,'edge',armnode,4)
        for j in range(4):
            ell('Tasset segment',(s*.13,.96-j*.067,.105),(.12,.055,.045),'bronze',p['root'])
    ell('Full enclosed helmet',(0,1.81,0),(.129,.177,.132),'bronze',h,28)
    # Projecting brow, layered facial ridges, a dark slit instead of a cartoon face.
    tube('Helmet central crest',[(0,1.98,-.02),(0,1.96,.10),(0,1.86,.142),(0,1.68,.10)],.009,'edge',h)
    for s in [-1,1]:
        for i in range(8):
            y=1.72+i*.027
            tube('Helmet organic flutes',[(s*.008,y-.025,.137),(s*.055,y,.135),(s*.105,y+.035,.09),(s*.12,y+.043,.025)],.004,'edge',h)
        tube('Visor eye slit',[(s*.018,1.848,.139),(s*.073,1.864,.127),(s*.102,1.877,.10)],.006,'blackmetal',h)
    for j in range(9):
        t=j/8
        tube('Green helmet plume',[(.04+t*.03,1.97,-.06),(.07+t*.04,1.89,-.14),(.08+t*.05,1.64,-.18),(.03+t*.08,1.51,-.13)],.009,'green',h)
    band('Leather waist belt',1.01,.18,.13,'leather',b)
    box('Bronze buckle',(.06,1.01,.14),(.05,.04,.02),'edge',b,.006)
    cloth('Diagonal green sash',(-.06,1.04,.16),(-.19,.73,.22),.14,.22,'green',p['root'])
    cloth('Weathered shoulder cape',(-.08,1.48,-.14),(-.20,.69,-.26),.22,.27,'green',b)
    for j in range(5):
        tube('Cape stitch', [(-.40+.035*j,.72+t*.6,-.27+t*.11) for t in np.linspace(0,1,16)],.002,'rune',b)
    wh=p['weaponHolder'];x=.305
    rod('Katana wrapped grip',(x,.82,.055),(x,1.03,.055),.025,'leather',wh)
    for j in range(9):
        y=.835+j*.019
        tube('Katana wrap',[(x-.022,y,.075),(x+.022,y+.012,.075)],.004,'edge',wh)
    ell('Katana guard',(x,1.04,.055),(.066,.012,.045),'edge',wh)
    verts=[]
    for i in range(21):
        t=i/20;cx=x+.105*t*t
        width=.023*(1-t*.65)
        verts.extend([(cx-width,1.05+t*.97,.055),(cx+width,1.05+t*.97,.055),(cx,1.05+t*.97,.065)])
    faces=[]
    for i in range(20):
        a=i*3;faces.extend([(a,a+3,a+5,a+2),(a+2,a+5,a+4,a+1),(a,a+1,a+4,a+3)])
    mesh('Curved cursed katana',verts,faces,'silver',wh)
    rod('Katana scabbard',(-.21,1.02,-.04),(-.30,.22,-.18),.033,'blackmetal',p['root'])
    return p

def guardian():
    p,w,arm=base('guardian');b=p['body'];h=p['head'];root=p['root']
    shell('Silver breastplate',[(1.02,.19,.145,0),(1.17,.24,.16,0),(1.43,.28,.16,0),(1.52,.19,.12,0)],'silver',b)
    relief('Chest engraved branches',(0,1.29,.168),.30,.34,'rune',b,13)
    for s in [-1,1]:
        ell('Silver shoulder',(s*.31,1.48,0),(.16,.075,.19),'silver',p['armL' if s<0 else 'armR'])
        for j in range(4):
            tube('Shoulder filigree',[(s*(.23+j*.025),1.54,-.10),(s*(.28+j*.025),1.56,.01),(s*(.34+j*.02),1.50,.12)],.005,'rune',b)
    ell('Eagle head',(0,1.84,.01),(.115,.15,.12),'feather',h)
    for s in [-1,1]:
        ell('Eagle amber eye',(s*.087,1.88,.082),(.021,.018,.015),'edge',h)
        ell('Eagle black pupil',(s*.094,1.88,.092),(.008,.01,.006),'blackmetal',h)
        for j in range(11):
            y=1.76+j*.016
            feather('Neck feather',(s*.07,y,-.02),(s*.11,y-.07,-.04),.022,'feather',h)
    mesh('Hooked eagle beak',[(-.055,1.88,.105),(.055,1.88,.105),(-.04,1.82,.15),(.04,1.82,.15),(0,1.83,.26),(0,1.77,.19)],[(0,1,4),(0,4,2),(1,3,4),(2,4,5),(3,5,4),(2,5,3)],'bone',h)
    cloth('Ivory long tabard',(0,1.02,.16),(0,.13,.19),.18,.28,'linen',root)
    for s in [-1,1]:
        tube('Tabard embroidered border',[(s*(.15+t*.10),1.00-t*.85,.205) for t in np.linspace(0,1,25)],.006,'blackmetal',root)
        for j in range(4):
            mesh('Tabard diamond',[(s*.11,.52+j*.11,.21),(s*.11+.025,.49+j*.11,.21),(s*.11,.46+j*.11,.21),(s*.11-.025,.49+j*.11,.21)],[(0,1,2,3)],'blackmetal',root)
        for j in range(15):
            a=(s*.25,1.43-j*.018,-.15)
            tip=(s*(.42+j*.027),1.10-j*.048,-.24-j*.008)
            feather('Folded wing flight feather',a,tip,.055,'wing',b)
    shield=empty('shieldHolder',(-.36,1.03,.04),p['armL']);p['shieldHolder']=shield
    verts=[(-.63,.47,.15),(-.19,.47,.15),(-.16,1.54,.14),(-.40,1.66,.17),(-.66,1.54,.14),(-.41,1.02,.245)]
    mesh('Tall kite greatshield',verts,[(0,1,5),(1,2,5),(2,3,5),(3,4,5),(4,0,5)],'silver',shield)
    tube('Shield dark rim',[verts[i] for i in [0,1,2,3,4,0]],.022,'blackmetal',shield)
    relief('Shield flowing engraving',(-.41,1.06,.24),.25,.7,'rune',shield,9)
    wh=p['weaponHolder'];x=.305*w
    rod('Halberd haft',(x,.25,.055),(x,2.23,.055),.022,'blackmetal',wh)
    for y in [.40,.9,1.25,1.9,2.15]:rod('Halberd silver collar',(x,y,.055),(x,y+.035,.055),.031,'silver',wh)
    mesh('Halberd crescent blade',[(x,1.9,.055),(x+.26,1.98,.055),(x+.32,2.21,.055),(x+.16,2.36,.055),(x+.07,2.19,.055),(x,2.17,.055)],[(0,1,2,3,4,5)],'silver',wh)
    rod('Halberd spear',(x,2.19,.055),(x,2.52,.055),.04,'silver',wh,r2=0)
    return p

def raider():
    p,w,arm=base('raider');b=p['body'];h=p['head'];root=p['root']
    shell('Raider layered leather cuirass',[(1.01,.21,.145,0),(1.18,.27,.18,0),(1.43,.30,.16,0),(1.52,.18,.10,0)],'blackmetal',b)
    for s in [-1,1]:
        ell('Fur shoulder mantle',(s*.30,1.49,-.02),(.21,.11,.22),'fur',b)
        for j in range(17):
            x=s*(.19+random.random()*.30);y=1.54-random.random()*.13;z=-.12+random.random()*.25
            feather('Mantle fur lock',(x,y,z),(x+s*.025,y-.16-random.random()*.10,z+.025),.017,'fur',b)
        for j in range(3):
            box('Raider layered straps',(s*(.09+j*.075),1.36,.17),(.045,.32,.025),'leather',b,.008)
            for k in range(5):ell('Strap rivet',(s*(.09+j*.075),1.22+k*.055,.19),(.006,.006,.006),'silver',b,8)
    ell('Human rugged face',(0,1.82,.025),(.115,.145,.105),'skin',h)
    ell('Raider iron skullcap',(0,1.91,-.01),(.145,.105,.145),'blackmetal',h)
    for s in [-1,1]:
        hornpts=[(s*(.09+.23*t),1.94+.26*math.sin(t*math.pi*.72),-.015-.17*t) for t in np.linspace(0,1,15)]
        for j in range(len(hornpts)-1):rod('Curved ram horn',hornpts[j],hornpts[j+1],.049*(1-j/17),'bone',h,r2=.049*(1-(j+1)/17))
        tube('Raider visor brow',[(s*.01,1.88,.125),(s*.09,1.90,.12),(s*.13,1.87,.055)],.021,'bone',h)
        for j in range(12):
            x=s*(.012+j*.006)
            tube('Grey braided beard',[(x,1.78,.116),(x*1.1,1.67,.14),(x*.65,1.59+random.random()*.03,.10)],.006,'hair',h)
    cloth('Raider fur kilt',(0,1.0,.10),(0,.59,.14),.23,.30,'fur',root)
    for j in range(24):
        a=j/24*math.tau
        feather('Hanging fur',(.22*math.cos(a),.97,.13*math.sin(a)),(.29*math.cos(a),.54+random.random()*.08,.17*math.sin(a)),.021,'fur',root)
    band('Raider heavy belt',1.05,.23,.17,'leather',b)
    tube('Keyhole breast sigil',[(.10*math.cos(a),1.21+.10*math.sin(a),.196) for a in np.linspace(0,math.tau,40)],.018,'edge',b)
    mesh('Keyhole stem',[(-.025,1.15,.199),(.025,1.15,.199),(.07,1.06,.199),(-.07,1.06,.199)],[(0,1,2,3)],'edge',b)
    wh=p['weaponHolder'];x=.305*w
    rod('Great axe leather haft',(x,.67,.055),(x,1.93,.055),.035,'leather',wh)
    ell('Axe pommel',(x,.68,.055),(.06,.07,.055),'silver',wh)
    for s in [-1,1]:
        verts=[(x+s*.035,1.75,.055),(x+s*.22,1.69,.055),(x+s*.36,1.77,.055),(x+s*.38,2.05,.055),(x+s*.19,2.15,.055),(x+s*.035,2.04,.055)]
        mesh('Heavy double axe blade',verts,[tuple(range(6))],'silver',wh)
        tube('Axe sharpened edge',[verts[j] for j in [1,2,3,4]],.011,'rune',wh)
    return p

def recluse():
    p,w,arm=base('hermit');b=p['body'];h=p['head'];root=p['root']
    shell('Fitted witch bodice',[(.98,.15,.10,0),(1.20,.145,.105,0),(1.42,.185,.105,0),(1.50,.16,.08,0)],'darkcloth',b)
    cloth('Layered charcoal skirt',(0,1.02,0),(0,.08,.01),.17,.30,'darkcloth',root,.055)
    cloth('Back skirt',(0,1.02,-.09),(0,.09,-.16),.16,.29,'darkcloth',root,.04)
    cloth('Plum diagonal overskirt',(.02,1.01,.11),(-.06,.34,.22),.17,.22,'purple',root,.025)
    for s in [-1,1]:
        ar=p['armL' if s<0 else 'armR'];x=s*.285*w
        cloth('Draped wide sleeve',(x,1.38,-.01),(x+s*.055,.77,.05),.075,.135,'purple',ar,.018)
        for j in range(7):
            tube('Sleeve embroidered seam',[(x+s*.11+math.sin(t*12+j)*.006, .81+t*.32, .073) for t in np.linspace(0,1,18)],.0024,'rune',ar)
    ell('Witch face',(0,1.79,.025),(.092,.132,.087),'witchskin',h,24)
    for s in [-1,1]:
        ell('Recluse eye',(s*.038,1.81,.101),(.018,.008,.006),'hair',h,12)
        for j in range(15):
            x=s*(.056+j*.0034);z=.018-j*.006
            pts=[(x,1.9,z),(x+s*.02,1.70,z-.01),(x+s*.04,1.49,z-.025),(x+s*.03+math.sin(j)*.02,1.31+random.random()*.08,z+.01)]
            tube('Long white hair strand',pts,.005,'hair',h)
    # Asymmetric, bent brim and tall hooked cone, both real mesh geometry.
    steps=64;verts=[]
    for radius in [.10,.25,.42]:
        for j in range(steps):
            a=j/steps*math.tau
            verts.append((math.cos(a)*radius,1.92+math.sin(a*2+.7)*.07*(radius/.42)+math.cos(a)*.025,math.sin(a)*radius*.75))
    faces=[]
    for k in range(2):
        for j in range(steps):faces.append((k*steps+j,k*steps+(j+1)%steps,(k+1)*steps+(j+1)%steps,(k+1)*steps+j))
    mesh('Sweeping asymmetric witch brim',verts,faces,'purple',h)
    shell('Tall bent witch crown',[(1.92,.145,.115,0),(2.05,.12,.09,0),(2.23,.08,.065,-.018),(2.39,.035,.03,-.05),(2.43,.007,.01,-.10)],'darkcloth',h,36)
    for j in range(3):
        tube('Spiral plum hat ribbon',[(math.cos(a)*(.14-.006*a),1.96+a*.025,math.sin(a)*(.11-.004*a)) for a in np.linspace(j*math.tau,(j+1)*math.tau,80)],.013,'purple',h)
    relief('Bodice silver embroidery',(0,1.40,.113),.21,.12,'rune',b,9)
    wh=p['weaponHolder'];x=.305*w
    tube('Gnarled staff',[(x,.23,.055),(x+.03,.64,.055),(x-.025,1.15,.055),(x+.01,1.68,.055),(x+.07,1.94,.055)],.021,'leather',wh)
    tube('Twisted staff branch',[(x+.01,1.62,.055),(x-.13,1.79,.055),(x-.11,1.99,.055),(x+.02,2.08,.055),(x+.13,2.0,.055),(x+.07,1.94,.055)],.025,'edge',wh)
    ell('Green staff gemstone',(x+.005,1.94,.055),(.055,.095,.044),'gem',wh)
    return p

def combine_rigid_meshes(root):
    # Keep articulated empty pivots. Merge mesh pieces per parent and material
    # so ornamental geometry does not produce hundreds of draw calls.
    groups={}
    for obj in list(root.children_recursive):
        if obj.type=='MESH':
            key=(obj.parent,obj.data.materials[0] if obj.data.materials else None)
            groups.setdefault(key,[]).append(obj)
    for (parent,mat),items in groups.items():
        if len(items)<2:continue
        bpy.ops.object.select_all(action='DESELECT')
        for obj in items:obj.select_set(True)
        bpy.context.view_layer.objects.active=items[0]
        bpy.ops.object.join()
        items[0].name=parent.name+'_'+mat.name.replace(' ','_')

def hierarchy(root):return [root]+list(root.children_recursive)

def export(p,kind):
    root=p['root'];combine_rigid_meshes(root)
    bpy.context.view_layer.update()
    for obj in hierarchy(root):
        if obj.type=='MESH':
            bm=bmesh.new();bm.from_mesh(obj.data)
            bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
            bm.to_mesh(obj.data);bm.free()
    bpy.ops.object.select_all(action='DESELECT')
    for obj in hierarchy(root):obj.select_set(True)
    bpy.context.view_layer.objects.active=root
    target=os.path.join(OUT,kind+'.glb')
    bpy.ops.export_scene.gltf(filepath=target,export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False)
    triangles=sum(sum(len(poly.vertices)-2 for poly in o.data.polygons) for o in hierarchy(root) if o.type=='MESH')
    heights=[(o.matrix_world@Vector(corner)).z for o in hierarchy(root) if o.type=='MESH' for corner in o.bound_box]
    return {'id':kind,'file':'assets/models/'+kind+'.glb','triangles':triangles,'meshCount':sum(o.type=='MESH' for o in hierarchy(root)),'bytes':os.path.getsize(target),'height':round(max(heights)-min(heights),3)}

builders=[('executioner',executor),('guardian',guardian),('rogue',raider),('hermit',recluse)]
models=[];roots=[]
for index,(kind,builder) in enumerate(builders):
    # Names in each glTF must be stable, independent of Blender's .001 suffixes.
    before=set(bpy.data.objects)
    p=builder();p['root']['classId']=kind
    for name in ['body','head','armL','armR','legL','legR','weaponHolder']:
        p[name].name=name
        p[name]['part']=name
    if 'shieldHolder' in p:p['shieldHolder']['part']='shieldHolder'
    info=export(p,kind);models.append(info)
    for obj in hierarchy(p['root']):
        if obj.type=='EMPTY':obj.name=kind+'_'+obj.name
    p['root'].location.x=index*2.3-3.45
    roots.append(p['root'])
    print('MODEL',json.dumps(info),flush=True)

# Studio scene, retained in the editable .blend file.
bpy.context.scene.render.engine='CYCLES'
bpy.context.scene.cycles.samples=32
bpy.context.scene.world.color=(.10,.10,.10)
floor_mat=material('Studio slate',(.028,.036,.046),.15,.55)
box('Studio plinth',(0,-.065,0),(11,.12,3.0),floor_mat,None,.04)
def area(name,pos,power,size,color):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.location=xyz(pos)
    obj.rotation_euler=(xyz((0,1.1,0))-obj.location).to_track_quat('-Z','Y').to_euler()
area('Warm key',(-3,6,5),1700,5,(1,.82,.64))
area('Cool fill',(4,4,3),1400,5,(.65,.78,1))
area('Rim',(0,5,-3),2100,4,(.75,.85,1))
camera_data=bpy.data.cameras.new('Lineup Camera');camera=bpy.data.objects.new('Lineup Camera',camera_data);bpy.context.collection.objects.link(camera)
camera.location=xyz((4.9,3.5,10));camera.rotation_euler=(xyz((0,1.1,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.type='ORTHO';camera_data.ortho_scale=10.4;bpy.context.scene.camera=camera
scene=bpy.context.scene;scene.render.resolution_x=1600;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BLEND,'nightfarers.blend'))
scene.render.filepath=os.path.join(PREVIEW,'lineup.png')
bpy.ops.render.render(write_still=True)
with open(os.path.join(OUT,'manifest.json'),'w',encoding='utf-8') as f:json.dump({'generator':'Blender '+bpy.app.version_string,'models':models},f,ensure_ascii=False,indent=2)
print('BUILD COMPLETE',flush=True)
