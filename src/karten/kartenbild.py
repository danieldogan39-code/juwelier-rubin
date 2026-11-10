# Kartenbilder für „Aus unseren Vitrinen“ (Startseite): Produktfoto auf hellem Grund.
# Der Grund wird eben gerechnet und auf Weiß gesetzt; in der Karte liegt das Bild multipliziert über dem Kartenton
# (CSS .coll.is-shot), so geht der Grund nahtlos in der Karte auf und der Schatten bleibt erhalten.
# Aufruf: python3 src/karten/kartenbild.py
import os
import numpy as np
from PIL import Image
S=os.path.dirname(os.path.abspath(__file__))+'/'; R=S+'../../assets/img/'
def flat_white(im,frame=0.045,white=250.0,punch=1.0):
    a=np.asarray(im).astype(np.float64); h,w,_=a.shape
    yy,xx=np.mgrid[0:h,0:w]; x=xx/w-0.5; y=yy/h-0.5
    m=(xx<w*frame)|(xx>=w*(1-frame))|(yy<h*frame)|(yy>=h*(1-frame))
    B=np.stack([np.ones_like(x),x,y,x*x,y*y,x*y],-1)
    out=np.empty_like(a)
    for c in range(3):
        k,*_=np.linalg.lstsq(B[m][::7],a[...,c][m][::7],rcond=None)
        out[...,c]=a[...,c]/(B@k)*255.0*(255.0/white)
    out=255.0-(255.0-out)*punch  # Kontrast vom Weiß aus strecken, damit feine Ketten nicht verblassen
    return Image.fromarray(np.clip(out,0,255).astype(np.uint8))
def cut(im,box):
    w,h=im.size; return im.crop((round(box[0]*w),round(box[1]*h),round(box[2]*w),round(box[3]*h)))
JOBS=[
 # (Vorlage, Zielname, Ausschnitt in Anteilen, Breiten, Kontrast)
 ('trauringe.jpg','k-trauringe',(0.19,0.08,0.83,0.79),(600,1000,1300),1.0),
 ('schmuck.jpg','k-schmuck',(0.045,0.08,0.975,0.62),(900,1400,2000),1.35),
 ('schmuck.jpg','k-schmuck-s',(0.335,0.06,0.975,0.63),(600,1000,1400),1.35),
]
for src,name,box,ws,punch in JOBS:
    im=cut(flat_white(Image.open(S+src).convert('RGB'),punch=punch),box)
    a=np.asarray(im); e=np.concatenate([a[:6].reshape(-1,3),a[-6:].reshape(-1,3),a[:,:6].reshape(-1,3),a[:,-6:].reshape(-1,3)])
    print(name,im.size,'Rand min',e.min(0),'Mittel',e.mean(0).round(1))
    for W in ws:
        o=im.resize((W,round(W*im.height/im.width)),Image.LANCZOS)
        o.save(f'{R}{name}-{W}.avif',quality=64,speed=4); o.save(f'{R}{name}-{W}.webp',quality=84,method=6)
