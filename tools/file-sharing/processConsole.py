import re
import json

# ======= config =======
project = 'vivipic' # 'vivipic' | 'stk' | 'charmix'
# project = 'stk' # 'vivipic' | 'stk' | 'charmix'
# ======= config =======

set = set()

with open(f"tools/file-sharing/{project}UsedRaw.txt") as file:
  for line in file.readlines():
    res = re.search('(@/.+\.(vue|ts))', line)
    if res:
      set.add(res.group(0))

result = list(set)
result.sort()

with open(f"tools/file-sharing/{project}Used.json", "w") as f:
  json.dump(result, f, indent=2)

print(f"Total {len(result)} files.")
