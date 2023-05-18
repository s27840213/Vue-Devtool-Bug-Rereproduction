/* eslint-disable camelcase */
export interface Itheme {
    id: number
    width: number
    height: number
    title: string
    description: string
    url: string
    mainHidden: number
    editHidden: number
    unit: string
    bleed: {
        top: number
        bottom: number
        left: number
        right: number
    }
}

export interface IContentTemplate {
    key_id: string
    index: number
}

export interface ICoverTheme {
    id: number
    title: string
    coverIndex: number
    options: IContentTemplate[]
}

export interface IThemeTemplate {
    key_id: string
    theme_ids: string
}
