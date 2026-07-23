#!/usr/bin/env python3
"""Busca múltiplos vídeos no YouTube para cada hino, ordenados por prioridade:
1. CCB (Congregação Cristã no Brasil)
2. IASD / Adventista
3. Lyrics / Playback / Instrumental
4. Outros
Mantém no máximo 3 por hino.
"""

import json
import os
import subprocess
import time
import re

HINOS_DIR = "public/data/hinos"
ES_DIR = "public/data/hinos/es"
INDEX_PATH = "public/data/hymns-index.json"
INDEX_ES_PATH = "public/data/hymns-index-es.json"

def search_youtube(query, max_results=10):
    try:
        cmd = [
            "yt-dlp",
            "--flat-playlist",
            "-J",
            "--default-search", "ytsearch",
            f"ytsearch{max_results}:{query}",
            "--no-warnings",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return []
        data = json.loads(result.stdout)
        entries = data.get("entries", [])
        videos = []
        for entry in entries:
            video_id = entry.get("id", "")
            title = entry.get("title", "")
            if video_id:
                videos.append({
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "title": title
                })
        return videos
    except:
        return []

def score_video(video, titulo_hino):
    title_lower = video["title"].lower()
    score = 0
    
    # CCB (Congregação Cristã no Brasil) - maior prioridade
    if any(kw in title_lower for kw in ["ccb", "congregação cristã", "congregacao crista"]):
        score = 100
    
    # IASD / Adventista
    elif any(kw in title_lower for kw in ["adventista", "iasd", "hinário adventista", "hinario adventista", "novo hinário", "novo hinario", "hino adventista"]):
        score = 80
    
    # Lyrics / Playback / Instrumental / Karaokê
    if any(kw in title_lower for kw in ["lyrics", "lyric", "playback", "instrumental", "karaoke", "karaokê", "legenda", "letra"]):
        score += 20
    
    # CCB específico
    if any(kw in title_lower for kw in ["ccb", "congregação cristã", "congregacao crista"]):
        score += 30
    
    return score

def search_youtube(query, max_results=10):
    try:
        cmd = [
            "yt-dlp",
            "--flat-playlist",
            "-J",
            "--default-search", "ytsearch",
            f"ytsearch{max_results}:{query}",
            "--no-warnings",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return []
        data = json.loads(result.stdout)
        entries = data.get("entries", [])
        videos = []
        for entry in entries:
            video_id = entry.get("id", "")
            title = entry.get("title", "")
            if video_id:
                videos.append({
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "title": title
                })
        return videos
    except:
        return []

def process_hinos(lang, hinos_dir, index_path, search_prefix):
    with open(index_path, 'r', encoding='utf-8') as f:
        index = json.load(f)
    
    total = len(index)
    encontrados = 0
    erros = []
    
    for i, hino in enumerate(index):
        numero = hino["numero"]
        titulo = hino["titulo"]
        filepath = os.path.join(hinos_dir, f"{numero:03d}.json")
        
        if not os.path.exists(filepath):
            print(f"Arquivo {numero:03d}.json não encontrado")
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"[{i+1}/{len(index)}] {lang.upper()} {numero:03d} - {titulo}...", end=" ", flush=True)
        
        # Buscar até 10 resultados
        query = f"Hinário Adventista {titulo}"
        videos = search_youtube(query, max_results=10)
        
        if not videos:
            print("✗ Nada encontrado")
            continue
        
        # Classificar e ordenar
        scored = []
        for v in videos:
            t = v["title"].lower()
            score = 0
            if any(kw in t for kw in ["ccb", "congregação cristã", "congregacao crista"]):
                score = 100
            elif any(kw in t for kw in ["adventista", "iasd", "hinário adventista", "hinario adventista", "novo hinário", "novo hinario"]):
                score = 80
            if any(kw in t for kw in ["lyrics", "lyric", "playback", "instrumental", "karaoke", "karaokê", "legenda", "letra"]):
                score += 15
            scored.append((score, v))
        
        scored.sort(key=lambda x: -x[0])
        top_videos = [v for _, v in scored[:3]]
        
        if top_videos:
            data["videos"] = top_videos
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✓ {len(top_videos)} vídeos")
            encontrados += 1
        else:
            print("✗ Nada encontrado")
            erros.append(numero)
        
        time.sleep(0.5)
    
    print(f"\n\nResumo:")
    print(f"Total: {total}")
    print(f"Encontrados: {encontrados}")
    print(f"Erros: {len(erros)}")
    if erros:
        print(f"Hinos com erro: {erros}")

if __name__ == "__main__":
    base_dir = os.path.join(os.path.dirname(__file__), "..")
    
    print("=== Processando hinos em PORTUGUÊS ===")
    process_hinos(
        "pt",
        os.path.join(base_dir, "public", "data", "hinos"),
        os.path.join(base_dir, "public", "data", "hymns-index.json"),
        "Hinário Adventista"
    )
    
    print("\n\n=== Processando hinos em ESPANHOL ===")
    process_hinos(
        "es",
        os.path.join(base_dir, "public", "data", "hinos", "es"),
        os.path.join(base_dir, "public", "data", "hymns-index-es.json"),
        "Himnario Adventista"
    )