import glob
import re
import subprocess

sep = ",\n  "

def removePrefix(path: str):
  return path.replace('projects/vivipic/src', '@') \
    .replace('packages/vivi-lib/src', '@') \
    .replace('projects/stk/src', '@') \
    .replace('src/', '@/') \
    .replace('../', '')

def removeTs(path: str):
  return path.replace('.ts', '')

def removeIndex(path: str):
  return path.replace('/index.ts', '')

def toLib(path: str):
  return path.replace('@/', '@nu/vivi-lib/')

def path2Target(path: str):
  return removePrefix(removeTs(removeIndex(path)))

def path2Lib(path: str):
  return toLib(removePrefix(removeTs(removeIndex(path))))

def camel_case(s):
  s = re.sub(r"(_|-)+", " ", s)
  s = re.sub(r"()(?=[A-Z])", " ", s)
  s = s.title()
  s = s.replace(" ", "")
  return ''.join([s[0].lower(), s[1:]])

def getDefaultExportName(path):
  filename = re.search(r'\/([^\/.]+)\.(vue|ts)$', path).group(1)
  filename = camel_case(filename) if not '.vue' in path else filename
  if filename == 'index': # index.ts file, use dir name instead.
    filename = re.search(r'\/([^\/]+)\/index\.ts', path).group(1)
  
  # Some special case filename.
  if '/apis/user' in path:
    filename = 'userApis'
  elif '/store/module/text' in path:
    filename = 'textStock'
  elif '/apis/index' in path:
    filename = 'axios'

  return filename

libPaths = glob.glob('../packages/vivi-lib/src/**/*.vue', recursive=True) \
  + glob.glob('../packages/vivi-lib/src/**/*.ts', recursive=True)
libPaths.sort(key=lambda s: path2Target(s.lower()))

paths = []
for proj in ['vivipic', 'stk']:
  paths.extend(glob.glob(f'../projects/{proj}/src/**/*.vue', recursive=True))
  paths.extend(glob.glob(f'../projects/{proj}/src/**/*.ts', recursive=True))

importLines: set[str] = set()
for path in paths:
  with open(path) as file:
    # Process multiline import
    rawLines = file.readlines()
    lines = ''.join(rawLines)
    lines = lines.replace(',\n  ', ', ') \
      .replace('{\n  ', '{ ') \
      .replace('\n} from', ' } from')
    lines = lines.split('\n')
    lines = list(map(lambda s: s + '\n', lines))

    for line in lines:
      if line.startswith('import type') or line.startswith('//'):
        continue
      if re.search(r'(^import |import\()', line):
        importLines.add(line)
importLines: list[str] = list(importLines)

result: dict[str, list[str]] = {}
result['imports'] = []
result['call'] = []

for libPath in libPaths:
  if 'src/main' in libPath:
    continue
  default = False
  named = set()

  # Collect default and named import from pic & stk.
  for line in importLines:
    if not f"'{path2Lib(libPath)}'" in line:
      continue

    if re.search(r'import \w+', line) or \
      re.search(r'import\(\'@nu/vivi-lib', line):
      default = True
    matchNamed = re.search(r'import [\w, ]*\{ ([\w, ]+) \}', line)
    if matchNamed:
      for n in matchNamed.group(1).split(', '):
        if ' as ' in n:
          continue
        named.add(n)

  # Discard named import types.
  with open(libPath) as lib:
    for line in lib.readlines():
      matchType = re.search('export (type|interface) (\w+)', line)
      if matchType:
        named.discard(matchType.group(2))
    
  named = list(named)
  named.sort(key=str.lower)
  defaultExport = getDefaultExportName(libPath) if default else ''
  namedExport = f'{{\n  {sep.join(named)},\n}}' if len(named) > 0 else ''
  connect = ', ' if default and len(named) else ''
  importContent = f'{defaultExport}{connect}{namedExport}'
  if importContent == '':
    continue
  result['imports'].append(f'import {importContent} from \'{path2Target(libPath)}\'')
  exportContent = ([defaultExport] if default else []) + named
  result['call'].append(sep.join(exportContent))

result = '// To keep some variable export, import them here.\n' + \
  '\n'.join(result['imports']) + \
  '\n\n!window && console.log(\n  ' + \
  sep.join(result['call']) + \
  ',\n)\n'

with open('../packages/vivi-lib/src/imports.ts', 'w') as lib:
  lib.write(result)
print('Done')
