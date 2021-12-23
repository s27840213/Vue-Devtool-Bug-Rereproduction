export interface ITemplate {
  url: string,
  id: string,
  theme_id: string,
  width: number,
  height: number,
  prev_height: number,
  type: number,
  ver: number,
  content_ids: IContentTemplate[],
  group_type?: number
  group_id?: string
}

export interface IContentTemplate {
  id: string,
  ver: number,
  width: number,
  height: number,
  themes: string[]
}