import { IBleed } from '@/interfaces/page'

/* eslint-disable camelcase */
export interface Itheme {
    id: number
    width: number
    height: number
    unit: string
    title: string
    description: string
    url: string
    mainHidden: number
    editHidden: number
    bleed: IBleed
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
