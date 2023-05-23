import { IBleed } from '@/interfaces/page'

export interface ILayout {
    id: string;
    width: number;
    height: number;
    title: string;
    description: string;
    unit: string;
    icon: string
    bleed?: IBleed
}
