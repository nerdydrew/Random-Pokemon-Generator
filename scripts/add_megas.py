#!/usr/bin/env python3

import os
import sys
import json
from collections import OrderedDict
import csv

"""
Adds Mega Pokémon from the given file. Only supports "normal" Megas, not like Charizard X and Y.
"""

dex_file = "../public/dex/all.json"

def load_json(filename):
    with open(filename, "r") as f:
        return json.load(f, object_pairs_hook=OrderedDict)

def write_json(filename, data):
    with open(filename, "w") as f:
        json.dump(data, f, indent="\t")

def add_mega(pokemon, name, types):
    if "forms" not in pokemon:
        # If the Pokémon doesn't have forms yet, add the field with an empty object representing
        # the non-mega form.
        pokemon["forms"] = [{}]

    mega_form = OrderedDict({})
    if sorted(types) != sorted(pokemon["types"]):
        mega_form["types"] = types
    mega_form["isMega"] = True
    mega_form["spriteSuffix"] = "mega"

    pokemon["forms"].append(mega_form)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Must have two arguments.")
        print(f"Usage: {sys.argv[0]} names_and_types.tsv")
        print("Where each line of the file is in the format [name]\\t[space-separated types]")
        exit(1)

    dex = load_json(dex_file)
    dex_by_name = {p["name"] : p for p in dex}

    with open(sys.argv[1]) as file:
        reader = csv.reader(file, delimiter="\t")
        for row in reader:
            name, types = row
            types = types.split(" ")
            add_mega(dex_by_name[name], name, types)

    write_json(dex_file, dex)
