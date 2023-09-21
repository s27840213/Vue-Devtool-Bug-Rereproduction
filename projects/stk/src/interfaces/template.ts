/* eslint-disable camelcase */

export interface IContentTemplate {
  id: string,
  ver: number,
  width: number,
  height: number,
  themes: string[],
  unit: string,
}
export interface ITemplate {
  url: string,
  id: string,
  theme_id: string,
  width: number,
  height: number,
  aspect_ratio: number,
  type: number,
  ver: number,
  plan: number,
  content_ids: IContentTemplate[],
  group_type: number
  group_id: string,
  unit: string
}
