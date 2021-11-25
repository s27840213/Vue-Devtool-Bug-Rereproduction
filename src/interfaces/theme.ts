export interface Itheme {
    id: number,
    width: number,
    height: number,
    title: string,
    description: string,
    url: string
}

/* eslint-disable camelcase */
export interface IContentTemplate {
    key_id: string,
    index: number
}

export interface ICoverTheme {
    id: number,
    title: string,
    coverIndex: number,
    options: IContentTemplate[]
}

/* eslint-disable camelcase */
export interface IThemeTemplate {
    key_id: string,
    theme_ids: string
}
