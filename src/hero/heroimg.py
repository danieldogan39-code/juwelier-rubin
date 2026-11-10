# Erzeugt die Hero-Szenen (quer 16:9 und hoch 9:16) als avif/webp. Vorläufige Bilder aus dem Bestand.
# Liegt ein fertiges Bild in diesem Ordner (<slug>-l.png|jpg für quer, <slug>-p.png|jpg für hoch), wird nur noch skaliert.
# Aufruf: python3 src/hero/heroimg.py
import os, sys
from PIL import Image, ImageFilter
R=os.path.dirname(os.path.abspath(__file__))+'/../../assets/img/'; S=os.path.dirname(os.path.abspath(__file__))+'/'
V=(14,11,11)
def src(n): return Image.open(R+n+'.webp').convert('RGB')
def fit(im,w,h): return im.resize((w,h),Image.LANCZOS)
def fade_down(canvas,y0,y1):
    # blendet ab y0 weich in Samt über
    w,h=canvas.size; g=Image.new('L',(1,h),0)
    for y in range(h): g.putpixel((0,y),0 if y<y0 else 255 if y>=y1 else int(255*((y-y0)/(y1-y0))**1.4))
    canvas.paste(Image.new('RGB',(w,h),V),(0,0),g.resize((w,h)))
    return canvas
def portrait(sq,top=0,size=1080,H=1920,f0=0.5,f1=0.86):
    c=Image.new('RGB',(size,H),V); c.paste(fit(sq,size,int(size*sq.height/sq.width)),(0,top))
    return fade_down(c,int(H*f0),int(H*f1))
def ready(slug,k):
    for e in ('png','jpg','jpeg','webp'):
        p=S+f'{slug}-{k}.{e}'
        if os.path.exists(p): return Image.open(p).convert('RGB')
out={}
# Trauringe
a=src('bg-haende-2560'); out['trauringe']=(a, portrait(a.crop((560,0,2000,1440)),top=40))
# Schmuck: schwarzer Grund wird nach links fortgesetzt, damit die Steine rechts vom Text liegen
a=src('bg-diamanten-2560'); L=Image.new('RGB',(2560,1440),(0,0,0)); q=a.crop((1280,0,2560,1024)); L.paste(fit(q,1408,1126),(1152,110))
c=Image.new('RGB',(1080,1920),(0,0,0)); q=a.crop((1400,0,2480,1024)); c.paste(fit(q,1080,1024),(0,70)); out['schmuck']=(L,c)
# Uhren: freigestellte Stahl-Chronographen auf dunklem Grund mit warmem Lichtschein und Spiegelung
def watch_stage(W,H,ww,x,y):
    import math
    g=Image.new('L',(64,64),0)
    for j in range(64):
        for i in range(64):
            d=math.hypot((i-32)/32,(j-30)/26); g.putpixel((i,j),int(255*max(0,1-d)**1.6))
    bg=Image.new('RGB',(W,H),V); glow=Image.new('RGB',(W,H),(92,58,40))
    m=Image.new('L',(W,H),0); gw=int(ww*1.9); m.paste(g.resize((gw,int(gw*0.8)),Image.BICUBIC),(x+ww//2-gw//2,y-int(gw*0.12)))
    bg.paste(glow,(0,0),m)
    w=Image.open(R+'p-uhren-1600.webp').convert('RGBA'); wh=int(ww*w.height/w.width); w=w.resize((ww,wh),Image.LANCZOS)
    # Spiegelung: gekippt, gestaucht, nach unten ausgeblendet
    rf=w.transpose(Image.FLIP_TOP_BOTTOM).resize((ww,int(wh*0.5)),Image.LANCZOS).filter(ImageFilter.GaussianBlur(ww/260))
    fade=Image.new('L',(1,rf.height),0)
    for j in range(rf.height): fade.putpixel((0,j),int(70*max(0,1-j/(rf.height*0.7))**1.5))
    al=Image.composite(fade.resize(rf.size),Image.new('L',rf.size,0),rf.getchannel('A')); rf.putalpha(al)
    floor=y+wh-int(wh*0.035)
    bg.paste(rf,(x,floor),rf); bg.paste(w,(x,y),w)
    return bg
L=watch_stage(2560,1440,1180,1270,150)
out['uhren']=(L, fade_down(watch_stage(1080,1920,1000,40,150),int(1920*0.6),int(1920*0.82)))
# Goldankauf
a=src('gold-2048'); out['goldankauf']=(a.crop((0,106,2048,1258)), portrait(a.crop((340,0,1705,1365)),top=20))
# Werkstatt (gespiegelt, damit der Text links frei steht) – nur 768 px breit, daher weich
a=src('ph-lupe-768').transpose(Image.FLIP_LEFT_RIGHT); out['werkstatt']=(a.crop((0,40,768,472)), portrait(a.crop((256,0,768,512)),top=30))
for slug,(L,P) in out.items():
    L=ready(slug,'l') or L; P=ready(slug,'p') or P
    for k,im,ws,ar in (('l',L,(1280,1920,2560),9/16),('p',P,(720,1080),16/9)):
        # auf das Zielformat beschneiden (mittig)
        w,h=im.size; th=int(w*ar)
        if th<h: im=im.crop((0,(h-th)//2,w,(h-th)//2+th))
        elif th>h: tw=int(h/ar); im=im.crop(((w-tw)//2,0,(w-tw)//2+tw,h))
        for W in ws:
            o=fit(im,W,int(W*ar))
            o.save(f'{R}hero-{slug}-{k}-{W}.avif',quality=62,speed=4); o.save(f'{R}hero-{slug}-{k}-{W}.webp',quality=82,method=6)
    print(slug,L.size,P.size)
