if ! command -v python3 &> /dev/null
then
    python i18n-tool/i18n_shake.py
else
    python3 i18n-tool/i18n_shake.py
fi
