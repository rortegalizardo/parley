#!/usr/bin/env python3
"""Generate Parley's two conversation bubbles without external dependencies."""
import pathlib, struct, zlib
root = pathlib.Path(__file__).resolve().parent.parent

def rounded(x, y, l, t, r, b, radius):
    cx, cy = max(l+radius, min(x, r-radius)), max(t+radius, min(y, b-radius))
    return l <= x <= r and t <= y <= b and (x-cx)**2 + (y-cy)**2 <= radius**2

def png(size):
    rows = bytearray()
    for iy in range(size):
        rows.append(0)
        for ix in range(size):
            x, y = (ix+.5)*1024/size, (iy+.5)*1024/size
            color = (0, 0, 0, 0)
            if rounded(x,y,24,24,1000,1000,224): color=(25, int(31+y/80), int(44+y/50),255)
            if rounded(x,y,180,215,705,590,100) or (220<=x<=335 and 550<=y<=700 and y<=920-x): color=(112,210,190,255)
            if rounded(x,y,390,470,850,785,92) or (690<=x<=805 and 750<=y<=870 and y<=x+65): color=(232,228,211,255)
            rows.extend(color)
    def chunk(kind, data): return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(rows))+chunk(b'IEND',b'')
chunks = []
for kind, size in [(b'ic07',128),(b'ic08',256),(b'ic09',512),(b'ic10',1024)]:
    data = png(size)
    chunks.append(kind + struct.pack('!I', len(data)+8) + data)
payload = b''.join(chunks)
(root/'desktop/icon.icns').write_bytes(b'icns' + struct.pack('!I', len(payload)+8) + payload)
