#!/usr/bin/env python3
import json, os, subprocess, time, glob, re

STOPWORDS = {'de', 'da', 'do', 'das', 'dos', 'a', 'e', 'o', 'que', 'em', 'no', 'na',
             'nos', 'nas', 'para', 'por', 'com', 'se', 'é', 'um', 'uma', 'uns', 'umas',
             'ao', 'aos', 'à', 'às', 'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles',
             'elas', 'meu', 'meus', 'minha', 'minhas', 'teu', 'teus', 'tua', 'tuas',
             'seu', 'seus', 'sua', 'suas', 'nosso', 'nossa', 'nossos', 'nossas',
             'mas', 'porque', 'pois', 'quando', 'onde', 'quem', 'qual', 'mais',
             'todo', 'toda', 'todos', 'todas', 'este', 'esta', 'estes', 'estas',
             'esse', 'essa', 'esses', 'essas', 'aquele', 'aquela', 'aqueles',
             'isto', 'isso', 'aquilo', 'muito', 'pouco', 'algum', 'alguma',
             'outro', 'outra', 'mesmo', 'mesma', 'também', 'ainda', 'já',
             'sim', 'não', 'nem', 'até', 'sem', 'após', 'sob', 'sobre', 'entre',
             'desde', 'são', 'era', 'foi', 'ser', 'ter', 'tem', 'têm',
             'está', 'estão', 'pode', 'podem', 'deve', 'devem'}

BAD_WORDS = ['pregação', 'sermão', 'estudo', 'palestra', 'culto', 'mensagem',
             'playlist', 'coletânea', 'coletanea', 'medley', 'ao vivo', 'aovivo',
             'clipe oficial', 'dvd', 'cd completo']

def search_yt(query, max_results=8):
    try:
        cmd = ["yt-dlp", "--flat-playlist", "-J", "--default-search", "ytsearch",
               f"ytsearch{max_results}:{query}", "--no-warnings"]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if r.returncode != 0: return []
        d = json.loads(r.stdout)
        return [{"url": f"https://www.youtube.com/watch?v={e['id']}", "title": e.get("title","")}
                for e in d.get("entries",[]) if e.get("id")]
    except Exception as e:
        return []

def validar_video(vt, titulo_original):
    vt = vt.lower()
    if any(bw in vt for bw in BAD_WORDS):
        return False
    titulo_clean = re.sub(r'^\d+\s*[-–]\s*', '', titulo_original)
    titulo_words = set(re.sub(r'[^\w\sáàâãéèêíïóôõöúçñ]', ' ', titulo_clean.lower()).split())
    titulo_words = {w for w in titulo_words if w not in STOPWORDS and len(w) > 2}
    matches = sum(1 for w in titulo_words if w in vt)
    tem_hinario = any(kw in vt for kw in ["himnario", "himnario", "adventista", "hcc", "harpa"])
    if matches >= 2:
        return True
    if matches >= 1 and tem_hinario:
        return True
    if len(titulo_words) > 0 and matches / len(titulo_words) >= 0.6:
        return True
    return False

hinos_dir = os.path.join(os.path.dirname(__file__), "..", "public/data/hinos/es")
index_path = os.path.join(os.path.dirname(__file__), "..", "public/data/hymns-index-es.json")

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
    
    print(f"[{i+1}/196] ES {numero:03d} - {titulo[:50]}...", end=" ", flush=True)
    
    titulo_clean = re.sub(r'^\d+\s*[-–]\s*', '', titulo)
    queries = [
        f'"{titulo_clean}" Himnario Adventista',
        f'"{titulo_clean}"',
        f'{titulo_clean} Himnario Adventista',
        f'{titulo_clean} letra',
    ]
    
    all_videos = []
    seen = set()
    for q in queries:
        vids = search_yt(q, 6)
        for v in vids:
            if v["url"] not in seen:
                seen.add(v["url"])
                all_videos.append(v)
        if len(seen) >= 12:
            break
    
    validos = []
    for v in all_videos:
        if not validar_video(v["title"], titulo):
            continue
        vt = v["title"].lower()
        score = 0
        if any(kw in vt for kw in ["himnario adventista", "himno adventista"]):
            score += 25
        if any(kw in vt for kw in ["lyrics", "lyric", "letra"]):
            score += 15
        validos.append((score, v))
    
    if not validos:
        # Fallback: tenta sem validacao rigorosa, busca pelo titulo completo
        vids = search_yt(f'"{titulo_clean}"', 3)
        for v in vids:
            vt = v["title"].lower()
            if any(bw in vt for bw in BAD_WORDS):
                continue
            # Aceita se tiver pelo menos 1 palavra significativa
            titulo_words = set(re.sub(r'[^\w\sáàâãéèêíïóôõöúçñ]', ' ', titulo_clean.lower()).split())
            titulo_words = {w for w in titulo_words if w not in STOPWORDS and len(w) > 2}
            matches = sum(1 for w in titulo_words if w in vt)
            if matches >= 1:
                validos.append((10, v))
    
    if not validos:
        print("✗ Nada válido")
        continue
    
    validos.sort(key=lambda x: -x[0])
    top3 = [v for _, v in validos[:3]]
    
    final = []
    seen_urls = set()
    for v in top3:
        if v["url"] not in seen_urls:
            seen_urls.add(v["url"])
            final.append(v)
    
    data["videos"] = final[:3]
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✓ {len(final)} vídeos")
    time.sleep(0.3)

print("\nES Concluído!")
