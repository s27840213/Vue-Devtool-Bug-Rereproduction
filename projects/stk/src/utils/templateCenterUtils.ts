import { IAssetTemplate } from '@/interfaces/api'
import { ITemplate } from '@/interfaces/template'

class TemplateCenterUtils {
  generateWaterfall(templates: any, columns: number, scale = 4): ITemplate[][] {
    const res = [] as ITemplate[][]
    const ratios = [] as number[]
    for (let i = 0; i < columns; i++) {
      res.push([])
      ratios.push(0)
    }
    const list = templates.list ?? []
    for (const template of list) {
      const cover = template.match_cover
      const { width, height } = cover
      const ratio = height / width
      const index = this.lowestColumn(ratios)
      ratios[index] += ratio
      res[index].push(this.iAssetTemplate2Template(template, scale))
    }
    return res
  }

  iAssetTemplate2Template(template: IAssetTemplate, scale: number): ITemplate {
    const cover = template.match_cover
    const { width, height } = cover
    const ratio = height / width
    return {
      url: this.getPrevUrl(cover, scale),
      id: cover.id,
      theme_id: cover.theme_id,
      aspect_ratio: ratio,
      width: cover.width,
      height: cover.height,
      unit: cover.unit,
      type: 6,
      ver: cover.ver,
      plan: template.plan,
      content_ids: template.content_ids,
      group_type: template.group_type,
      group_id: template.group_id
    }
  }

  getPrevUrl(item: { id: string, ver: number }, scale = 4): string {
    const postfix = scale === 1 ? 'prev' : `prev_${scale}x`
    return `https://template.vivipic.com/template/${item.id}/${postfix}?ver=${item.ver}`
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
