#!/usr/bin/env python3

"""
Resizes images to the correct size and renames them if numbers are used.
Searches subfolders recursively, starting in the given (or default) folder.
"""

import re
import os
import sys
import json
from pathlib import Path
from collections import OrderedDict
from PIL import Image # pip3 install Pillow


default_folder = "../public/sprites/"
dex_file = "../public/dex/all.json"
new_dimension = 120
new_dimensions = (new_dimension, new_dimension)

def load_json(filename):
    with open(filename, "r") as f:
        return json.load(f, object_pairs_hook=OrderedDict)

def format_images(folder):
    for name in os.listdir(folder):
        file_or_folder = os.path.join(folder, name)
        if os.path.isdir(file_or_folder):
            format_images(file_or_folder)
        elif is_image(file_or_folder):
            resize_image(file_or_folder)
            rename_file(file_or_folder)

def is_image(file):
    try:
        Image.open(file)
        return True
    except:
        return False

def resize_image(file):
    image = Image.open(file)
    if image.size == new_dimensions:
        return

    # Shrink the image within the new dimensions.
    image.thumbnail(new_dimensions)
    
    # Expand the canvas if needed to reach the new dimensions.
    original_x, original_y = image.size
    temp_image = Image.new(image.mode, new_dimensions)
    temp_image.paste(image, ((new_dimension - original_x)//2, (new_dimension - original_y)//2))
    image = temp_image

    image.save(file, optimize = True)

pokemon_by_id = {p["id"] : p for p in load_json(dex_file)}

def rename_file(file):
    path = Path(file)
    name = path.stem
    if "-" in name:
        name, suffix = name.split("-", 1)
    else:
        suffix = None
    try:
        id_number = int(name)
    except:
        # Skip if not named with a number.
        return

    pokemon = pokemon_by_id[id_number]
    if suffix and not is_form_known(pokemon, suffix):
        print(f"{path} does not correspond to any known form.")
        exit(1)
    
    new_name = os.path.join(path.parent, normalize_name(pokemon["name"]))
    if suffix:
        new_name = f"{new_name}-{suffix}"
    new_name = f"{new_name}{path.suffix}"
    path.rename(new_name)

def is_form_known(pokemon, form_suffix):
    if "forms" not in pokemon:
        return False
    for form in pokemon["forms"]:
        if "spriteSuffix" in form and form["spriteSuffix"] == form_suffix:
            return True
    return False

def normalize_name(name):
    # Should match normalizeName in pokemon.ts.
    name = name.lower()
    name = re.sub(u'é', 'e', name)
    name = re.sub(u'♀', 'f', name)
    name = re.sub(u'♂', 'm', name)
    name = re.sub(r"['.:% -]", "", name)
    return name

if __name__ == "__main__":
    if len(sys.argv) == 2:
        folder = sys.argv[1]
        if not os.path.isdir(folder):
            print(f"{folder} must be a directory.")
            exit(1)
    else:
        folder = default_folder

    format_images(folder)
