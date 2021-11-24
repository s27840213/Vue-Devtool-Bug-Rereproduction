import { ITemplate } from '@/interfaces/template'

class TemplateCenterUtils {
  generateWaterfall(templates: any): ITemplate[][] {
    const res = [[], [], [], [], [], []] as ITemplate[][]
    const ratios = [0, 0, 0, 0, 0, 0]
    console.log(templates)
    const list = templates.list ?? []
    for (const template of list) {
      const cover = template.match_cover
      const { width, height } = cover
      const ratio = height / width
      const index = this.lowestColumn(ratios)
      ratios[index] += ratio
      res[index].push({
        url: this.getPrevUrl(cover),
        id: cover.id,
        theme_id: cover.theme_id,
        prev_height: height / width * 100,
        width: cover.width,
        height: cover.height,
        type: 6,
        ver: cover.ver,
        content_ids: template.content_ids
      })
    }
    return res
  }

  getPrevUrl(item: {id: string, ver: number}): string {
    return `https://template.vivipic.com/template/${item.id}/prev_2x?ver=${item.ver}`
  }

  lowestColumn(ratios: number[]): number {
    let index = 0
    let lowest = ratios[0]
    for (const i in ratios) {
      const ratio = ratios[i]
      if (ratio < lowest) {
        index = parseInt(i)
        lowest = ratio
      }
    }
    return index
  }
}

export default new TemplateCenterUtils()
