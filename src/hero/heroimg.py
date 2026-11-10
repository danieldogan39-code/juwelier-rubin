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
# Uhren: Motiv nach rechts rücken (linker Rand wird fortgesetzt)
a=src('ph-gshock-1500'); a=fit(a,1920,1440); col=a.crop((0,0,2,1440)).resize((640,1440)); L=Image.new('RGB',(2560,1440)); col=col.resize((900,1440)); L.paste(col,(0,0)); L.paste(a,(900,0))
b=src('ph-gshock-1500').crop((190,0,1315,1125)); out['uhren']=(L, portrait(b,top=50,f0=0.52,f1=0.78))
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
