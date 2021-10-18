import { IFolder } from '@/interfaces/design'
import store from '@/store'
class DesignUtils {
  makeDesignsForTesting(): IFolder[] {
    return [
      {
        name: 'Toby',
        isExpanded: false,
        isSelected: false,
        designs: [
          {
            name: 'Name',
            width: 1200,
            height: 1200,
            id: '0',
            thumbnail: require('@/assets/img/png/mydesign/sample1.png')
          },
          {
            name: 'Name',
            width: 1200,
            height: 1200,
            id: '1',
            thumbnail: require('@/assets/img/png/mydesign/sample2.png')
          },
          {
            name: 'Name',
            width: 1200,
            height: 1200,
            id: '2',
            thumbnail: require('@/assets/img/png/mydesign/sample3.png')
          },
          {
            name: 'Name',
            width: 1200,
            height: 1200,
            id: '3',
            thumbnail: require('@/assets/img/png/mydesign/sample4.png')
          }
        ],
        subFolders: [
          {
            name: '素材1',
            isExpanded: false,
            isSelected: false,
            designs: [],
            subFolders: []
          },
          {
            name: '素材2',
            isExpanded: false,
            isSelected: false,
            designs: [],
            subFolders: [
              {
                name: '材質3',
                isExpanded: false,
                isSelected: false,
                designs: [],
                subFolders: [
                  {
                    name: '材質4',
                    isExpanded: false,
                    isSelected: false,
                    designs: [],
                    subFolders: [
                      {
                        name: '材質5',
                        isExpanded: false,
                        isSelected: false,
                        designs: [],
                        subFolders: []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        name: '日本行銷',
        isExpanded: false,
        isSelected: false,
        designs: [],
        subFolders: []
      }
    ]
  }

  makePath(selectInfo: string): string[] {
    return selectInfo.substring(2).split('/')
  }

  findFolder(folders: IFolder[], name: string): IFolder | undefined {
    for (const folder of folders) {
      if (folder.name === name) {
        return folder
      }
    }
  }

  findFolders(folders: IFolder[], name: string): IFolder[] {
    for (const folder of folders) {
      if (folder.name === name) {
        return folder.subFolders
      }
    }
    return []
  }

  search(folders: IFolder[], path: string[]): IFolder | undefined {
    const parents = path.slice(0, path.length - 1)
    const name = path[path.length - 1]

    let currentFolders = folders
    for (const parent of parents) {
      currentFolders = this.findFolders(currentFolders, parent)
    }
    return this.findFolder(currentFolders, name)
  }

  deselect(folders: IFolder[], selectInfo: string) {
    if (selectInfo.startsWith('f')) { // f:Toby/素材/材質
      const targetFolder = this.search(folders, this.makePath(selectInfo))
      if (targetFolder) {
        targetFolder.isSelected = false
      }
    }
  }

  select(folders: IFolder[], selectInfo: string) {
    if (selectInfo.startsWith('f')) { // f:Toby/素材/材質
      const targetFolder = this.search(folders, this.makePath(selectInfo))
      if (targetFolder) {
        targetFolder.isSelected = true
      }
    }
  }

  move(id: string, source: string[], destination: string[]) {
    const folders = store.getters['design/getFolders']
    const sourceFolder = this.search(folders, source)
    if (!sourceFolder) {
      console.log('source path doesn\'t exist')
      return
    }
    const designIndex = sourceFolder.designs.findIndex(design => design.id === id)
    if (designIndex === -1) {
      console.log('source design doesn\'t exist')
      return
    }
    const design = sourceFolder.designs[designIndex]
    sourceFolder.designs.splice(designIndex, 1)

    const destFolder = this.search(folders, destination)
    if (!destFolder) {
      console.log('destination path doesn\'t exist')
      return
    }
    destFolder.designs.push(design)
    store.commit('design/SET_folders', folders)
  }
}

export default new DesignUtils()
