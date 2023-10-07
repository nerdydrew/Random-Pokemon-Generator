#!/usr/bin/env python3

"""
Prints the names of any duplicated sprites (where a shiny or a form is the same
as the normal sprite).
"""

import os
import re
import filecmp

normal_sprites_folder = "../public/sprites/normal/"
shiny_sprites_folder = "../public/sprites/shiny/"

def are_same(file1, file2):
    return filecmp.cmp(file1, file2, shallow=False)

if __name__ == "__main__":
    for filename in sorted(os.listdir(normal_sprites_folder)):
        normal = os.path.join(normal_sprites_folder, filename)
        shiny = os.path.join(shiny_sprites_folder, filename)

        if "-" in filename: # Forms
            non_form = os.path.join(normal_sprites_folder, re.sub(r"-[^.]+", "", filename))
            if are_same(normal, non_form):
                print(f"Form {filename} is a duplicate of {non_form}.")
        
        if are_same(normal, shiny):
            print(f"Shiny {filename} is duplicate.")
