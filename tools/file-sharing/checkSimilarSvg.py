import glob
from difflib import SequenceMatcher

def processPath(path: str):
  return path.replace('projects/cm/', '') \
    .replace('packages/vivi-lib/', '') \

svgs = glob.glob('packages/vivi-lib/src/assets/icon/**/*.svg', recursive=True) \
  + glob.glob('projects/cm/src/assets/icon/**/*.svg', recursive=True)

for i in range(len(svgs)):
  with open(svgs[i]) as f1:
    svg1 = f1.readlines()
    for j in range(i+1, len(svgs)):
      with open(svgs[j]) as f2:
        svg2 = f2.readlines()
        if SequenceMatcher(None, svg1, svg2).ratio() > 0.9:
          print(svgs[i])
          print(svgs[j], '\n')
