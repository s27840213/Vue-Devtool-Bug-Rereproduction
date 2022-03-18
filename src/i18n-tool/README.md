# i18n parser
It's a simple project which generate i18n format json parsed from google sheet 

## How to setup

### 1. Install pyenv
```
brew update
brew install pyenv
```

### 2. Install pipenv
```
pip install pipenv
```

### 3. Installs all packages specified in Pipfile.lock.
```
pipenv sync
```

### 4. Config the path of output directory in .env file
```
// .env
OUTPUT_DIR_PATH=/the/path/your/want
```
### 5. Activate this project's virtual env
```
pipenv shell
```

### 6. Run !!!
```
python main.py [google_sheet_name] [works_sheet_name]


// for example
python main.py i18n Frontier21
```


## Related Reference

[pipenv](https://github.com/pypa/pipenv)

[gspread](https://gspread.readthedocs.io/en/latest/oauth2.html#service-account)

[Python Gspread Tutorial + How To Use the Google Sheets API with Python](https://www.youtube.com/watch?v=ddf5Z0aQPzY)