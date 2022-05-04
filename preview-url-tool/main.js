const fs = require('fs')
const open = require('open')

const config = JSON.parse(fs.readFileSync('./preview.json'))

for (const pageIndex of config.page_index.split(',')) {
  var url = `http://localhost:8080/preview?url=template.vivipic.com%2Fexport%2F${config.team_id}%2F${config.export_id}%2Fpage_${pageIndex}.json%3Fver%3DvKIHd0sC%26token%3DQT0z7B3D3ZuXVp6R%26team_id%3DPUPPET`

  open(url)
}

// page_index則是從0開始，假設當前設計有5頁，要看第一頁的render結果，page_index請填0，看第二頁則填1...
