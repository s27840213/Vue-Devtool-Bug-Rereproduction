import { ITemplate } from '@/interfaces/template'
import imageUtils from './imageUtils'

class TemplateCenterUtils {
  async generateWaterfall(templates: any): Promise<ITemplate[][]> {
    const res = [[], [], [], [], [], []] as ITemplate[][]
    const ratios = [0, 0, 0, 0, 0, 0]
    console.log(templates)
    const list = templates.list ?? []
    for (const template of list) {
      const url = this.getPrevUrl(template)
      const { width, height } = await imageUtils.getImageSize(url, 10, 10)
      const ratio = height / width
      const index = this.lowestColumn(ratios)
      ratios[index] += ratio
      res[index].push({
        url,
        id: template.id
      })
    }
    return res
  }

  getPrevUrl(item: {id: string, ver: number}): string {
    return `https://template.vivipic.com/template/${item.id}/prev?ver=${item.ver}`
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
