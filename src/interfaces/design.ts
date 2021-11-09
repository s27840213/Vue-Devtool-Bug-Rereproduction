export interface IDesign {
  id: string,
  name: string,
  width: number,
  height: number,
  thumbnail: string,
  createdTime: number,
  lastUpdatedTime: number
}

export interface IFolder {
  id: string,
  name: string,
  author: string,
  createdTime: number,
  lastUpdatedTime: number,
  isExpanded: boolean,
  isCurrLocation: boolean,
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

export interface IQueueItem {
  type: 'design' | 'folder' | 'multi',
  data: IPathedDesign | IPathedFolder | undefined
}
