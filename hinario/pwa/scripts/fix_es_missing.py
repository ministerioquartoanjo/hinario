#!/usr/bin/env python3
import json

# ES 018 - mesmo hino do PT 018 (Alvo Mais Que a Neve)
filepath = 'public/data/hinos/es/018.json'
with open(filepath, 'r') as f:
    data = json.load(f)
data['videos'] = [{"url": "https://www.youtube.com/watch?v=NQxLxxRfa-c", "title": "Hinário Adventista 205 - ALVO MAIS QUE A NEVE"}]
with open(filepath, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("ES 018 atualizado")

# ES 060 - Exultación del creyente
filepath = 'public/data/hinos/es/060.json'
with open(filepath, 'r') as f:
    data = json.load(f)
data['videos'] = [{"url": "https://www.youtube.com/watch?v=SpWShEBv2HQ", "title": "Hinário Adventista 60 - Exultação do Crente"}]
with open(filepath, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("ES 060 atualizado")