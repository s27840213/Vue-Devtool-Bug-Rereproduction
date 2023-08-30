const fs = require('fs')

const templateJson = {
  host: 'local',
  team_id: '<team_id>',
  export_id: '<export_id1>,<export_id2>,...',
  page_index: '<page_index1>,<page_index2>,...'
}

const data = JSON.stringify(templateJson, null, 2)

fs.writeFileSync('./preview.json', data)
