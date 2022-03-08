import store from '@/store'
import file from '@/apis/file'
import user from '@/apis/user'
import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { captureException } from '@sentry/browser'
import { IAssetPhoto, IUserImageContentData } from '@/interfaces/api'
import { AxiosResponse } from 'axios'

const SET_STATE = 'SET_STATE' as const
const UPDATE_CHECKED_ASSETS = 'UPDATE_CHECKED_ASSETS' as const
const DELETE_CHECKED_ASSETS = 'DELETE_CHECKED_ASSETS' as const
const ADD_CHECKED_ASSETS = 'ADD_CHECKED_ASSETS' as const
const CLEAR_CHECKED_ASSETS = 'CLEAR_CHECKED_ASSETS' as const
interface IPhotoState {
  list: Array<IAssetPhoto[]>,
  pageIndex: number,
  pending: boolean,
  checkedAssets: Array<number>
}

const getDefaultState = (): IPhotoState => ({
  list: [],
  pageIndex: 0,
  pending: false,
  checkedAssets: []
})

const state = getDefaultState()

function addPerviewUrl(rawData: AxiosResponse) {
  const isAdmin = store.getters['user/isAdmin']
  const teamId = store.getters['user/getTeamId']
  const userId = store.getters['user/getTeamId']

  return rawData.data.data.image.content.map((image: IUserImageContentData) => {
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

const actions: ActionTree<IPhotoState, unknown> = {
  async getFiles({ commit }) {
    const { list, pageIndex } = state

    if (pageIndex === -1) {
      return
    }

    commit(SET_STATE, { pending: true })
    try {
      const rawData = await file.getFiles({ pageIndex })
      const data = addPerviewUrl(rawData)
      commit(SET_STATE, {
        list: list.concat(data),
        pageIndex: rawData.data.next_page,
        pending: false
      })
    } catch (error) {
      captureException(error)
    }
  },
  async deleteAssets({ commit, dispatch }) {
    try {
      const keyList = state.checkedAssets.join(',')
      const params = {
        token: user.getToken(),
        locale: user.getLocale(),
        team_id: user.getTeamId(),
        type: 'image',
        update_type: 'delete',
        src_asset: keyList,
        target: '1'
      }
      user.updateAsset({ ...params }).then(() => {
        // commit(SET_STATE, {
        //   checkedAssets: [],
        //   list: state.list.filter((item: any) => {
        //     return !state.checkedAssets.includes(item.assetIndex)
        //   })
        // })
        commit(SET_STATE, {
          checkedAssets: [],
          list: [],
          pageIndex: 0
        })
        dispatch('getFiles')
      })
    } catch (error) {
      console.log(error)
    }
  }
}

const mutations: MutationTree<IPhotoState> = {
  [SET_STATE](state: IPhotoState, data: Partial<IPhotoState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IPhotoState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as any) = newState[key]
        }
      })
  },
  [UPDATE_CHECKED_ASSETS](state: IPhotoState, val) {
    state.checkedAssets = [...val]
  },
  [ADD_CHECKED_ASSETS](state: IPhotoState, id) {
    state.checkedAssets.push(id)
  },
  [DELETE_CHECKED_ASSETS](state: IPhotoState, index: number) {
    const targetIndex = state.checkedAssets.findIndex((assetIndex) => {
      return assetIndex === index
    })
    state.checkedAssets.splice(targetIndex, 1)
  },
  [CLEAR_CHECKED_ASSETS](state: IPhotoState) {
    state.checkedAssets = []
  }
}

const getters: GetterTree<IPhotoState, any> = {
  // getCurrentPageFile(state) {
  //   const { pageIndex, list } = state
  //   return list[pageIndex] || []
  // },
  // getNextParams(state) {
  //   const { pageIndex } = state
  //   return {
  //     pageIndex: pageIndex + 1
  //   }
  // }
  getCheckedAssets(state) {
    return state.checkedAssets
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as ModuleTree<IPhotoState>
