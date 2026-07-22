#!/usr/bin/env python3
import json, os, glob

def verificar(dir_path, label):
    files = sorted(glob.glob(os.path.join(dir_path, '*.json')))
    stats = {"0": 0, "1": 0, "2": 0, "3": 0}
    sem = []
    for f in files:
        if os.path.basename(f) == 'video-selector.html':
            continue
        with open(f) as fh:
            data = json.load(fh)
        n = len(data.get("videos", []))
        stats[str(n)] = stats.get(str(n), 0) + 1
        if n == 0:
            sem.append(os.path.basename(f))
    
    print(f"\n{label}:")
    print(f"  Total: {len(files)}")
    print(f"  Com 3 vídeos: {stats.get('3', 0)}")
    print(f"  Com 2 vídeos: {stats.get('2', 0)}")
    print(f"  Com 1 vídeo:  {stats.get('1', 0)}")
    print(f"  Sem vídeo:    {stats.get('0', 0)}")
    if sem:
        print(f"  Faltam: {sem}")

verificar("public/data/hinos", "PT")
verificar("public/data/hinos/es", "ES")
