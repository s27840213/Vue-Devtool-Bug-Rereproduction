# Check if the output matches the pattern
if [[ $(uname) == "Darwin" ]]; then
  python3 $@
else
  python $@
fi
