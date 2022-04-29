import store from '@/store'
import file from '@/apis/file'
import userApis from '@/apis/user'
import _ from 'lodash'
import apiUtils from '@/utils/apiUtils'
import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { captureException } from '@sentry/browser'
import { IAssetPhoto, IUserImageContentData } from '@/interfaces/api'
import { IFrame, IGroup, IImage } from '@/interfaces/layer'
import { SrcObj } from '@/interfaces/gallery'
interface IPhotoState {
  myfileImages: Array<IAssetPhoto>,
  editorViewImages: Record<string, Record<string, string>>,
  checkedAssets: Array<number>,
  pending: boolean,
  initialized: boolean,
  setLayersDone: boolean
  pageIndex: number,
  uploadingAssets: Array<{ id: string, pageIndex: number }>
}

const getDefaultState = (): IPhotoState => ({
  myfileImages: [],
  editorViewImages: {},
  checkedAssets: [],
  pending: true,
  initialized: false,
  setLayersDone: false,
  pageIndex: 0,
  uploadingAssets: []
})

const state = getDefaultState()

function addPerviewUrl(data: any[]) {
  const isAdmin = store.getters['user/isAdmin']
  const teamId = store.getters['user/getTeamId']
  const userId = store.getters['user/getTeamId']

  return data.map((image: IUserImageContentData) => {
    const aspectRatio = image.width / image.height
    const prevW = image.width > image.height ? image.width : 384 * aspectRatio
    const prevH = image.height > image.width ? image.height : 384 / aspectRatio
    return {
      width: image.width,
      height: image.height,
      id: image.id,
      assetIndex: image.asset_index,
      preview: {
        width: prevW,
        height: prevH
      },
      urls: {
        prev: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/prev` : image.signed_url?.prev ?? '',
        full: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/full` : image.signed_url?.full ?? '',
        larg: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/larg` : image.signed_url?.larg ?? '',
        original: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/original` : image.signed_url?.original ?? '',
        midd: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/midd` : image.signed_url?.midd ?? '',
        smal: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/smal` : image.signed_url?.smal ?? '',
        tiny: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/tiny` : image.signed_url?.tiny ?? ''
      }
    }
  })
}

function isPrivate(srcObj: SrcObj): string {
  return (srcObj && srcObj.type === 'private') ? srcObj.assetId.toString() : ''
}

function addMyfile(response: [IUserImageContentData], pageIndex: number): void {
  const data: Record<string, any> = {}
  for (const img of response) {
    data[img.asset_index] = img.signed_url
  }

  if (!store.getters['user/isAdmin']) {
    store.commit('file/SET_STATE', {
      editorViewImages: Object.assign({}, state.editorViewImages, data)
    })
  }

  store.commit('file/SET_STATE', {
    myfileImages: state.myfileImages.concat(addPerviewUrl(response)),
    pageIndex: pageIndex,
    pending: false,
    initialized: true
  })
}

const actions: ActionTree<IPhotoState, unknown> = {
  async getMoreMyfiles({ commit }) {
    const { pageIndex } = state

    if (pageIndex === -1) {
      return
    }

    commit('SET_STATE', { pending: true })
    try {
      const rawData = await apiUtils.requestWithRetry(() => file.getFiles({ pageIndex }))
      addMyfile(rawData.data.data.image.content, rawData.data.next_page)
    } catch (error) {
      captureException(error)
    }
  },
  async deleteAssets({ commit }) {
    try {
      const keyList = state.checkedAssets.join(',')
      const params = {
        token: userApis.getToken(),
        locale: userApis.getLocale(),
        team_id: userApis.getTeamId(),
        type: 'image',
        update_type: 'delete',
        src_asset: keyList,
        target: '1'
      }
      userApis.updateAsset({ ...params }).then(() => {
        commit('SET_STATE', {
          checkedAssets: [],
          myfileImages: state.myfileImages.filter((item: IAssetPhoto) => {
            return !state.checkedAssets.includes(item.assetIndex as number)
          })
        })
      })
    } catch (error) {
      console.log(error)
    }
  },
  async updatePageImages({ dispatch }, { pageIndex }: { pageIndex: number }) {
    const { layers, backgroundImage } = store.state.pages[pageIndex]
    const imgToRequest = new Set<string>()

    imgToRequest.add(isPrivate(backgroundImage.config.srcObj))
    for (const layer of layers) {
      const targets = layer.type === 'group' ? (layer as IGroup).layers : [layer]

      for (const target of targets) {
        switch (target.type) {
          case 'image':
            imgToRequest.add(isPrivate((target as IImage).srcObj))
            break
          case 'frame':
            for (const clip of (target as IFrame).clips) {
              imgToRequest.add(isPrivate(clip.srcObj))
            }
            break
        }
      }
    }

    imgToRequest.delete('') // delete empty asset id
    await dispatch('updateImages', { assetSet: imgToRequest })
  },
  async updateImages({ commit }, { assetSet }) {
    // Request unknown private image url
    // If you want to reduce redundant update asset, assetSet should be Set<string>.
    // If you want to force update expired image, assetSet should be Set<number>, therefore diff will not take effect.

    const token = userApis.getToken()
    assetSet = _.difference(Array.from(assetSet), Object.keys(state.editorViewImages))
    assetSet = Array.from(assetSet).join(',')
    if (assetSet.length === 0) {
      return
    }

    await apiUtils.requestWithRetry(() => userApis.getAllAssets(token, {
      asset_list: assetSet
    })).then((data) => {
      commit('SET_STATE', {
        editorViewImages: Object.assign({}, state.editorViewImages, data.data.url_map)
      })
    })
  },
  initImages({ commit }, { imgs }: { 'imgs': [IUserImageContentData] }) {
    if (state.initialized) {
      return
    }

    addMyfile(imgs, imgs.length)
  }
}

const mutations: MutationTree<IPhotoState> = {
  SET_setLayersDone() {
    state.setLayersDone = true
  },
  SET_STATE(state: IPhotoState, data: Partial<IPhotoState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IPhotoState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as any) = newState[key]
        }
      })
  },
  UPDATE_CHECKED_ASSETS(state: IPhotoState, val) {
    state.checkedAssets = [...val]
  },
  ADD_CHECKED_ASSETS(state: IPhotoState, id) {
    state.checkedAssets.push(id)
  },
  DELETE_CHECKED_ASSETS(state: IPhotoState, index: number) {
    const targetIndex = state.checkedAssets.findIndex((assetIndex) => {
      return assetIndex === index
    })
    state.checkedAssets.splice(targetIndex, 1)
  },
  CLEAR_CHECKED_ASSETS(state: IPhotoState) {
    state.checkedAssets = []
  },
  ADD_PREVIEW(state: IPhotoState, { imageFile, assetId }) {
    const previewImage = {
      width: imageFile.width,
      height: imageFile.height,
      id: assetId,
      assetIndex: assetId,
      progress: 0,
      preview: {
        width: imageFile.width,
        height: imageFile.height
      },
      urls: {
        prev: imageFile.src,
        full: imageFile.src,
        larg: imageFile.src,
        original: imageFile.src,
        midd: imageFile.src,
        smal: imageFile.src,
        tiny: imageFile.src
      }
    }
    state.myfileImages.unshift(previewImage)
  },
  UPDATE_PROGRESS(state: IPhotoState, { assetId, progress }) {
    const targetIndex = state.myfileImages.findIndex((img: IAssetPhoto) => {
      return img.id === assetId
    })
    state.myfileImages[targetIndex].progress = progress
  },
  UPDATE_IMAGE_URLS(state: IPhotoState, { assetId, urls, assetIndex, type = 'private' }) {
    const { myfileImages } = state

    const isAdmin = type === 'public'
    const targetIndex = state.myfileImages.findIndex((img: IAssetPhoto) => {
      return isAdmin ? img.id === assetId : img.assetIndex === assetId
    })

    const data = addPerviewUrl([{
      width: myfileImages[targetIndex].width,
      height: myfileImages[targetIndex].height,
      id: isAdmin ? assetId : undefined,
      asset_index: assetIndex ?? assetId,
      signed_url: urls
    }])

    // state.myfileImages[targetIndex] = Object.assign({}, data[0])
    // Below code reduandont but and work, above don't work, src will get data:image/...
    state.myfileImages[targetIndex].urls = data[0].urls
    state.myfileImages[targetIndex].id = isAdmin ? assetId : undefined
    state.myfileImages[targetIndex].assetIndex = assetIndex ?? assetId
    state.editorViewImages[data[0].assetIndex] = data[0].urls
  },
  SET_UPLOADING_IMGS(state: IPhotoState, { id, adding, pageIndex }) {
    const index = state.uploadingAssets.findIndex(e => e.id === id)
    if (adding) {
      index === -1 && state.uploadingAssets.push({ id, pageIndex })
    } else {
      index !== -1 && state.uploadingAssets.splice(index, 1)
    }
  }
}

const getters: GetterTree<IPhotoState, any> = {
  getSetLayersDone(state) {
    return state.setLayersDone
  },
  getImages(state) {
    return state.myfileImages
  },
  getCheckedAssets(state) {
    return state.checkedAssets
  },
  getEditorViewImages: (state) => (assetId: string | undefined = undefined) => {
    return assetId ? state.editorViewImages[assetId] : state.editorViewImages
  },
  getUploadingImgs(state): Array<{ id: string, pageIndex: number }> {
    return state.uploadingAssets
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as ModuleTree<IPhotoState>
