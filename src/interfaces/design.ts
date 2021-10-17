export interface IDesign {
  name: string,
  width: number,
  height: number,
  thumbnail: string
}

export interface IFolder {
  name: string,
  isExpanded: boolean,
  isSelected: boolean,
  subFolders: IFolder[],
  designs: IDesign[]
}
