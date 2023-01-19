import os
import sys
import json
import collections
import gspread
import numpy as np

class bcolors: # Colored terminal https://stackoverflow.com/a/287944
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

google_sheet_name = 'Vivipic Summary (nuDesign)'
works_sheet_name = 'i18n'
print(google_sheet_name, works_sheet_name)
gc = gspread.service_account(filename='config/client-secret.json')
sh = gc.open(google_sheet_name).worksheet(works_sheet_name)

def deep_set(_dict, key, value):
    keys = key.split('.')
    latest = keys.pop()
    for k in keys:
        _dict = _dict.setdefault(k, {})
    if value == '':
        _dict[latest] = ''
    elif value == '!empty' :
        _dict[latest] = ''
    else:
        _dict[latest] = value

# Get languages
langs = sh.row_values(1)[3:6]
print(langs)
# Construct recursive dictionary
all_result = []
for lang in langs:
    _dict = {}
    keys, values = [], []
    for row in sh.get_all_records():
        key = row.get('String ID')
        if key == '':
            continue
        value:str = row.get(lang)
        value = value.replace('@', "{'@'}")
        keys.append(key)
        values.append(value)
        deep_set(_dict, key, value)
    if lang == 'us':
        all_result.append(keys)
    all_result.append(values)
    
    output_dir_path = os.environ['OUTPUT_DIR_PATH']
    print('Output '+lang+ ' to:'   + output_dir_path)
    if not os.path.exists(output_dir_path):
        os.makedirs(output_dir_path)
    with open(f'{output_dir_path}{lang}.json', 'w', encoding='UTF-8') as f:
        json.dump(_dict, f, indent=2, ensure_ascii=False)

# Check for redundant translation
all_result = np.transpose(np.array(all_result), (1, 0))
skip_list = ['NN0064', 'NN0511', 'NN0059', 'NN0065', 'NN0017', 'NN0067', 'NN0063', 'NN0038', 'NN0030', 'NN0066', 'NN0112', 'NN0122', 'OG0002']
skip_mask = [r[0] not in skip_list for r in all_result] # False means skip
all_result = all_result[skip_mask]

unique, index, count = np.unique(
    all_result[:, 1:], axis = 0, return_counts=True, return_index=True)
duplicate_index = index[count>1]
duplicate = np.empty((0, 4))

for i in duplicate_index:
    duplicate = np.append(duplicate, all_result[i:i+1], axis=0)
    for j in range(i+1, len(all_result)):
        if (all_result[i, 1:] == all_result[j, 1:]).all():
            duplicate = np.append(duplicate, all_result[j:j+1], axis=0)

# If duplicate print error msg
if duplicate_index.shape[0] > 0:
    print(f'\n{bcolors.FAIL}Duplicated translation:\n{duplicate}\n{bcolors.ENDC}')
else:
    print(f'\n{bcolors.OKGREEN}No new duplicated translation found.{bcolors.ENDC}')
