import json
import os

import gspread
import numpy as np
from i18n_shake import main as shake
from util import bcolors, find_project_root

PROJECTS = ['vivipic', 'stk', 'charmix']

ROOT = find_project_root(os.getcwd())

for project in PROJECTS:
    print(project)
    LANG_START_INDEX = 3
    LANG_COUNT = 4 if project == 'stk' else 3

    google_sheet_name = 'Vivipic Summary (nuDesign)'
    works_sheet_name = 'charmix-i18n' if project == 'charmix' else 'i18n'
    print(google_sheet_name, works_sheet_name)
    gc = gspread.service_account(filename=f'{ROOT}/tools/i18n-tool/config/client-secret.json')
    sh = gc.open(google_sheet_name).worksheet(works_sheet_name)

    def deep_set(_dict, key, value):
        keys = key.split('.')
        latest = keys.pop()
        for k in keys:
            _dict = _dict.setdefault(k, {})
        if value == '':
            return
        elif value == '!empty' :
            _dict[latest] = ''
        else:
            _dict[latest] = value

    # Get languages
    langs = sh.row_values(1)[LANG_START_INDEX:LANG_START_INDEX + LANG_COUNT]
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
        
        output_dir_path = '/src/locales/'
        output_full_path = f'{ROOT}/projects/{project}{output_dir_path}'
        print('Output '+lang+ ' to:'   + output_full_path)
        if not os.path.exists(output_full_path):
            os.makedirs(output_full_path)
        with open(f'{output_full_path}{lang}.json', 'w', encoding='UTF-8') as f:
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

from argparse import Namespace

shake(Namespace(check = False, no_color = False))
