import json
import subprocess

with open(f"tools/file-sharing/diffResultFinal.json") as file:
  d = json.load(file)
  names = []
  for b in d['only2']:
    b = b.replace('@/', 'src/')
    subprocess.run([
      'rm',
      f'./packages/vivi-lib/{b}',
    ])
