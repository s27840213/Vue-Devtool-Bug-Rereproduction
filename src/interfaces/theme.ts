export interface Itheme {
    id: number,
    width: number,
    height: number,
    title: string,
    description: string,
    url: string
}

export interface ICoverTheme {
    id: number,
    coverId: string,
    options: string[]
}

/* eslint-disable camelcase */
export interface IThemeTemplate {
    key_id: string,
    theme_ids: string
}
