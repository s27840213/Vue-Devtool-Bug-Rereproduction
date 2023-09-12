import glob
import json
import os
import re
import sys

prefix_pattern = re.compile(r'([A-Z]+)[0-9]{4}')
ROOT = os.path.abspath(os.path.join(os.getcwd(), os.pardir)) # parent folder of this file

def findPrefixes(project):
  prefixes = set()
  file_paths = glob.glob(f"{ROOT}/projects/{project}/src/locales/*.json")
  for file_path in file_paths:
    if '_shaked' in file_path: continue
    f = open(file_path, mode="r", encoding="utf-8")
    config = json.load(f)
    for key in config.keys():
      match = prefix_pattern.match(key)
      if match:
        prefixes.add(match.group(1))
  return prefixes

def process(project, extensions = ['vue', 'ts'], prefixes = set()):
  used_keys = set()
  file_paths = []
  for extension in extensions:
    file_paths.extend(glob.glob(f"{ROOT}/projects/{project}/src/**/*.{extension}", recursive=True))
  count = 0

  for file_path in file_paths:
    with open(file_path, mode="r", encoding="utf-8") as file:
      for line in file.readlines():
        for prefix in prefixes:
          i18n_key_pattern = re.compile(r'(' + prefix + r'[0-9]{4})')
          for used_key in i18n_key_pattern.finditer(line):
            used_keys.add(used_key.group(1))
      count+=1
  print(f"Finish, {count} files scanned.")

  return used_keys

def shake_files(project, used_keys):
  file_paths = glob.glob(f"{ROOT}/projects/{project}/src/locales/*.json")
  for file_path in file_paths:
    if '_shaked' in file_path: continue
    f = open(file_path, mode="r", encoding="utf-8")
    filename = file_path.split('.')[0]
    config = json.load(f)
    config = { key: value for key, value in config.items() if key in used_keys }
    output_file_path = f'{filename}_shaked.json'
    print(f'Generate shaked i18n config to {output_file_path}')
    with open(output_file_path, 'w', encoding='UTF-8') as f:
      json.dump(config, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
  project = sys.argv[1]
  prefixes = findPrefixes(project)
  print(f'Found prefixes: {prefixes}')
  used_keys = process(project, prefixes=prefixes)
  shake_files(project, used_keys)
