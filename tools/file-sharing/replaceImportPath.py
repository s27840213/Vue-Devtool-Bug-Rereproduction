import glob
import os
import re
import subprocess

project = 'stk'

def removePrefix(path: str):
  return path.replace('projects/pic/src', '@') \
    .replace('packages/vivi-lib/src', '@') \
    .replace('projects/stk/src', '@') \
    .replace('src/', '@/')

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

libPaths = glob.glob('packages/vivi-lib/src/**/*.vue', recursive=True) \
  + glob.glob('packages/vivi-lib/src/**/*.ts', recursive=True)
libPaths.sort()
libPaths.reverse()

picPaths = glob.glob(f'projects/{project}/src/**/*.vue', recursive=True) \
  + glob.glob(f'projects/{project}/src/**/*.ts', recursive=True)

skip_list = """
  .d.ts
  i18n/index.ts
  module/text
  module/templates
  module/objects
  module/markers
  module/background
  module/listFactory
  module/font
  store/index
  router/index
  main.ts
  interfaces/module
  Popup.vue
  PanelColor.vue
  CategoryTextItem.vue
  CategoryTemplateItem.vue
  CategoryObjectItem.vue
  CategoryGroupTemplateItem.vue
  CategoryFontItem.vue
  CategoryBackgroundItem.vue
""".split('\n')

skip_list = list(filter(lambda x: x != '', map(lambda x: x.strip(), skip_list)))

for libPath in libPaths:
  to_skip = False
  for skip in skip_list:
    if skip in libPath: to_skip = True
  if to_skip: continue
  path = libPath.replace('packages/vivi-lib/', '')

  if not os.path.isfile(f'projects/{project}/{path}'):
    print(f'Not find {path}')
    continue

  with open(f'packages/vivi-lib/{path}') as lib:
    with open(f'projects/{project}/{path}') as pic:

      libs = ''.join(lib.readlines())
      pics = ''.join(pic.readlines())
      libs = re.sub(r'import.+\n', '', libs)
      pics = re.sub(r'import.+\n', '', pics)
      if libs != pics:
        print(f'Mismatch {path}')
        subprocess.run([
          'code', '--diff',
          f'./projects/{project}/{path}',
          f'./packages/vivi-lib/{path}',
        ])

      target = path2Target(path)
      print(f'Search \'{target}\'')
      userInput = input('Input N to skip: ')
      # userInput = 'N'
      if userInput.upper() == 'N':
        continue

      for picPath in picPaths:
        if not os.path.isfile(picPath):
          continue
        with open(picPath) as pic:
          subPicPath = path2SubPath(picPath)
          lines = pic.readlines()
          for i, line in enumerate(lines):
            if line.startswith('//'):
              continue
            line = line.replace('./', subPicPath)

            if re.search(f'\'{target}\'', line):
              # subprocess.run("pbcopy", text=True, input=line)
              old = line
              lines[i] = re.sub('@/', '@nu/vivi-lib/', line)
              print(f'old: {line}new: {lines[i]}')
        
        with open(picPath, 'w') as pic:
          pic.writelines(lines)

      print(f'rm {path}\n\n')
      subprocess.run([
        'rm',
        f'./projects/{project}/{path}',
      ])

      # userInput = input('Input 0 to insert import: ')
      # # if not os.path.isfile(f'projects/{project}/dist/{target}.es.js'.replace('@/', 'src/')):
      # #   print(f'Not projects/{project}/dist/{target}.es.js, need to add import!')
      # if userInput != '0':
      #   continue
      # with open('packages/vivi-lib/src/components.ts', 'r') as com:
      #   coms = com.readlines()
      #   for i, line in enumerate(coms):
      #     if line == '// insert import\n':
      #       coms[i] = old + line
      #     if line == '  // insert log\n':
      #       coms[i] = '  ' + re.search(r'import (.+) from', old).group(1) + ',\n' + line
      # with open('packages/vivi-lib/src/components.ts', 'w') as com:
      #   com.writelines(coms)

