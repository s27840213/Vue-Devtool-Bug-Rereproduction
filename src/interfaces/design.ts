/* eslint-disable camelcase */
export interface IDesign {
  id: string,
  asset_index: number,
  name: string,
  width: number,
  height: number,
  thumbnail: string,
  createdTime: string,
  lastUpdatedTime: string,
  favorite: boolean,
  ver: number,
  signedUrl?: {[key: string]: string},
  pageNum: number,
  polling: boolean
}

export interface IFolder {
  id: string,
  name: string,
  author: string,
  createdTime: string,
  lastUpdatedTime: string,
  isExpanded: boolean,
  isCurrLocation: boolean,
  subFolders: IFolder[]
}
export interface IPathedFolder {
  parents: string[],
  folder: IFolder
}

export interface IQueueItem {
  type: 'design' | 'folder' | 'multi',
  data: IDesign | IFolder | undefined,
  dest?: string
}

export interface IMobileMessageItem {
  type: 'move-design' | 'favor-design' | 'unfavor-design' | 'delete' | 'undo-design' | 'undo-folder' | 'copy-link' | 'copy-design'
}
