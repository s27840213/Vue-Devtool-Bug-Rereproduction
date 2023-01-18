import os
import sys
import gspread
import json

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
for lang in langs:
    _dict = {}
    for row in sh.get_all_records():
        key = row.get('String ID')
        if key == '':
            continue
        value = row.get(lang)
        deep_set(_dict, key, value)
    
    output_dir_path = os.environ['OUTPUT_DIR_PATH']
    print('Output '+lang+ ' to:'   + output_dir_path)
    if not os.path.exists(output_dir_path):
        os.makedirs(output_dir_path)
    with open(f'{output_dir_path}{lang}.json', 'w', encoding='UTF-8') as f:
        json.dump(_dict, f, indent=2, ensure_ascii=False)
