import glob

def processPath(path: str):
  return path.replace('projects/vivipic/', '') \
    .replace('packages/vivi-lib/', '') \

libPaths = glob.glob('packages/vivi-lib/**/*.vue', recursive=True) \
  + glob.glob('packages/vivi-lib/**/*.ts', recursive=True)

picPaths = glob.glob('projects/vivipic/**/*.vue', recursive=True) \
  + glob.glob('projects/vivipic/**/*.ts', recursive=True)

libPaths = map(processPath, libPaths)
picPaths = map(processPath, picPaths)

result = list(set(libPaths) & set(picPaths))
for r in result:
  if r.find('node_modules')!= -1:
    continue
  print(r)

