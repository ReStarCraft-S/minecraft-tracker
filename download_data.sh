#!/bin/bash

# Create data directory if not exists
mkdir -p data

# Output file
OUTPUT_FILE="data/advancements.json"
TEMP_FILE="data/temp_advancements.json"

# Extract advancement IDs from registries.json
# 1. Find the line number of "advancement": [
START_LINE=$(grep -n '"advancement": \[' data/registries.json | cut -d: -f1)

# Start JSON object
echo "{" > "$TEMP_FILE"


echo "{" > "$TEMP_FILE"
FIRST=1

sed -n "${START_LINE},/  ],/p" data/registries.json | \
grep -v '"advancement": \[' | \
grep -v '  ],' | \
grep -v 'recipes/' | \
sed 's/^[[:space:]]*"//;s/",$//;s/"$//' | \
while read -r id; do
    if [ -z "$id" ]; then continue; fi
    
    echo "Downloading $id..."
    URL="https://raw.githubusercontent.com/misode/mcmeta/data/data/minecraft/advancement/$id.json"
    
    # Check if we already have it (optional, but good for restart)
    # We are appending to a big file, so we can't easily check if it's in there.
    # But we can just re-download or assume we want to finish the list.
    # Since we killed it, we might have a partial file.
    # It's better to just re-run for the missing ones.
    
    CONTENT=$(curl -s "$URL")
    
    if [[ "$CONTENT" == *"404: Not Found"* ]] || [[ -z "$CONTENT" ]]; then
        echo "Failed to download $id"
        continue
    fi
    
    if [ $FIRST -eq 0 ]; then
        echo "," >> "$TEMP_FILE"
    fi
    FIRST=0
    
    echo "\"minecraft:$id\": $CONTENT" >> "$TEMP_FILE"
    sleep 0.1
done

# Close JSON object
echo "}" >> "$TEMP_FILE"

# Move to final location
mv "$TEMP_FILE" "$OUTPUT_FILE"

echo "Done! Saved to $OUTPUT_FILE"
