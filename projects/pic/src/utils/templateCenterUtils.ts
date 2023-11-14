import useWaterfall from '@nu/vivi-lib/composable/useWaterfall'
import { IAssetTemplate } from '@nu/vivi-lib/interfaces/api'
import { ITemplate } from '@nu/vivi-lib/interfaces/template'

class TemplateCenterUtils {
  generateWaterfall(templates: { list: IAssetTemplate[] }, columns: number, scale = 4): ITemplate[][] {
    const list = (templates.list ?? []).map(
      (t) => this.iAssetTemplate2Template(t, scale)
    )
    return useWaterfall(list, columns)
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
}

export default new TemplateCenterUtils()
