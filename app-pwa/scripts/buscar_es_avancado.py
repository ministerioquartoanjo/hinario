#!/usr/bin/env python3
"""Busca vídeos ES com estratégias múltiplas."""
import json, os, subprocess, time, re

SEARCH_WORDS = ['himno', 'himnario', 'adventista', 'himnos', 'cristiana']

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

# Map of known Spanish hymn titles that may differ from auto-translated ones
TITLE_MAP = {
    18: ["Alvo más que la nieve", "Blanco más que la nieve", "Lávalo todo"],
    25: ["Las nuevas del evangelio", "Las noticias del evangelio", "Sed", "Sed tengo de ti"],
    27: ["Vivifícanos Señor", "Avívanos Señor"],
    36: ["Cuán triste es caminar en tinieblas", "Qué triste es caminar en tinieblas"],
    55: ["He aquí multitudes", "Muchas moradas"],
    60: ["Exultación del creyente", "Gozo en el Señor"],
    128: ["El lugar de bendición", "Lugar de bendición y paz"],
    147: ["Cuando Dios llame", "Cuando suene la trompeta", "Allí estaré"],
    148: ["Cuán grande eres", "Cuán grande es él", "Digno eres tú"],
    149: ["Qué gozo es creer en Cristo", "Oh cuán dulce es fiar en Cristo"],
    152: ["Qué seguridad", "Soy de Jesús", "¡Qué seguridad!"],
    154: ["Quien escuche", "Hace años escuché"],
    156: ["Quiero tener a Jesús", "A Jesús entrega todo"],
    162: ["Salvada soy", "Salvo soy"],
    177: ["Feliz con Jesús", "En Cristo feliz es mi alma"],
    178: ["Agradecido", "Estoy agradecido", "Himno de agradecimiento"],
    183: ["Todo está bien", "Oh está todo bien"],
    184: ["Toma oh Dios mi corazón"],
    185: ["Lo entregaré todo", "Todo entregaré"],
    190: ["Jesús vencedor viene", "Vencendo vem Jesus"],
    191: ["Vengan muchachos", "Venid jóvenes"],
    196: ["Vosotros criaturas", "Criaturas del Señor"],
}

def completar(numero, titulo_es, data, pt_titulo):
    nv = len(data.get("videos", []))
    if nv >= 3: return data["videos"]
    
    atuais = {v["url"] for v in data.get("videos", [])}
    todos = list(data.get("videos", []))
    
    queries = []
    
    alt_titles = TITLE_MAP.get(numero, [])
    for at in alt_titles:
        queries.append(f'"{at}" himnario adventista')
        queries.append(f'"{at}" himno adventista')
    
    queries.append(f'{titulo_es} himnario adventista')
    queries.append(f'{pt_titulo} himnario adventista')
    queries.append(f'himno {numero} himnario adventista')
    
    seen = atuais
    for q in queries[:6]:
        vids = search_yt(q, 6)
        for v in vids:
            if v["url"] not in seen:
                seen.add(v["url"])
                # Verifica se tem palavras relevantes
                vt = v["title"].lower()
                keywords = [w.lower() for w in titulo_es.split() + pt_titulo.split() if len(w)>3]
                if any(kw in vt for kw in keywords) or any(kw in vt for kw in ['himno','himnario','adventista']):
                    todos.append(v)
        if len(todos) >= 3:
            break
        time.sleep(0.1)
    
    data["videos"] = todos[:3]
    return data["videos"]

def main():
    base = os.path.join(os.path.dirname(__file__), "..")
    
    with open(os.path.join(base, "public/data/hymns-index.json")) as f:
        pt_index = {h['numero']: h['titulo'] for h in json.load(f)}
    
    dirpath = os.path.join(base, "public/data/hinos/es")
    files = sorted(os.listdir(dirpath))
    
    for fname in files:
        if not fname.endswith('.json') or 'video-selector' in fname:
            continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        nv = len(data.get("videos", []))
        if nv >= 3:
            continue
        
        numero = data.get("numero", int(fname.replace('.json','')))
        titulo = data.get("title", "")
        pt_titulo = pt_index.get(numero, "")
        
        antes = nv
        novos = completar(numero, titulo, data, pt_titulo)
        depois = len(novos)
        
        if depois > antes:
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"{fname.replace('.json','')}: {antes}v -> {depois}v ✓")
        else:
            print(f"{fname.replace('.json','')}: {antes}v -> {depois}v ✗")
        
        time.sleep(0.3)

if __name__ == "__main__":
    main()
