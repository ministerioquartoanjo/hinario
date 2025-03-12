#!/bin/bash

# Caminho para o arquivo
input_file="/mnt/pm/mqa/hinario/hinario-letras.md"
output_file="/mnt/pm/mqa/hinario/hinario-letras-modificado.md"

# Criar um novo arquivo para armazenar as substituições
> "$output_file"

# Contador para o ID
counter=1

# Ler o arquivo linha por linha
while IFS= read -r line; do
    # Verificar se a linha contém o padrão
    if [[ $line =~ ^#\ \*\<a\ name=\"_toc[0-9]+\"\>\<\/a\ ([0-9]+)\ -\ (.+)$ ]]; then
        # Extrair o número e o título
        number="${BASH_REMATCH[1]}"
        title="${BASH_REMATCH[2]}"
        
        # Formatar a nova linha
        echo "<div id=\"$(printf '%03d' $counter)\">" >> "$output_file"
        echo "    <h2>$(printf '%03d' $counter) - $title</h2>" >> "$output_file"
        echo "    <pre>" >> "$output_file"
        
        # Incrementar o contador
        ((counter++))
    else
        # Caso contrário, apenas copiar a linha
        echo "$line" >> "$output_file"
    fi
done < "$input_file"

echo "Substituições concluídas. O arquivo modificado está em: $output_file"