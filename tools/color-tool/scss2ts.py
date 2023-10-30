with open('result.txt', 'w') as w:
  with open('color.txt', 'r') as f:
    for line in f.readlines():
      line = line.replace('\n', '')
      line = line[:-1]
      key, hex = line.split(':')
      hex = hex.replace(' ', '')
      w.write(f"['{key}', '{hex}'],\n")
