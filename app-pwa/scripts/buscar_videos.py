#!/usr/bin/env python3
"""Busca vídeos no YouTube para cada hino e atualiza os JSONs."""

import json
import os
import re
import subprocess
import sys
import time

HINOS_DIR = "public/data/hinos"
ES_DIR = "public/data/hinos/es"

def search_youtube(query, max_results=3):
    """Search YouTube using yt-dlp and return video results."""
    try:
        cmd = [
            "yt-dlp",
            "--flat-playlist",
            "-J",
            "--default-search", "ytsearch",
            f"ytsearch{max_results}:{query}",
            "--no-warnings",
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode != 0:
            return []
        
        import json
        data = json.loads(result.stdout)
        entries = data.get("entries", [])
        videos = []
        for entry in entries[:max_results]:
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

def search_youtube_safe(query, max_results=3):
    try:
        return search_youtube(query, max_results)
    except Exception as e:
        print(f"  Erro: {e}")
        return []

def update_json_file(filepath, videos):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not videos:
        return False
    
    data["videos"] = videos
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return True

def main():
    hinos_dir = os.path.join(os.path.dirname(__file__), "..", "public", "data", "hinos")
    index_path = os.path.join(os.path.dirname(__file__), "..", "public", "data", "hymns-index.json")
    
    with open(index_path, 'r', encoding='utf-8') as f:
        index = json.load(f)
    
    total = len(index)
    encontrados = 0
    ja_tinham = 0
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
        
        if "videos" in data and len(data["videos"]) > 0:
            print(f"[{i+1}/{total}] Hino {numero:03d} - {titulo}: já tem vídeo(s), pulando")
            continue
        
        print(f"[{i+1}/{total}] Buscando: {numero:03d} - {titulo}...", end=" ", flush=True)
        
        query = f"Hinário Adventista {titulo}"
        videos = search_youtube_safe(query, max_results=1)
        
        if videos:
            data["videos"] = videos
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✓ {videos[0]['url']}")
            encontrados += 1
        else:
            print("✗ Não encontrado")
            erros.append(numero)
        
        time.sleep(0.5)  # Rate limiting
    
    print(f"\n\nResumo:")
    print(f"Total: {total}")
    print(f"Encontrados: {encontrados}")
    print(f"Já tinham: {ja_tinham}")
    print(f"Erros: {len(erros)}")
    if erros:
        print(f"Hinos com erro: {erros}")

if __name__ == "__main__":
    main()