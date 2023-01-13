/* eslint-disable camelcase */
export interface IDesign {
  id: string,
  asset_index: number,
  name: string,
  width: number,
  height: number,
  unit: string,
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
  type: 'move-design' | 'move-designs' | 'move-folder' |
    'favor-design' | 'unfavor-design' | 'delete' |
    'undo-design' | 'undo-folder' | 'undo-multi' |
    'root-design' | 'root-folder' |
    'copy-link' | 'copy-design'
}
