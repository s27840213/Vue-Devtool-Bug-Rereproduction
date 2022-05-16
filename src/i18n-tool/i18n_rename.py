import re
import os
import glob

'''
This script help you maintain temporary i18n.
Use this script, you can replace TMP{a} with NN{a+n} in whole project.
For example TMP0001 to NN0401.
It will replace prefix and add/sub the number below.
'''

# 0. Make sure you don't have any other git changes to prevent mess up
# 1. Replace with your prefix
PREFIX_BEFORE = "TMP"
PREFIX_AFTER = "TMP"
# 2. Spicify serial range you want to replace.
SERIAL_START = 62
SERIAL_END = 9999
# 3. Replace with the serial number difference between TMP and NN,
#    can accept negative interger
SERIAL_DIFFERENCE = 1
# 4. Choose which file extension you want to replace
FILE_EXTENSION = [
  ".vue",
  ".ts",
  # ".json"
]
# 5. CD to this folder and run this script by `python3 i18n_rename.py`

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

          start = re.search(f"{PREFIX_BEFORE}(\d{{4}})", lines[i][start:]).span()[0] + start + 1
    # Write back
    with open(file_path, mode="w") as file:
      file.writelines(lines)
      
  print(f"Finish, {count} times replace.")
