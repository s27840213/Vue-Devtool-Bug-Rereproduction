# For Windows, run this command first: pnpm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"
# Check if the output matches the pattern
if [[ $(uname) == "Darwin" ]]; then
  python3 $@
else
  python $@
fi
