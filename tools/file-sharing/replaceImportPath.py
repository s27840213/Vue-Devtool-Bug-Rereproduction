import glob
import re
import os
import subprocess

def removePrefix(path: str):
  return path.replace('projects/vivipic/src', '@') \
    .replace('packages/vivi-lib/src', '@') \
    .replace('src/', '@/')

def removeTs(path: str):
  return path.replace('.ts', '')

def removeIndex(path: str):
  return path.replace('/index.ts', '')

def removeFileName(path: str):
  return re.sub(r'\/[^\/]+$', '/', path)

def path2Target(path: str):
  return removePrefix(removeTs(removeIndex(path)))

libPaths = glob.glob('packages/vivi-lib/src/**/*.vue', recursive=True) \
  + glob.glob('packages/vivi-lib/src/**/*.ts', recursive=True)

picPaths = glob.glob('projects/vivipic/src/**/*.vue', recursive=True) \
  + glob.glob('projects/vivipic/src/**/*.ts', recursive=True)


for libPath in libPaths:
  path = libPath.replace('packages/vivi-lib/', '')

  if not os.path.isfile(f'projects/vivipic/{path}'):
    # print(f'Not find {path}')
    continue

  with open(f'packages/vivi-lib/{path}') as lib:
    with open(f'projects/vivipic/{path}') as pic:

      libs = ''.join(lib.readlines())
      pics = ''.join(pic.readlines())
      libs = re.sub(r'import.+\n', '', libs)
      pics = re.sub(r'import.+\n', '', pics)
      if libs != pics:
        print(f'Mismatch {path}')
        continue

      target = path2Target(path)
      print(f'Search \'{target}\'')
      # userInput = input('Input N to skip: ')
      userInput = 'N'
      if userInput.upper() == 'N':
        continue

      for picPath in picPaths:
        if not os.path.isfile(picPath):
          continue
        with open(picPath) as pic:
          subPicPath = removeFileName(removeTs(removePrefix(picPath)))
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
        f'./projects/vivipic/{path}',
      ])

      userInput = input('Input 0 to insert import: ')
      # # if not os.path.isfile(f'projects/vivipic/dist/{target}.es.js'.replace('@/', 'src/')):
      # #   print(f'Not projects/vivipic/dist/{target}.es.js, need to add import!')
      if userInput != '0':
        continue
      with open('packages/vivi-lib/src/components.ts', 'r') as com:
        coms = com.readlines()
        for i, line in enumerate(coms):
          if line == '// insert import\n':
            coms[i] = old + line
          if line == '  // insert log\n':
            coms[i] = '  ' + re.search(r'import (.+) from', old).group(1) + ',\n' + line
      with open('packages/vivi-lib/src/components.ts', 'w') as com:
        com.writelines(coms)

