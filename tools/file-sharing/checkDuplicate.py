import glob

def processPath(path: str):
  return path.replace('projects/pic/', '') \
    .replace('packages/vivi-lib/', '') \

libPaths = glob.glob('packages/vivi-lib/**/*.vue', recursive=True) \
  + glob.glob('packages/vivi-lib/**/*.ts', recursive=True)

picPaths = glob.glob('projects/pic/**/*.vue', recursive=True) \
  + glob.glob('projects/pic/**/*.ts', recursive=True)

libPaths = map(processPath, libPaths)
picPaths = map(processPath, picPaths)

result = list(set(libPaths) & set(picPaths))
for r in result:
  if r.find('node_modules')!= -1:
    continue
  print(r)

