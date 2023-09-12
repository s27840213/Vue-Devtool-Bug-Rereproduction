import glob
import json
import os
import re
import sys

from util import bcolors as _bcolors
from util import nocolors

bcolors = _bcolors

prefix_pattern = re.compile(r'([A-Z]+)[0-9]{4}')
ROOT = os.path.abspath(os.path.join(os.getcwd(), os.pardir, os.pardir)) # parent folder of the parent folder of this file

def getLocaleJsonPathsIter(project):
  file_paths = glob.glob(f"{ROOT}/projects/{project}/src/locales/*.json")
  for file_path in file_paths:
    if '_shaked' in file_path: continue
    yield file_path

def getLocaleJsonsIter(project):
  for file_path in getLocaleJsonPathsIter(project):
    with open(file_path, mode="r", encoding="utf-8") as f:
      yield f, file_path

class ShakedJson:
  def __init__(self, config_path):
    filename = config_path.split('.')[0]
    self.shaked_file_path = f'{filename}_shaked.json'

  def __enter__(self):
    self.f = open(self.shaked_file_path, mode="r", encoding="utf-8")
    return self.f, self.shaked_file_path
    
  def __exit__(self, type, value, traceback):
    self.f.close()

def findPrefixes(project):
  prefixes = set()
  for f, _ in getLocaleJsonsIter(project):
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
  print(f"Finish scanning source code, {count} files scanned.\n")

  return used_keys

def shake_files(project, used_keys):
  for f, file_path in getLocaleJsonsIter(project):
    filename = file_path.split('.')[0]
    config = json.load(f)
    config = { key: value for key, value in config.items() if key in used_keys }
    output_file_path = f'{filename}_shaked.json'
    print(f'Generate shaked i18n config to {output_file_path}')
    with open(output_file_path, 'w', encoding='UTF-8') as f:
      json.dump(config, f, indent=2, ensure_ascii=False)

def check_files(project, used_keys: set[str]):
  mismatch = False
  for full, file_path in getLocaleJsonsIter(project):
    try:
      with ShakedJson(file_path) as (f, config_path):
        config = json.load(f)
        full_config = json.load(full)
        shaked_config = set(filter(lambda key: key in used_keys, full_config))
        print(f'Checking shaked i18n config from {config_path}\n')
        config_keys: set[str] = set(config.keys())
        c_no_s = config_keys - shaked_config
        s_no_c = shaked_config - config_keys
        if c_no_s or s_no_c:
          print(f'{bcolors.FAIL}Mismatch found!{bcolors.ENDC}')
          if c_no_s:
            print(f'{bcolors.FAIL}In *_shaked.json but not in source code: {c_no_s}')
          if s_no_c:
            print(f'{bcolors.FAIL}In source code but not in *_shaked.json: {s_no_c}{bcolors.ENDC}')
          mismatch = True
    except FileNotFoundError:
      print(f'{bcolors.FAIL}Shaked json not found for {file_path}')
      print(f'Please run tools/i18n-tool/i18n_shake.py and git add changes before commiting{bcolors.ENDC}')
      sys.exit(1)
  return mismatch

if __name__ == '__main__':
  import argparse
  parser = argparse.ArgumentParser()
  parser.add_argument('-c', '--check',
                      action='store_true',
                      help='check consistency between source code and shaked.json instead of generating shaked.json')
  parser.add_argument('-n', '--no-color',
                      action='store_true',
                      help='don\'t use color in printed messages, usually used by husky')
  args = parser.parse_args()
  if args.no_color:
    bcolors = nocolors
  PROJECTS = ['vivipic', 'stk', 'charmix']
  any_mismatch = False
  for project in PROJECTS:
    print(f'\nProcessing: {project}\n')
    prefixes = findPrefixes(project)
    print(f'Found prefixes: {prefixes}\n')
    used_keys = process(project, prefixes=prefixes)
    if args.check:
      mismatch = check_files(project, used_keys)
      any_mismatch = any_mismatch or mismatch
      if mismatch:
        print(f'{bcolors.FAIL}Shaked json mismatch found for: {project}\n{bcolors.ENDC}')
    else:
      shake_files(project, used_keys)
  if any_mismatch:
    print(f'{bcolors.FAIL}Some mismatch found')
    print(f'Please run tools/i18n-tool/i18n_shake.py and git add changes before commiting{bcolors.ENDC}')
    sys.exit(1)
