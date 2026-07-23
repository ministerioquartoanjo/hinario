#!/usr/bin/env python3
"""Busca inteligente: extrai keywords do título + primeira estrofe, e valida correspondência."""
import json, os, subprocess, time, glob, re

HINOS_DIR = "public/data/hinos"
INDEX_PATH = "public/data/hymns-index.json"

def extract_keywords(title, first_verse):
    """Extrai palavras-chave significativas do título e primeira estrofe."""
    # Título sem número
    title_clean = re.sub(r'^\d+\s*[-–]\s*', '', title)
    
    # Remove pontuação
    text = (title_clean + " " + first_verse).lower()
    text = re.sub(r'[^\w\sáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]', ' ', text)
    
    # Palavras comuns a ignorar
    stopwords = {'de', 'da', 'do', 'das', 'dos', 'a', 'e', 'o', 'que', 'em', 'no', 'na',
                 'nos', 'nas', 'para', 'por', 'com', 'se', 'é', 'um', 'uma', 'uns', 'umas',
                 'ao', 'aos', 'à', 'às', 'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles',
                 'elas', 'meu', 'meus', 'minha', 'minhas', 'teu', 'teus', 'tua', 'tuas',
                 'seu', 'seus', 'sua', 'suas', 'nosso', 'nossa', 'nossos', 'nossas',
                 'vosso', 'vossa', 'doce', 'bom', 'bem', 'mais', 'tão', 'como', 'assim',
                 'mas', 'porque', 'pois', 'quando', 'onde', 'quem', 'qual', 'quais',
                 'todo', 'toda', 'todos', 'todas', 'este', 'esta', 'estes', 'estas',
                 'esse', 'essa', 'esses', 'essas', 'aquele', 'aquela', 'aqueles', 'aquelas',
                 'isto', 'isso', 'aquilo', 'muito', 'pouco', 'algum', 'alguma', 'nenhum',
                 'nenhuma', 'cada', 'certo', 'certa', 'outro', 'outra', 'mesmo', 'mesma',
                 'também', 'ainda', 'já', 'sim', 'não', 'nem', 'até', 'sem', 'após',
                 'sob', 'sobre', 'entre', 'desde', 'são', 'era', 'foi', 'ser', 'ter',
                 'tem', 'têm', 'está', 'estão', 'pode', 'podem', 'deve', 'devem'}
    
    words = [w for w in text.split() if w not in stopwords and len(w) > 2]
    
    # Prioriza palavras do título
    title_words = re.sub(r'[^\w\sáàâãéèêíïóôõöúçñ]', ' ', title_clean.lower()).split()
    title_keywords = [w for w in title_words if w not in stopwords and len(w) > 2]
    
    return title_keywords[:5], words[:20]

def search_youtube(query, max_results=8):
    try:
        cmd = [
            "yt-dlp", "--flat-playlist", "-J",
            "--default-search", "ytsearch",
            f"ytsearch{max_results}:{query}",
            "--no-warnings",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return []
        data = json.loads(result.stdout)
        return [{"url": f"https://www.youtube.com/watch?v={e['id']}", "title": e.get("title", "")}
                for e in data.get("entries", []) if e.get("id")]
    except:
        return []

def matches_hino(video_title, title_keywords, full_keywords):
    """Verifica se o titulo do video corresponde ao hino."""
    vt = video_title.lower()
    # Conta quantas keywords do título aparecem
    matches = sum(1 for kw in title_keywords if kw in vt)
    full_matches = sum(1 for kw in full_keywords if kw in vt)
    
    # Critérios mais rigorosos:
    # Se tem apenas 1 keyword do título, precisa ter 3+ do full text
    # Se tem 2+ keywords do título, já vale
    return matches >= 2 or (matches >= 1 and full_matches >= 4)

def score_video(video_title, title_keywords):
    vt = video_title.lower()
    score = 0
    kw_matches = sum(1 for kw in title_keywords if kw in vt)
    score += kw_matches * 20
    
    # Bônus por categoria
    if any(kw in vt for kw in ["ccb", "congregação cristã"]):
        score = max(score, 100)
    elif any(kw in vt for kw in ["adventista", "hinário adventista", "hinario adventista", "novo hinário"]):
        score += 10
    if any(kw in vt for kw in ["lyrics", "lyric", "playback", "legenda", "letra"]):
        score += 5
    
    return score

# Load index
index_path = os.path.join(os.path.dirname(__file__), "..", INDEX_PATH)
with open(index_path, 'r', encoding='utf-8') as f:
    index = json.load(f)

hinos_dir = os.path.join(os.path.dirname(__file__), "..", HINOS_DIR)

for i, hino in enumerate(index):
    numero = hino["numero"]
    titulo = hino["titulo"]
    filepath = os.path.join(hinos_dir, f"{numero:03d}.json")
    
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"[{i+1}/196] PT {numero:03d} - {titulo}...", end=" ", flush=True)
    
    # Pega primeira estrofe
    first_verse = data["verses"][0][0] if data.get("verses") else ""
    
    # Extrai keywords
    title_kw, full_kw = extract_keywords(titulo, first_verse)
    
    if not title_kw:
        print(f"✗ Sem keywords")
        continue
    
    # Busca no YouTube
    query = "Hinario Adventista " + " ".join(title_kw)
    videos = search_youtube(query, 8)
    
    if not videos:
        print("✗ Nada encontrado")
        continue
    
    # Filtra e pontua
    validos = []
    for v in videos:
        if matches_hino(v["title"], title_kw, full_kw):
            s = score_video(v["title"], title_kw)
            validos.append((s, v))
    
    if not validos:
        # Tenta busca mais genérica
        query2 = " ".join(title_kw[:3])
        videos2 = search_youtube(query2, 5)
        validos = []
        for v in videos2:
            if matches_hino(v["title"], title_kw, full_kw):
                s = score_video(v["title"], title_kw)
                validos.append((s, v))
    
    if not validos:
        print("✗ Nenhum corresponde")
        continue
    
    # Ordena por score (decrescente) e pega top 3
    validos.sort(key=lambda x: -x[0])
    top3 = [v for _, v in validos[:3]]
    
    data["videos"] = top3
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    kw_str = ", ".join(title_kw)
    print(f"✓ {len(top3)}/{len(validos)} válidos (kw: {kw_str[:60]})")
    
    time.sleep(0.5)

print("\n\nConcluído!")
