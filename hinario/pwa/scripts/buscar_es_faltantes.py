#!/usr/bin/env python3
"""Busca intensiva para hinos ES com < 3 videos."""
import json, os, subprocess, time, re

STOPWORDS = {'de','da','do','das','dos','a','e','o','que','em','no','na',
             'nos','nas','para','por','com','se','é','um','uma','la','los',
             'las','le','del','al','el','en','es','y','su','un','una','con',
             'por','lo','te','se','me','si','mi','tu','les'}

def search_yt(query, max_results=10):
    try:
        cmd = ["yt-dlp", "--flat-playlist", "-J", "--default-search", "ytsearch",
               f"ytsearch{max_results}:{query}", "--no-warnings"]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if r.returncode != 0: return []
        d = json.loads(r.stdout)
        return [{"url": f"https://www.youtube.com/watch?v={e['id']}", "title": e.get("title","")}
                for e in d.get("entries",[]) if e.get("id")]
    except: return []

def match_keywords(title, keywords):
    t = title.lower()
    return sum(1 for kw in keywords if kw in t)

def completar(numero, titulo, data):
    nv = len(data.get("videos", []))
    if nv >= 3: return data["videos"]
    
    atuais = {v["url"] for v in data.get("videos", [])}
    
    titulo_clean = re.sub(r'^[\d\s]+[-–]\s*', '', titulo)
    titulo_clean = re.sub(r'(Himnario Adventista|Hinario Adventista)\s+', '', titulo_clean, flags=re.IGNORECASE).strip()
    
    palavras = titulo_clean.lower().split()
    keywords = [w for w in palavras if len(w) > 2 and w not in STOPWORDS]
    
    # Multiplas queries
    queries = [
        f'"{titulo_clean}" himnario adventista',
        f'"{titulo_clean}" himno adventista',
        f'himno {numero} himnario adventista',
        f'{titulo_clean} himno',
    ]
    
    todos = list(data.get("videos", []))
    seen = atuais
    
    for q in queries:
        vids = search_yt(q, 8)
        for v in vids:
            if v["url"] not in seen:
                seen.add(v["url"])
                score = match_keywords(v["title"], keywords)
                if score >= 1:
                    todos.append(v)
        if len(todos) >= 3:
            break
        time.sleep(0.2)
    
    # Se ainda faltam, tenta sem aspas
    if len(todos) < 3:
        q = f'{titulo_clean} himnario adventista'
        vids = search_yt(q, 10)
        for v in vids:
            if v["url"] not in seen:
                seen.add(v["url"])
                score = match_keywords(v["title"], keywords)
                if score >= 1:
                    todos.append(v)
            if len(todos) >= 3:
                break
    
    data["videos"] = todos[:3]
    return data["videos"]

def main():
    base = os.path.join(os.path.dirname(__file__), "..")
    dirpath = os.path.join(base, "public/data/hinos/es")
    
    files = sorted(os.listdir(dirpath))
    for fname in files:
        if not fname.endswith('.json') or 'video-selector' in fname: continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        nv = len(data.get("videos", []))
        if nv >= 3:
            continue
        
        numero = data.get("numero", int(fname.replace('.json','')))
        titulo = data.get("title", "")
        
        antes = nv
        novos = completar(numero, titulo, data)
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
