# Kartenbilder für „Aus unseren Vitrinen“ (Startseite): Produktfotos auf hellem Grund, die Uhren auf Schwarz.
# Heller Grund wird auf Weiß gesetzt; in der Karte liegt das Bild multipliziert über dem Kartenton (CSS .coll.is-shot),
# so geht der Grund in der Karte auf und Schatten bleiben erhalten. Das Uhrenbild bekommt reines Schwarz und liegt
# aufgehellt („screen“) über der dunklen Karte.
# Aufruf: python3 src/karten/kartenbild.py
import os
import numpy as np
from PIL import Image
S=os.path.dirname(os.path.abspath(__file__))+'/'; R=S+'../../assets/img/'
def to_white(im,white=249.0,punch=1.18):
    a=np.asarray(im).astype(np.float64)
    bg=np.median(a.reshape(-1,3),0)                 # der Grund nimmt den größten Teil des Bildes ein
    out=a/bg*255.0*(255.0/white)
    out=255.0-(255.0-out)*punch                     # Kontrast vom Weiß aus strecken: helles Metall bleibt abgesetzt
    return Image.fromarray(np.clip(out,0,255).astype(np.uint8))
def to_black(im,black=6.0):
    a=np.asarray(im).astype(np.float64)
    return Image.fromarray(np.clip((a-black)*255.0/(255.0-black),0,255).astype(np.uint8))
JOBS=[('trauringe',to_white),('verlobung',to_white),('memoire',to_white),('schmuck',to_white),('uhren',to_black)]
for name,fn in JOBS:
    im=fn(Image.open(S+name+'.png').convert('RGB'))
    for W in (640,im.width):
        o=im if W==im.width else im.resize((W,round(W*im.height/im.width)),Image.LANCZOS)
        o.save(f'{R}k-{name}-{W}.avif',quality=66,speed=4); o.save(f'{R}k-{name}-{W}.webp',quality=86,method=6)
    print(name,im.size)
