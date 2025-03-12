#!/bin/bash

# Verifica se o link do vídeo foi fornecido
if [ "$#" -lt 1 ]; then
    echo "Uso: $0 <URL do vídeo do YouTube> [nome do arquivo MP3]"
    exit 1
fi

# URL do vídeo do YouTube
VIDEO_URL="$1"

# Nome do arquivo MP3 (se fornecido)
if [ "$#" -eq 2 ]; then
    FILENAME="$2"
else
    FILENAME="downloads/%(title)s.%(ext)s"
fi

# Verifica se o arquivo tem extensão .mp3
if [[ "$FILENAME" != *.mp3 ]]; then
    FILENAME="$FILENAME.mp3"
fi

# Cria um diretório para armazenar os downloads, se não existir
mkdir -p downloads

# Baixa o vídeo como MP3 usando yt-dlp
yt-dlp --extract-audio --audio-format mp3 -o "$FILENAME" "$VIDEO_URL"

echo "Download concluído! O arquivo MP3 foi salvo na pasta 'downloads'."