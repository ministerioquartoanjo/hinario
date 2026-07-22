#!/usr/bin/env python3
"""Completa os hinos ES que têm menos de 3 vídeos."""
import json, os, subprocess, time, glob

ES_DIR = "public/data/hinos/es"

def search_videos(query, max_results=10):
    try:
        cmd = ["yt-dlp", "--flat-playlist", "-J", "--default-search", "ytsearch",
               f"ytsearch{max_results}:{query}", "--no-warnings"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return []
        data = json.loads(result.stdout)
        return [{"url": f"https://www.youtube.com/watch?v={e['id']}", "title": e.get("title", "")}
                for e in data.get("entries", []) if e.get("id")]
    except:
        return []

files = sorted(glob.glob(os.path.join(ES_DIR, "*.json")))
total = len(files)
processados = 0

for f in files:
    with open(f) as fh:
        data = json.load(fh)
    
    if len(data.get("videos", [])) >= 3:
        continue
    
    titulo_pt = data.get("title", "")
    numero = os.path.basename(f).replace(".json", "")
    
    print(f"ES {numero} - {titulo_pt}: tem {len(data.get('videos', []))} vídeos, buscando mais...", end=" ", flush=True)
    
    # Tenta busca em espanhol
    titulo_es = titulo_pt
    query = f"Himnario Adventista {titulo_es}"
    videos = search_videos(query, 10)
    
    # Classifica
    scored = []
    for v in videos:
        t = v["title"].lower()
        score = 0
        if any(kw in t for kw in ["ccb", "congregação cristã", "congregacao crista"]):
            score = 100
        elif any(kw in t for kw in ["adventista", "himnario adventista", "himno adventista"]):
            score = 80
        if any(kw in t for kw in ["lyrics", "lyric", "playback", "instrumental", "karaoke", "karaokê", "letra"]):
            score += 15
        scored.append((score, v))
    
    scored.sort(key=lambda x: -x[0])
    
    # Junta os existentes com os novos, evita duplicatas por URL
    existing_urls = {v["url"] for v in data.get("videos", [])}
    for _, v in scored:
        if v["url"] not in existing_urls and len(data["videos"]) < 3:
            data["videos"].append(v)
            existing_urls.add(v["url"])
    
    with open(f, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
    
    print(f"agora {len(data['videos'])} vídeos")
    processados += 1
    time.sleep(0.5)

print(f"\nProcessados: {processados}")