# Erzeugt die Hero-Szenen der Startseite als avif/webp: quer 16:9 (1280/1920/2560) und hoch 9:19,5 (720/1080) – so schmal wie heutige Handys, damit seitlich nichts abgeschnitten wird.
# Vorlage je Szene: <szene>-l.jpg|png in diesem Ordner (quer, Motiv rechts, links dunkel).
# Hochkant: liegt <szene>-p.jpg|png hier, wird sie genommen – sonst entsteht sie aus dem Querformat:
# Ausschnitt um das Motiv, oben angesetzt, nach unten weich in den Samtton auslaufend.
# Aufruf: python3 src/hero/heroimg.py
import os
from PIL import Image
S=os.path.dirname(os.path.abspath(__file__))+'/'; R=S+'../../assets/img/'
V=(14,11,11)
def find(slug,k):
    for e in ('png','jpg','jpeg','webp'):
        p=S+f'{slug}-{k}.{e}'
        if os.path.exists(p): return Image.open(p).convert('RGB')
def cover(im,ar):
    # mittig auf das Seitenverhältnis (Höhe/Breite) beschneiden
    w,h=im.size; th=round(w*ar)
    if th<h: return im.crop((0,(h-th)//2,w,(h-th)//2+th))
    tw=round(h/ar); return im.crop(((w-tw)//2,0,(w-tw)//2+tw,h))
def portrait(im,box,W=1080,H=2340,fade=0.42,top=0):
    # box = Ausschnitt (links, oben, rechts, unten) in Anteilen des Querformats; top = Abstand von oben in px
    w,h=im.size; c=im.crop((round(box[0]*w),round(box[1]*h),round(box[2]*w),round(box[3]*h)))
    ih=round(W*c.height/c.width); c=c.resize((W,ih),Image.LANCZOS)
    out=Image.new('RGB',(W,H),V); out.paste(c,(0,top))
    y0=top+round(ih*(1-fade)); y1=top+ih; g=Image.new('L',(1,H),0)
    for y in range(H):
        a=0 if y<y0 else 255 if y>=y1 else round(255*((y-y0)/(y1-y0))**1.3)
        if top and y<top+top: a=max(a,255 if y<top else round(255*(1-(y-top)/top)))   # oben weich ansetzen
        g.putpixel((0,y),a)
    out.paste(Image.new('RGB',(W,H),V),(0,0),g.resize((W,H)))
    return out
BOX={
 'trauringe':(0.505,0.18,0.955,1.0,250),
 'schmuck':(0.525,0.27,0.925,1.0,210),
 'uhren':(0.455,0.0,0.96,1.0,130),
 'goldankauf':(0.39,0.03,1.0,1.0,240),
 'werkstatt':(0.48,0.08,0.88,1.0),
}
for slug,box in BOX.items():
    L=find(slug,'l'); P=find(slug,'p') or portrait(L,box[:4],top=box[4] if len(box)>4 else 0)
    for k,im,ws,ar in (('l',L,(1280,1920,2560),9/16),('p',P,(720,1080),13/6)):
        im=cover(im,ar)
        for W in ws:
            o=im.resize((W,round(W*ar)),Image.LANCZOS)
            o.save(f'{R}hero-{slug}-{k}-{W}.avif',quality=62,speed=4); o.save(f'{R}hero-{slug}-{k}-{W}.webp',quality=82,method=6)
    print(slug,L.size,P.size)
