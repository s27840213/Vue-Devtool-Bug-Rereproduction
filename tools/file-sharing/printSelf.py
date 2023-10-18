import os
import glob
import re

# ======= config =======
mode = 'insert' # 'insert' | 'erase'
# mode = 'erase' # 'insert' | 'erase'
project = 'vivipic' # 'vivipic' | 'stk' | 'charmix'
# project = 'stk' # 'vivipic' | 'stk' | 'charmix'
# ======= config =======


root = os.getcwd()

# For .vue
file_paths = glob.glob(f"{root}/projects/{project}/src/**/*.vue", recursive=True)
count = 0

for file_path in file_paths:
  consoleContent = file_path.replace(f"{root}/projects/{project}/src", "@")
  with open(file_path) as file:
    lines = file.read()

    if mode == 'insert':
      # For composition api
      if re.search('<script .*setup.*>', lines):
        lines = lines.replace('</script>', f'</script>\n<script lang="ts">\nconsole.log(\'{consoleContent}\')\n</script>')
      # For option api
      else:
        lines = lines.replace('</script>', f'console.log(\'{consoleContent}\')\n</script>')
    elif mode == 'erase':
      lines = lines.replace(f'\n<script lang="ts">\nconsole.log(\'{consoleContent}\')\n</script>', '')
      lines = lines.replace(f'console.log(\'{consoleContent}\')\n', '')

  with open(file_path, "w") as file:
    file.writelines(lines)
  count += 1

print(f"Replace {count} .vue files.")

# For .ts
file_paths = glob.glob(f"{root}/projects/{project}/src/**/*.ts", recursive=True)
count = 0

for file_path in file_paths:
  consoleContent = file_path.replace(f"{root}/projects/{project}/src", "@")
  with open(file_path) as file:
    lines = file.read()

    if mode == 'insert':
      lines = re.sub('$', f'\nconsole.log(\'{consoleContent}\')', lines, count = 1)
    elif mode == 'erase':
      lines = lines.replace(f'\nconsole.log(\'{consoleContent}\')', '')

  with open(file_path, "w") as file:
    file.writelines(lines)
  count += 1

print(f"Replace {count} .vue files.\nFinished.")

if mode == 'insert':
  with open(f'tools/file-sharing/{project}UsedRaw.txt', "w") as file:
    pass
