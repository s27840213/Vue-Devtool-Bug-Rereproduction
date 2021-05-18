export interface ISnaplinePos {
  v: number[],
  h: number[]
}
export interface ISnapline {
  pos: number,
  orientation?: string,
  offset: number,
  snapTo: string
}

export interface ISnaplineInfo {
  v: ISnapline[],
  h: ISnapline[]
}

export interface IConsideredEdges {
  pos: number,
  diff: number,
  offset: number,
  snapTo: string
}
