import glob
import re
import os
import subprocess

project = 'stk'

def removePrefix(path: str):
  return path.replace('projects/vivipic/src', '@') \
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
  return removeFileName(removeTs(removePrefix(path)))

libPaths = glob.glob('packages/vivi-lib/src/**/*.vue', recursive=True) \
  + glob.glob('packages/vivi-lib/src/**/*.ts', recursive=True)
libPaths.sort()
# libPaths.reverse()

picPaths = glob.glob(f'projects/{project}/src/**/*.vue', recursive=True) \
  + glob.glob(f'projects/{project}/src/**/*.ts', recursive=True)

for proj in ['vivipic']:
  paths = glob.glob(f'projects/{proj}/src/**/*.vue', recursive=True) \
    + glob.glob(f'projects/{proj}/src/**/*.ts', recursive=True)
  paths = map(path2Target, paths)

  
