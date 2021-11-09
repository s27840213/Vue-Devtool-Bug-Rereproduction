export interface ISvg {
    category: string;
    scaleType?: number;
    vSize: number[];
    styleArray: string[];
    color: string[];
    size?: number[];
    transArray?: string[];
    markerTransArray?: string[];
    svg: string;
    cSize?: number[];
    pSize?: number[];
    point?: number[];
    path?: string;
    dasharray?: number[],
    linecap?: 'butt' | 'round'
    markerId?: string[];
    markerWidth?: number[];
    trimWidth?: boolean[];
    trimOffset?: number[];
    filled?: boolean;
    shapeType?: string;
}

export interface IMarker {
    styleArray: string[];
    svg: string;
    trimWidth?: boolean;
    vSize: number[];
    trimOffset: number;
}
