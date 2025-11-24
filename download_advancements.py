import json
import urllib.request
import time
import os
import sys

def download_data():
    print("Loading registries.json...")
    try:
        with open('data/registries.json', 'r') as f:
            registries = json.load(f)
    except Exception as e:
        print(f"Error loading registries.json: {e}")
        return

    advancement_ids = registries.get('advancement', [])
    if not advancement_ids:
        # Fallback if structure is different (e.g. if it's a list of strings directly?)
        # Based on previous cat, it seemed to be under "advancement" key.
        print("No advancements found in registries.json")
        return

    print(f"Found {len(advancement_ids)} advancements.")
    
    advancements = {}
    count = 0
    
    for adv_id in advancement_ids:
        # Filter recipes
        if 'recipes/' in adv_id:
            continue
            
        url = f"https://raw.githubusercontent.com/misode/mcmeta/data/data/minecraft/advancement/{adv_id}.json"
        print(f"Downloading {adv_id}...")
        
        try:
            with urllib.request.urlopen(url) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    advancements[f"minecraft:{adv_id}"] = data
                    count += 1
        except Exception as e:
            print(f"Failed to download {adv_id}: {e}")
        
        # Be nice to the server
        time.sleep(0.05)

    print(f"Downloaded {count} advancements.")
    
    print("Saving to data/advancements.json...")
    with open('data/advancements.json', 'w') as f:
        json.dump(advancements, f, indent=2)
    
    print("Done!")

if __name__ == "__main__":
    download_data()
