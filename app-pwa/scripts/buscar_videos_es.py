#!/usr/bin/env python3
"""Busca vídeos no YouTube para cada hino em espanhol e atualiza os JSONs."""

import json
import os
import subprocess
import time

def search_youtube(query, max_results=1):
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

import json, os, subprocess, time

hinos_es_dir = os.path.join(os.path.dirname(__file__), "..", "public", "data", "hinos", "es")
index_path = os.path.join(os.path.dirname(__file__), "..", "public", "data", "hymns-index-es.json")

with open(index_path, 'r', encoding='utf-8') as f:
    index = json.load(f)

total = len(index)
encontrados = 0
erros = []

for i, hino in enumerate(index):
    numero = hino["numero"]
    titulo = hino["titulo"]
    filepath = os.path.join(hinos_es_dir, f"{numero:03d}.json")
    
    if not os.path.exists(filepath):
        print(f"Arquivo {numero:03d}.json não encontrado")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "videos" in data and len(data["videos"]) > 0:
        print(f"[{i+1}/196] Hino {numero:03d} ES - {titulo}: já tem vídeo(s), pulando")
        continue
    
    print(f"[{i+1}/196] Buscando ES: {numero:03d} - {titulo}...", end=" ", flush=True)
    
    query = f"Himnario Adventista {titulo}"
    try:
        cmd = [
            "yt-dlp",
            "--flat-playlist",
            "-J",
            "--default-search", "ytsearch",
            f"ytsearch1:{query}",
            "--no-warnings",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            entries = data.get("entries", [])
            videos = []
            for entry in entries[:1]:
                video_id = entry.get("id", "")
                title = entry.get("title", "")
                if video_id:
                    videos.append({
                        "url": f"https://www.youtube.com/watch?v={video_id}",
                        "title": title
                    })
        
        if videos:
            data["videos"] = videos
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"[{i+1}/196] Buscando ES: {numero:03d} - {titulo}... ✓ {videos[0]['url']}")
            encontrados += 1
        else:
            print(f"[{i+1}/196] Buscando ES: {numero:03d} - {titulo}... ✗ Não encontrado")
            erros.append(numero)
    except Exception as e:
        print(f"[{i+1}/196] Buscando ES: {numero:03d} - {titulo}... ✗ Erro: {e}")
        erros.append(numero)
    
    time.sleep(0.5)

print(f"\n\nResumo ES:")
print(f"Total: {total}")
print(f"Encontrados: {encontrados}")
print(f"Erros: {len(erros)}")
if erros:
    print(f"Hinos com erro: {erros}")