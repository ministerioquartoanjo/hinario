#!/usr/bin/env python3
"""
Busca final: usa 3 estratégias em ordem:
1. Título exato + "Hinário Adventista" ou "HCC"
2. Título exato entre aspas
3. Keywords do título
Valida que o título do vídeo contém palavras significativas do título do hino.
"""
import json, os, subprocess, time, glob, re, sys

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
             'está', 'estão', 'pode', 'podem', 'deve', 'devem',
             'vou', 'vai', 'vão', 'vamos', 'ir', 'foi', 'foram'}

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
    except: return []

def extrair_keywords(titulo):
    """Extrai palavras-chave relevantes do título."""
    t = re.sub(r'^\d+\s*[-–]\s*', '', titulo)
    t = re.sub(r'[^\w\sáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]', ' ', t.lower())
    words = [w for w in t.split() if w not in STOPWORDS and len(w) > 2]
    return words

def validar_video(video_title, keywords, titulo_original):
    """Valida se o vídeo realmente corresponde ao hino."""
    vt = video_title.lower()
    
    # Rejeita se tiver palavras de conteúdo não-musical
    if any(bw in vt for bw in BAD_WORDS):
        return False
    
    # Extrai palavras do título original sem número
    titulo_clean = re.sub(r'^\d+\s*[-–]\s*', '', titulo_original)
    titulo_words = set(re.sub(r'[^\w\sáàâãéèêíïóôõöúçñ]', ' ', titulo_clean.lower()).split())
    titulo_words = {w for w in titulo_words if w not in STOPWORDS and len(w) > 2}
    
    # Quantas palavras do título aparecem no título do vídeo?
    matches = sum(1 for w in titulo_words if w in vt)
    
    # Se tem hinario/hcc no titulo do video
    tem_hinario = any(kw in vt for kw in ["hinário", "hinario", "adventista", "hcc", "harpa"])
    
    # Critérios de aceitação:
    # 1. Pelo menos 2 palavras do título aparecem
    if matches >= 2:
        return True
    # 2. 1 palavra do título + hinário/hcc
    if matches >= 1 and tem_hinario:
        return True
    # 3. Título do vídeo contém 80%+ do título do hino
    if len(titulo_words) > 0:
        ratio = matches / len(titulo_words)
        if ratio >= 0.6 and tem_hinario:
            return True
    
    return False

def processar_hinos(hinos_dir, index_path, prefixo_busca):
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
        
        print(f"[{i+1}/{len(index)}] {numero:03d} - {titulo[:50]}...", end=" ", flush=True)
        
        keywords = extrair_keywords(titulo)
        if not keywords:
            print("✗ Sem keywords")
            continue
        
        # Estratégia 1: título entre aspas + prefixo
        titulo_clean = re.sub(r'^\d+\s*[-–]\s*', '', titulo)
        queries = [
            f'"{titulo_clean}" {prefixo_busca}',
            f'"{titulo_clean}" hinário',
            f'"{titulo_clean}" HCC',
            f'{titulo_clean} {prefixo_busca}',
            f'{titulo_clean} letra',
            ' '.join(keywords[:4]),
        ]
        
        all_videos = []
        seen_urls = set()
        for q in queries:
            vids = search_yt(q, 6)
            for v in vids:
                if v["url"] not in seen_urls:
                    seen_urls.add(v["url"])
                    all_videos.append(v)
            if len(seen_urls) >= 12:
                break
        
        # Valida e pontua
        validos = []
        for v in all_videos:
            if not validar_video(v["title"], keywords, titulo):
                continue
            vt = v["title"].lower()
            score = 0
            if any(kw in vt for kw in ["ccb", "congregação cristã", "congregacao crista", "hcc"]):
                score += 30
            if any(kw in vt for kw in ["adventista", "hinário adventista", "hinario adventista", "novo hinário"]):
                score += 20
            if any(kw in vt for kw in ["lyrics", "lyric", "playback", "instrumental", "legenda", "letra"]):
                score += 15
            score += sum(5 for kw in keywords if kw in vt)
            validos.append((score, v))
        
        if not validos:
            print("✗ Nada válido")
            continue
        
        validos.sort(key=lambda x: -x[0])
        top3 = [v for _, v in validos[:3]]
        
        # Remove duplicatas por URL
        final = []
        seen = set()
        for v in top3:
            if v["url"] not in seen:
                seen.add(v["url"])
                final.append(v)
        
        data["videos"] = final[:3]
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"✓ {len(final)}/{len(validos)} válidos")
        time.sleep(0.3)

if __name__ == "__main__":
    base = os.path.join(os.path.dirname(__file__), "..")
    
    print("=== PORTUGUÊS ===")
    processar_hinos(
        os.path.join(base, "public/data/hinos"),
        os.path.join(base, "public/data/hymns-index.json"),
        "Hinário Adventista"
    )
    
    print("\n=== ESPANHOL ===")
    processar_hinos(
        os.path.join(base, "public/data/hinos/es"),
        os.path.join(base, "public/data/hymns-index-es.json"),
        "Himnario Adventista"
    )
