#!/usr/bin/env python3
"""Atualiza vídeos priorizando o canal @denisefalavinha."""
import json, os, subprocess, time, glob, re

STOPWORDS = {'de', 'da', 'do', 'das', 'dos', 'a', 'e', 'o', 'que', 'em', 'no', 'na',
             'nos', 'nas', 'para', 'por', 'com', 'se', 'é', 'um', 'uma', 'uns', 'umas',
             'ao', 'aos', 'à', 'às', 'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles',
             'elas', 'meu', 'meus', 'minha', 'minhas', 'teu', 'teus', 'tua', 'tuas',
             'seu', 'seus', 'sua', 'suas', 'nosso', 'nossa', 'nossos', 'nossas',
             'mas', 'porque', 'pois', 'quando', 'onde', 'quem', 'qual', 'mais',
             'todo', 'toda', 'todos', 'todas', 'mas', 'sim', 'não', 'nem', 'até',
             'sem', 'após', 'sob', 'sobre', 'entre', 'desde', 'são', 'era', 'foi',
             'ser', 'ter', 'tem', 'têm', 'está', 'estão', 'pode', 'podem'}

BAD_WORDS = ['pregação', 'sermão', 'estudo', 'palestra', 'culto', 'mensagem',
             'playlist', 'coletânea', 'medley', 'ao vivo']

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
    """Carrega lista de vídeos do canal @denisefalavinha."""
    videos = []
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if '|' in line:
                vid, title = line.split('|', 1)
                if vid and title and vid != 'Total':
                    videos.append({
                        "url": f"https://www.youtube.com/watch?v={vid}",
                        "title": title
                    })
    return videos

def extrair_palavras(titulo):
    t = re.sub(r'^\d+\s*[-–]\s*', '', titulo)
    t = re.sub(r'[^\w\sáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]', ' ', t.lower())
    return {w for w in t.split() if w not in STOPWORDS and len(w) > 2}

def match_score(video_title, palavras_hino):
    vt = video_title.lower()
    matches = sum(1 for w in palavras_hino if w in vt)
    ratio = matches / len(palavras_hino) if palavras_hino else 0
    return matches, ratio

def processar(hinos_dir, index_path, canal_videos):
    with open(index_path, 'r', encoding='utf-8') as f:
        index = json.load(f)
    
    for i, hino in enumerate(index):
        numero = hino["numero"]
        titulo = hino["titulo"]
        filepath = os.path.join(hinos_dir, f"{numero:03d}.json")
        
        if not os.path.exists(filepath):
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        palavras = extrair_palavras(titulo)
        if not palavras:
            continue
        
        print(f"[{i+1}/{len(index)}] {numero:03d} - {titulo[:50]}", end=" ", flush=True)
        
        # 1. Busca no canal @denisefalavinha
        canal_matches = []
        for cv in canal_videos:
            m, r = match_score(cv["title"], palavras)
            if m >= 2 or (m >= 1 and r >= 0.4):
                canal_matches.append((m, cv))
        
        canal_matches.sort(key=lambda x: -x[0])
        top_canal = [v for _, v in canal_matches[:3]]
        
        # 2. Busca geral no YouTube
        titulo_clean = re.sub(r'^\d+\s*[-–]\s*', '', titulo)
        queries = [
            f'"{titulo_clean}" Hinário Adventista',
            f'"{titulo_clean}"',
            f'{titulo_clean} Hinário Adventista',
            f'{titulo_clean} playback',
        ]
        
        gerais = []
        seen = set()
        for q in queries:
            vids = search_yt(q, 6)
            for v in vids:
                if v["url"] not in seen:
                    seen.add(v["url"])
                    gerais.append(v)
            if len(seen) >= 10:
                break
        
        # Filtra e pontua
        validos_gerais = []
        for v in gerais:
            vt = v["title"].lower()
            if any(bw in vt for bw in BAD_WORDS):
                continue
            m, r = match_score(v["title"], palavras)
            if m < 1:
                continue
            if m < 2 and r < 0.3:
                continue
            
            score = m * 10
            if any(kw in vt for kw in ["ccb", "congregação cristã", "hcc", "harpa cristã"]):
                score += 30
            if any(kw in vt for kw in ["adventista", "hinário adventista", "hinario adventista"]):
                score += 20
            if any(kw in vt for kw in ["lyrics", "lyric", "playback", "instrumental", "letra"]):
                score += 15
            # Bônus se for do canal denise
            if any(cv["url"] == v["url"] for cv in canal_videos):
                score += 50
            validos_gerais.append((score, v))
        
        validos_gerais.sort(key=lambda x: -x[0])
        
        # 3. Monta lista final: canal primeiro, depois gerais
        final = []
        seen_urls = set()
        
        for v in top_canal:
            if v["url"] not in seen_urls:
                seen_urls.add(v["url"])
                final.append(v)
        
        for _, v in validos_gerais:
            if v["url"] not in seen_urls and len(final) < 3:
                seen_urls.add(v["url"])
                final.append(v)
        
        if final:
            data["videos"] = final[:3]
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            fonte = "CANAL" if any(v["url"] in {cv["url"] for cv in top_canal} for v in final) else "GERAL"
            print(f"✓ {len(final)}v [{fonte}]")
        else:
            print("✗ Nada")
        
        time.sleep(0.2)

if __name__ == "__main__":
    base = os.path.join(os.path.dirname(__file__), "..")
    
    print("Carregando canal @denisefalavinha...", flush=True)
    canal = carregar_canal("/tmp/denise_falavinha.txt")
    print(f"  {len(canal)} vídeos carregados\n")
    
    print("=== PORTUGUÊS ===")
    processar(
        os.path.join(base, "public/data/hinos"),
        os.path.join(base, "public/data/hymns-index.json"),
        canal
    )
    
    print("\n=== ESPANHOL ===")
    processar(
        os.path.join(base, "public/data/hinos/es"),
        os.path.join(base, "public/data/hymns-index-es.json"),
        canal
    )
    
    print("\nConcluído!")
