const fs = require('fs')
const open = require('open')

const config = JSON.parse(fs.readFileSync('./preview.json'))

const HOSTS = {
  local: 'http://localhost:8080',
  rd: 'https://rd.vivipic.com',
  test: 'https://test.vivipic.com',
  vivipic: 'https://vivipic.com'
}

const host = config.host
let usedHost = HOSTS.local

if (host) {
  if (HOSTS[host]) {
    usedHost = HOSTS[host]
  } else if (host.startsWith('dev')) {
    usedHost = `https://${host}.vivipic.com`
  }
}

for (const pageIndex of config.page_index.split(',')) {
  for (const exportId of config.export_id.split(',')) {
    const url = `${usedHost}/preview?url=template.vivipic.com%2Fexport%2F${config.team_id}%2F${exportId}%2Fpage_${pageIndex}.json&ver=vKIHd0sC&token=QT0z7B3D3ZuXVp6R&team_id=PUPPET`

    open(url)
  }
}

// page_index則是從0開始，假設當前設計有5頁，要看第一頁的render結果，page_index請填0，看第二頁則填1...
