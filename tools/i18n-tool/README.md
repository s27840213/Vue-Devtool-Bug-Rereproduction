# i18n parser

It's a simple project which generate i18n format json parsed from google sheet

## How to setup

### 1. Activate venv

```
source ./venv/bin/activate # zsh, Mac
```

### 2. Install requirements

```
pip install -r requirements.txt
```

### 3. Run !!!

```
python get_translation.py
```

### (4.) Deactivate venv (if you want)

```
deactivate
```

## How to set soft link to i18n result folder
1. `cd` to target folder, it is necessary.
```
cd projects/vivipic/src/i18n
```
2. ln -s source target
```
ln -s ../../../../tools/i18n-tool/result full
```

## Related Reference

[brew](https://brew.sh/index_zh-tw)

[pipenv](https://github.com/pypa/pipenv)

[gspread](https://gspread.readthedocs.io/en/latest/oauth2.html#service-account)

[Python Gspread Tutorial + How To Use the Google Sheets API with Python](https://www.youtube.com/watch?v=ddf5Z0aQPzY)

[venv](https://docs.python.org/zh-tw/3/library/venv.html#module-venv)
