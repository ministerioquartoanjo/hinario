#!/usr/bin/env python3
"""Completa hinos com < 3 videos."""
import json, os, subprocess, time, re

STOPWORDS = {'de', 'da', 'do', 'das', 'dos', 'a', 'e', 'o', 'que', 'em', 'no', 'na',
             'nos', 'nas', 'para', 'por', 'com', 'se', 'é', 'um', 'uma', 'uns', 'umas',
             'ao', 'aos', 'à', 'às', 'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles',
             'elas', 'meu', 'meus', 'minha', 'minhas', 'teu', 'teus', 'tua', 'tuas',
             'seu', 'seus', 'sua', 'suas', 'nosso', 'nossa', 'nossos', 'nossas',
             'mas', 'porque', 'pois', 'quando', 'onde', 'quem', 'qual', 'mais',
             'todo', 'toda', 'todos', 'todas', 'mas', 'sim', 'não', 'nem', 'até',
             'sem', 'após', 'sob', 'sobre', 'entre', 'desde', 'são', 'era', 'foi',
             'ser', 'ter', 'tem', 'têm', 'está', 'estão', 'pode', 'podem',
             'la', 'los', 'las', 'le', 'les', 'del', 'al', 'porque'}

BAD_WORDS = ['pregação', 'sermão', 'estudo', 'palestra', 'culto', 'mensagem',
             'playlist', 'coletânea', 'medley', 'ao vivo', 'sermón', 'predica',
             'estudio', 'mensaje']

def search_yt(query, max_results=8):
    try:
        cmd = ["yt-dlp", "--flat-playlist", "-J", "--default-search", "ytsearch",
               f"ytsearch{max_results}:{query}", "--no-warnings"]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if r.returncode != 0: return []
        d = json.loads(r.stdout)
        return [{"url": f"https://www.youtube.com/watch?v={e['id']}", "title": e.get("title","")}
                for e in d.get("entries",[]) if e.get("id")]
    except: return []

def carregar_canal(filepath):
    videos = []
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if '|' in line:
                vid, title = line.split('|', 1)
                if vid and title and vid != 'Total':
                    videos.append({"url": f"https://www.youtube.com/watch?v={vid}", "title": title})
    return videos

def extrair_palavras(titulo):
    t = re.sub(r'^\d+\s*[-–]\s*', '', titulo)
    t = re.sub(r'[^\w\sáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]', ' ', t.lower())
    return {w for w in t.split() if w not in STOPWORDS and len(w) > 2}

def match_score(video_title, palavras):
    vt = video_title.lower()
    matches = sum(1 for w in palavras if w in vt)
    return matches, matches / len(palavras) if palavras else 0

def extrair_palavras_es(titulo):
    t = re.sub(r'^[\d\s]+', '', titulo)
    t = re.sub(r'(Himnario Adventista|Hinario Adventista)\s+', '', t, flags=re.IGNORECASE)
    t = re.sub(r'[^\w\sáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]', ' ', t.lower())
    return {w for w in t.split() if w not in STOPWORDS and len(w) > 2}

def completar_hino(data, numero, titulo, palavras_fn, query_prefix, canal_videos):
    palavras = palavras_fn(titulo)
    if not palavras: return 0
    
    # URL atuais
    atuais = [v["url"] for v in data.get("videos", [])]
    precisamos = max(0, 3 - len(atuais))
    if precisamos == 0: return 3
    
    # 1. Procura no canal primeiro
    canal_matches = []
    for cv in canal_videos:
        m, r = match_score(cv["title"], palavras)
        if m >= 2 or (m >= 1 and r >= 0.4):
            canal_matches.append((m, cv))
    
    canal_matches.sort(key=lambda x: -x[0])
    add = []
    for _, v in canal_matches:
        if v["url"] not in atuais and len(add) < precisamos:
            add.append(v)
    
    # 2. Busca geral pra completar
    if len(add) < precisamos:
        titulo_clean = re.sub(r'^[\d\s]+[-–]\s*', '', titulo)
        queries = [
            f'"{titulo_clean}" {query_prefix}',
            f'"{titulo_clean}"',
        ]
        
        gerais = []
        seen = set(atuais)
        for q in queries:
            vids = search_yt(q, 6)
            for v in vids:
                if v["url"] not in seen:
                    seen.add(v["url"])
                    gerais.append(v)
            if len(seen) >= 15: break
        
        scored = []
        for v in gerais:
            vt = v["title"].lower()
            if any(bw in vt for bw in BAD_WORDS): continue
            m, r = match_score(v["title"], palavras)
            if m < 1: continue
            if m < 2 and r < 0.3: continue
            score = m * 10
            if any(kw in vt for kw in ["ccb","congregação cristã","hcc","harpa cristã"]): score += 30
            if any(kw in vt for kw in ["adventista","hinário adventista","hinario adventista"]): score += 20
            if any(kw in vt for kw in ["lyrics","lyric","playback","instrumental","letra"]): score += 15
            if any(cv["url"] == v["url"] for cv in canal_videos): score += 50
            scored.append((score, v))
        
        scored.sort(key=lambda x: -x[0])
        for _, v in scored:
            if v["url"] not in atuais and len(add) < precisamos:
                add.append(v)
    
    return add

def processar(dirpath, index_path, prefix, canal_videos):
    with open(index_path, 'r', encoding='utf-8') as f:
        index = json.load(f)
    
    files = sorted(os.listdir(dirpath))
    for fname in files:
        if not fname.endswith('.json') or 'video-selector' in fname: continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        nv = len(data.get("videos", []))
        if nv >= 3: continue
        
        numero = data.get("numero", int(fname.replace('.json','')))
        titulo = data.get("title", "")
        
        fn = extrair_palavras_es if prefix == "Himnario Adventista" else extrair_palavras
        
        print(f"{fname.replace('.json','')}: {nv}v -> ", end="", flush=True)
        novos = completar_hino(data, numero, titulo, fn, prefix, canal_videos)
        
        if novos:
            data["videos"] = data.get("videos", []) + novos
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"{len(data['videos'])}v ✓")
        else:
            print(f"{nv}v ✗")
        
        time.sleep(0.3)

if __name__ == "__main__":
    base = os.path.join(os.path.dirname(__file__), "..")
    canal = carregar_canal("/tmp/denise_falavinha.txt")
    print(f"Canal: {len(canal)} videos\n")
    
    print("=== PT ===")
    processar(
        os.path.join(base, "public/data/hinos"),
        os.path.join(base, "public/data/hymns-index.json"),
        "Hinário Adventista", canal
    )
    
    print("\n=== ES ===")
    processar(
        os.path.join(base, "public/data/hinos/es"),
        os.path.join(base, "public/data/hymns-index-es.json"),
        "Himnario Adventista", canal
    )
    
    print("\nFim")
