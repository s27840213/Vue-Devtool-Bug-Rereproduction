import json
import subprocess
import re
import glob

importResult = []
exportResult = []
sep = ", \n  "

def camel_case(s):
  s = re.sub(r"(_|-)+", " ", s)
  s = re.sub(r"()(?=[A-Z])", " ", s)
  s = s.title()
  s = s.replace(" ", "")
  return ''.join([s[0].lower(), s[1:]])

def getDefaultExportName(path):
  filename = re.search('\/([^\/]+)\.(vue|ts)', path).group(1)
  filename = camel_case(filename) if not re.search('.vue', path) else filename
  if filename == 'index': # index.ts file, use dir name instead.
    filename = re.search('\/([^\/]+)\/index\.ts', path).group(1)
  
  # Some special case filename.
  if path == 'src/apis/user.ts':
    filename = 'userApis'
  elif path == 'src/store/module/text.ts':
    filename = 'textStock'
  elif path == 'src/apis/index.ts':
    filename = 'axios'

  return filename

filePaths = glob.glob('packages/vivi-lib/src/**/*.ts', recursive=True) \
  + glob.glob('packages/vivi-lib/src/**/*.vue', recursive=True)
filePaths.sort()

for path in filePaths:
  if path.endswith('.d.ts') or \
    path == 'packages/vivi-lib/src/plugin.ts' or \
    path == 'packages/vivi-lib/src/types.ts':
    continue
  with open(path) as f:
    path = path.replace('packages/vivi-lib/', '')
    default = False
    named = []
    for line in f.readlines():
      if line.startswith('export default'): # For default export
        default = True
        continue

      pattern = r'^export (?:interface|type|abstract class|class|const|enum|async function|function) (\w+)[ :(<]'
      match = re.search(pattern, line)
      if match: # For one line export
        named.append(match.group(1))
        continue
      if line.startswith('export'): # For multi-line export special case
        if path == 'src/utils/queueUtils.ts':
          named.append('globalQueue')
          named.append('EventQueue')
        if path == 'src/utils/unitUtils.ts':
          named.append('STR_UNITS')
          named.append('PRECISION')
    
    if not default and len(named) == 0:
      continue
    
    defaultExport = getDefaultExportName(path) if default else ''
    namedExport = f'{{\n  {sep.join(named)}\n}}' if len(named) > 0 else ''
    connect = ', ' if default and len(named) else ''
    importContent = f'{defaultExport}{connect}{namedExport}'
    fromPath = path.replace('src/', '@/').replace('.ts', '')
    importResult.append(f'import {importContent} from \'{fromPath}\'')
    exportContent = ([defaultExport] if default else []) + named
    exportResult.append(f'  // From {fromPath}\n  {sep.join(exportContent)},')

result = '\n'.join(importResult) + '\n\nexport {' + '\n'.join(exportResult) + '\n}\n'
subprocess.run("pbcopy", text=True, input=result)
print('Result copied to clipboard.')
