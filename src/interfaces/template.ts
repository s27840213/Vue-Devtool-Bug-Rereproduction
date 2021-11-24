export interface ITemplate {
  url: string,
  id: string,
  theme: string,
  width: number,
  height: number,
  prev_height: number,
  type: number,
  ver: number,
  content_ids: IContentTemplate[]
}

export interface IContentTemplate {
  id: string,
  ver: number,
  width: number,
  height: number,
  themes: string[]
}