import json
import urllib.request
import time
import os
import sys

def get_advancement_list():
    """Get list of advancement files from GitHub API (misode/mcmeta data branch)."""
    print("Fetching advancement list from GitHub API...")
    
    # Step 1: Get the latest commit SHA for the 'data' branch
    branch_url = "https://api.github.com/repos/misode/mcmeta/branches/data"
    req = urllib.request.Request(branch_url, headers={"Accept": "application/vnd.github+json", "User-Agent": "MinecraftTracker"})
    with urllib.request.urlopen(req) as response:
        branch_data = json.loads(response.read().decode())
        commit_sha = branch_data["commit"]["sha"]
    
    print(f"Latest commit SHA: {commit_sha}")
    
    # Step 2: Get the tree for the advancement directory
    tree_url = f"https://api.github.com/repos/misode/mcmeta/git/trees/{commit_sha}?recursive=1"
    req = urllib.request.Request(tree_url, headers={"Accept": "application/vnd.github+json", "User-Agent": "MinecraftTracker"})
    with urllib.request.urlopen(req) as response:
        tree_data = json.loads(response.read().decode())
    
    # Filter for advancement files (exclude recipes)
    advancement_ids = []
    prefix = "data/minecraft/advancement/"
    for item in tree_data.get("tree", []):
        path = item.get("path", "")
        if path.startswith(prefix) and path.endswith(".json") and "recipes/" not in path:
            # Extract the advancement ID (remove prefix and .json suffix)
            adv_id = path[len(prefix):-5]  # e.g., "adventure/adventuring_time"
            advancement_ids.append(adv_id)
    
    print(f"Found {len(advancement_ids)} advancements (excluding recipes).")
    return advancement_ids

def download_data():
    advancement_ids = get_advancement_list()
    
    if not advancement_ids:
        print("No advancements found!")
        return
    
    advancements = {}
    count = 0
    
    for adv_id in advancement_ids:
        url = f"https://raw.githubusercontent.com/misode/mcmeta/data/data/minecraft/advancement/{adv_id}.json"
        print(f"Downloading {adv_id}...")
        
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "MinecraftTracker"})
            with urllib.request.urlopen(req) as response:
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
