#!/usr/bin/env python3

import os
import sys
import json
from collections import OrderedDict

"""
Copies the Pokémon specified by a file to a Pokédex file, either a new file or appended to an
existing file. Asks whether to copy each form.
"""

forms_to_not_prompt = {"gigantamax", "alola", "hisui", "galar"}

dex_folder = "../public/dex/"
source_dex_file_name = "all.json"

def load_json(filename):
    with open(filename, "r") as f:
        return json.load(f, object_pairs_hook=OrderedDict)

def write_json(filename, data):
    with open(filename, "w") as f:
        json.dump(data, f, indent="\t")

def copy_pokemon(pokemon):
    if "forms" in pokemon:
        copy_forms(pokemon)
    return pokemon

def should_copy_form(pokemon, form):
    if "spriteSuffix" in form:
        if form["spriteSuffix"] in forms_to_not_prompt:
            return False
        else:
            suffix_to_display = " (suffix: %s)" % form["spriteSuffix"]
    else:
        suffix_to_display = ""

    if "name" in form:
        name = form["name"]
    else:
        name = pokemon["name"]
    answer = input("\tInclude %s%s? (Y/n) " % (name, suffix_to_display))
    return answer.lower() != "n"

def copy_forms(pokemon):
    suffixes = [f["spriteSuffix"] for f in pokemon["forms"] if "spriteSuffix" in f and f["spriteSuffix"] not in forms_to_not_prompt]
    print("%s has %i forms (%s)." % (pokemon["name"], len(pokemon["forms"]), ", ".join(suffixes)))

    pokemon["forms"] = [f for f in pokemon["forms"] if should_copy_form(pokemon, f)]

    if len(pokemon["forms"]) == 0:
        print("No forms selected for %s." % pokemon["name"])
        exit(1)
    elif len(pokemon["forms"]) == 1 and "spriteSuffix" not in pokemon["forms"][0]:
        # If only the normal form is selected, clear the forms.
        del pokemon["forms"]

def add_to_dex(destination_dex, names_to_copy):
    destination_dex_by_name = {p["name"] : p for p in destination_dex}

    source_dex_file = os.path.join(dex_folder, source_dex_file_name)
    source_dex_by_name = {p["name"] : p for p in load_json(source_dex_file)}
    
    for name in names_to_copy:
        if name in destination_dex_by_name:
            print(f"{name} already exists in the dex. Replacing...")
            destination_dex.remove(destination_dex_by_name[name])
        destination_dex.append(copy_pokemon(source_dex_by_name[name]))
    return destination_dex

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Must have two arguments.")
        print(f"Usage: {sys.argv[0]} list_of_names.txt region_name")
        exit(1)

    with open(sys.argv[1]) as names_file:
        names_to_copy = names_file.read().splitlines()
    destination_file = os.path.join(dex_folder, sys.argv[2] + ".json")

    if os.path.isfile(destination_file):
        print(f"{destination_file} already exists. The specified Pokémon will be merged or appended.")
        existing_dex = load_json(destination_file)
    else:
        existing_dex = {}

    resulting_dex = add_to_dex(existing_dex, names_to_copy)
    write_json(destination_file, resulting_dex)
