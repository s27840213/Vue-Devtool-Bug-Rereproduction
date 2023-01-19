import os
import glob

root = os.getcwd()
file_paths = glob.glob(f"{root}/src/**/*.vue", recursive=True)
count = 0

for file_path in file_paths:
  with open(file_path, mode="r",encoding="utf-8") as file:
    lines = file.readlines()
    if not lines[1].startswith('  '):
      continue

    i = 1
    while not lines[i].startswith('</template>'):
      lines[i] = lines[i][2:]
      i+=1

  with open(file_path, mode="w",encoding="utf-8") as file:
    file.writelines(lines)
    count+=1
    
print(f"Finish, {count} files changed.")
