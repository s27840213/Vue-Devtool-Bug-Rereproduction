import re
import os
import glob
import sys

'''
This script help you maintain temporary i18n.
Use this script, you can replace TMP{a} with NN{a+n} in whole project.
For example TMP0001 to NN0401.
It will replace prefix and add/sub the number below.

Follow these step to use this script:
0. Make sure you don't have any other git changes to prevent mess up
1. CD to this folder and run this script by `python3 i18n_rename.py`.
  If you don't have setting file, this step will create one for you.
2. Go to config/i18n_rename_setting to set params.
'''

default_setting = [
  '# 3. Replace with your prefix.',
  'PREFIX_BEFORE = "TMP"',
  'PREFIX_AFTER = "NN"',
  '# 4. Spicify serial range you want to replace.',
  'SERIAL_START = 1',
  'SERIAL_END = 9999',
  '# 5. Replace with the serial number difference between BEFORE and AFTER,',
  '#    can accept negative interger',
  'SERIAL_DIFFERENCE = 500',
  '# 6. Choose which file extension you want to replace',
  'FILE_EXTENSION = [',
  '  ".vue",',
  '  ".ts",',
  '  # ".json"',
  ']',
  '# 7. Done now run `python3 i18n_rename.py` again.',
  '#    It will replace {PREFIX_BEFORE}{N} to {PREFIX_AFTER}{N + SERIAL_DIFFERENCE}, ',
  '#    if SERIAL_START <= N <= SERIAL_END',
  '#    Next time you just need to start from step3.',
]

# If no setting file exist, create one.
if not os.path.exists("config/i18n_rename_setting.py"):
  with open("config/i18n_rename_setting.py", mode="w") as file:
    file.write("\n".join(default_setting))
  print("Create setting file successfully, please run this script again.")
  sys.exit(0)


# Excute i18n key replace.
from config.i18n_rename_setting import *

src = os.getcwd().replace("/i18n-tool", "/**/*")
for ext in FILE_EXTENSION:
  file_paths = glob.glob(f"{src}{ext}", recursive=True)
  count = 0
  print(f"Find {len(file_paths)} files with extension {ext}.")

  for file_path in file_paths:
    # Read and replace
    with open(file_path, mode="r") as file:
      lines = file.readlines()
      for i in range(len(lines)):
        start = 0
        
        while re.search(f"{PREFIX_BEFORE}\d{{4}}", lines[i][start:]):
          serial = int(re.search(f"{PREFIX_BEFORE}(\d{{4}})", lines[i][start:]).group(1))
          
          if (SERIAL_START <= serial <= SERIAL_END):
            lines[i] = lines[i][:start] + lines[i][start:].replace(
              f"{PREFIX_BEFORE}{str(serial).rjust(4, '0')}",
              f"{PREFIX_AFTER}{str(serial + SERIAL_DIFFERENCE).rjust(4, '0')}"
            )
            count+=1

          start = re.search(f"{PREFIX_AFTER}(\d{{4}})", lines[i][start:]).span()[0] + start + 1
    # Write back
    with open(file_path, mode="w") as file:
      file.writelines(lines)
      
  print(f"Finish, {count} times replace.")
