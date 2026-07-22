#!/usr/bin/env python3
import json, os, glob

# Verificar PT
pt_dir = 'public/data/hinos'
pt_files = sorted(glob.glob(os.path.join(pt_dir, '*.json')))
pt_sem_video = []
for f in pt_files:
    if os.path.basename(f) == 'video-selector.html':
        continue
    with open(f) as fh:
        data = json.load(fh)
    if 'videos' not in data or len(data['videos']) == 0:
        pt_sem_video.append(os.path.basename(f))

print(f'PT - Total: {len(pt_files)-1}, Com vídeo: {len(pt_files)-1 - len(pt_sem_video)}, Sem vídeo: {len(pt_sem_video)}')
if pt_sem_video:
    print(f'Sem vídeo: {pt_sem_video}')

# ES
es_files = sorted(glob.glob('public/data/hinos/es/*.json'))
es_sem_video = []
for f in es_files:
    with open(f) as fh:
        data = json.load(fh)
    if 'videos' not in data or len(data['videos']) == 0:
        es_sem_video.append(f.split('/')[-1])

print(f'ES - Total: {len(es_files)}, Com vídeo: {len(es_files) - len(es_sem_video)}, Sem vídeo: {len(es_sem_video)}')
if es_sem_video:
    print(f'Sem vídeo: {es_sem_video}')
