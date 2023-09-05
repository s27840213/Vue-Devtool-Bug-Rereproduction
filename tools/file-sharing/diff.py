import json
import re

# ======= config =======
target1 = 'stk'
target2 = 'vivipic'
# ======= config =======

with open(f"tools/file-sharing/{target1}Used.json") as file:
  set1: set[str] = set(json.load(file))
with open(f"tools/file-sharing/{target2}Used.json") as file:
  set2: set[str] = set(json.load(file))
with open(f"tools/file-sharing/allFiles.json") as file:
  setTotal: set[str] = set(json.load(file))

if len((set1 | set2) - setTotal) != 0:
  raise 'Error: some file in set1 or set2 but not in setTotal'

result = {}
result['both'] = set1 & set2
result['only1'] = set1 - set2
result['only2'] = set2 - set1
neither = setTotal - (set1 | set2)
result['exception'] = set([x for x in neither if re.search('(^@/interfaces/|.d.ts$)', x)])
result['neither'] = neither - result['exception']


for key in ['both', 'only1', 'only2', 'neither', 'exception']:
  result[key] = list(result[key])
  result[key].sort()

with open(f"tools/file-sharing/diffResult.json", "w") as file:
  json.dump(result, file, indent=2)
