if [[ $(uname) == "Darwin" ]]; then
	echo "System: $(uname)"
  source i18n-tool/venv/bin/activate
else
	echo "System: $(uname)"
  i18n-tool/venv\Scripts\activate.bat
fi

python3 -m  pip install -r i18n-tool/requirements.txt

python3 i18n-tool/get_translation.py

deactivate