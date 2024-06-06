#!/usr/bin/env python3

"""
Copies a JSON field from all.json to all other dexes, including forms.
"""

import os
import sys
import json
from collections import OrderedDict

dex_folder = "../public/dex/"
source_dex_name = "all.json"

def load_json(filename):
    with open(filename, "r") as f:
        return json.load(f, object_pairs_hook=OrderedDict)

def write_json(filename, data):
    with open(filename, "w") as f:
        json.dump(data, f, indent="\t")

def copy_field(source_pokemon, destination_pokemon, field_name):
    if "forms" in destination_pokemon:
        for dest_form in destination_pokemon["forms"]:
            # Get the corresponding form.
            if "spriteSuffix" in dest_form:
                form_filter = lambda f: "spriteSuffix" in f and f["spriteSuffix"] == dest_form["spriteSuffix"]
            else:
                form_filter = lambda f: "spriteSuffix" not in f
            source_form = next(filter(form_filter, source_pokemon["forms"]))
            copy_field(source_form, dest_form, field_name)
    
    if field_name in source_pokemon:
        destination_pokemon[field_name] = source_pokemon[field_name]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Must have at least one argument.")
        print(f"Usage: {sys.argv[0]} [field_to_copy]...")
        exit(1)

    source_dex_file = os.path.join(dex_folder, source_dex_name)
    source_by_name = {p["name"] : p for p in load_json(source_dex_file)}

    for dex_name in os.listdir(dex_folder):
        if dex_name != source_dex_name:
            for field_name_to_copy in sys.argv[1:]:
                dex_file = os.path.join(dex_folder, dex_name)
                dex_to_update = load_json(dex_file)
                
                for pokemon in dex_to_update:
                    source_pokemon = source_by_name[pokemon["name"]]
                    copy_field(source_pokemon, pokemon, field_name_to_copy)

            write_json(dex_file, dex_to_update)
