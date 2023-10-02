import glob
import re
import subprocess

# ======= config =======
tpyesToSkip = [
  'CCategoryList',
  'CImageGallery',
  'PanelDownloadState',
  'SrcObj',
  'AllLayerTypes',
]
# ======= config =======

sep = ", \n  "

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

def removeFileName(path: str):
  return re.sub(r'\/[^\/]+$', '/', path)

def path2Target(path: str):
  return removePrefix(removeTs(removeIndex(path)))

def path2SubPath(path: str):
  return removePrefix(removeTs(removeFileName(path)))

def camel_case(s):
  s = re.sub(r"(_|-)+", " ", s)
  s = re.sub(r"()(?=[A-Z])", " ", s)
  s = s.title()
  s = s.replace(" ", "")
  return ''.join([s[0].lower(), s[1:]])

def getDefaultExportName(path):
  filename = re.search(r'\/([^\/.]+)(\.vue$|$)', path).group(1)
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
  elif '/i18n' in path:
    filename = 'i18n'

  return filename

libPaths = glob.glob('../packages/vivi-lib/src/**/*.vue', recursive=True) \
  + glob.glob('../packages/vivi-lib/src/**/*.ts', recursive=True)
libPaths = list(map(path2Target, libPaths))
libPaths.sort(key=str.lower)

paths = []
for proj in ['vivipic', 'stk']:
  paths.extend(glob.glob(f'../projects/{proj}/src/**/*.vue', recursive=True))
  paths.extend(glob.glob(f'../projects/{proj}/src/**/*.ts', recursive=True))

result: dict[str, list[str]] = {}
result['imports'] = []
result['call'] = []

for libPath in libPaths:
  if libPath == '@/main':
    continue
  default = False
  named = set()
  print(libPath, end='\r', flush = True)

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
        if line.startswith('//'):
          continue
        if not f"'{libPath.replace('@/', '@nu/vivi-lib/')}'" in line:
          continue

        if re.search(r'import \w+', line) or \
          re.search(r'import\(\'@nu/vivi-lib', line):
          default = True
        matchNamed = re.search(r'import [\w, ]*\{ ([\w, ]+) \}', line)
        if matchNamed:
          for n in matchNamed.group(1).split(', '):
            # Skip type defined
            if n.startswith('I') or n in tpyesToSkip:
              continue
            named.add(n)
    
  named = list(named)
  named.sort(key=str.lower)
  defaultExport = getDefaultExportName(libPath) if default else ''
  namedExport = f'{{\n  {sep.join(named)},\n}}' if len(named) > 0 else ''
  connect = ', ' if default and len(named) else ''
  importContent = f'{defaultExport}{connect}{namedExport}'
  if importContent == '':
    continue
  result['imports'].append(f'import {importContent} from \'{libPath}\'')
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
