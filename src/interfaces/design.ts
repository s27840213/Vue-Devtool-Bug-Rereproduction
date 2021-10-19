export interface IDesign {
  name: string,
  width: number,
  height: number,
  id: string,
  thumbnail: string
}

export interface IFolder {
  name: string,
  isExpanded: boolean,
  isSelected: boolean,
  subFolders: IFolder[],
  designs: IDesign[]
}

export interface IDraggingDesign {
  path: string[],
  id: string
}

export interface IPathedDesign {
  design: IDesign,
  path: string[]
}

export interface ITraverseItem {
  parents: string[],
  folder: IFolder
}