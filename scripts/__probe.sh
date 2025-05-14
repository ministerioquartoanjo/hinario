#!/bin/bash

# Log file to store the results
log_file="audio_normalization_log.txt"
echo "Files needing normalization:" > "$log_file"

# Loop through all MP3 files in the current directory
for file in *.mp3; do
    # Get the maximum volume level
    max_volume=$(ffprobe -v error -show_entries stream=tags -of default=noprint_wrappers=1:nokey=1 "$file" | grep "max_volume" | awk '{print $2}' | tr -d 'dB')

    # Get additional metadata
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file")
    bitrate=$(ffprobe -v error -show_entries format=bit_rate -of default=noprint_wrappers=1:nokey=1 "$file")
    sample_rate=$(ffprobe -v error -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "$file")

    # Check if max volume is above -1 dB
    if [[ ! -z "$max_volume" && $(echo "$max_volume > -1" | bc -l) -eq 1 ]]; then
        echo "$file needs normalization (max volume: $max_volume dB, duration: $duration s, bitrate: $bitrate bps, sample rate: $sample_rate Hz)" >> "$log_file"
    fi
done

echo "Normalization check complete. See $log_file for details."