export interface IDesign {
  name: string,
  width: number,
  height: number,
  id: string,
  thumbnail: string,
  createdTime: number,
  lastUpdatedTime: number
}

export interface IFolder {
  name: string,
  author: string,
  createdTime: number,
  lastUpdatedTime: number,
  isExpanded: boolean,
  isSelected: boolean,
  subFolders: IFolder[],
  designs: IDesign[]
}

export interface IPathedDesign {
  design: IDesign,
  path: string[]
}
export interface IPathedFolder {
  parents: string[],
  folder: IFolder
}