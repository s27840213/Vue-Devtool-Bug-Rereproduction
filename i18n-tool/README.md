# i18n parser
It's a simple project which generate i18n format json parsed from google sheet 

## How to setup

### 0.5. Install brew if you don't have one
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 1. Install pyenv
```
brew update
brew install pyenv
```

### 2. Install pipenv. (To avoid `command not found: pipenv`, use sudo to install it.)
```
sudo pip install pipenv
```

### 3. Installs all packages specified in Pipfile.lock.
```
cd /to/this/folder
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
python get_translation.py
```


## Related Reference

[brew](https://brew.sh/index_zh-tw)

[pipenv](https://github.com/pypa/pipenv)

[gspread](https://gspread.readthedocs.io/en/latest/oauth2.html#service-account)

[Python Gspread Tutorial + How To Use the Google Sheets API with Python](https://www.youtube.com/watch?v=ddf5Z0aQPzY)