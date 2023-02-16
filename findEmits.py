import os
# glob is a plugin which can help us to get the content in certain dir
import glob

# get current working directory
root = os.getcwd()

# f keyword means format, like the string literal in Javascript
file_paths = glob.glob(f"{root}/src/**/*.vue", recursive=True)
# file_paths = glob.glob(f"{root}/src/components/download/*.vue", recursive=True)
count = 0

for file_path in file_paths:
  with open(file_path, mode="r",encoding="utf-8") as file:
    lines = file.readlines()
    file.seek(0)
    if file.read().find('emits:') != -1:
      continue
    else:
      print(file_path)

  with open(file_path, mode="w",encoding="utf-8") as file:
    file.writelines(lines)
    count+=1
    
print(f"Finish, {count} files changed.")
