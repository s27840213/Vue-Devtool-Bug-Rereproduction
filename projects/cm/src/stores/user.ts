import { IUserInfo } from '@nu/vivi-lib/utils/cmWVUtils'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const prevGenParams = reactive({
    requestId: '',
    prompt: '',
  })

  const setPrevGenParams = (params: { requestId: string; prompt: string }) => {
    Object.assign(prevGenParams, params)
  }

  const iosLaunchInfo = reactive<IUserInfo>({
    appVer: '',
    country: '',
    flag: '',
    homeIndicatorHeight: 0,
    hostId: '',
    isFirstOpen: false,
    locale: '',
    modelName: '',
    osVer: '',
    statusBarHeight: 0,
  })

  const appVer = computed(() => iosLaunchInfo.appVer)
  const country = computed(() => iosLaunchInfo.country)
  const flag = computed(() => iosLaunchInfo.flag)
  const homeIndicatorHeight = computed(() => iosLaunchInfo.homeIndicatorHeight)
  const hostId = computed(() => iosLaunchInfo.hostId)
  const isFirstOpen = computed(() => iosLaunchInfo.isFirstOpen)
  const locale = computed(() => iosLaunchInfo.locale)
  const modelName = computed(() => iosLaunchInfo.modelName)
  const osVer = computed(() => iosLaunchInfo.osVer)
  const statusBarHeight = computed(() => iosLaunchInfo.statusBarHeight)

  const setIosLaunchInfo = (info: IUserInfo) => {
    Object.assign(iosLaunchInfo, info)
  }

  return {
    prevGenParams,
    setPrevGenParams,
    iosLaunchInfo,
    setIosLaunchInfo,
    appVer,
    country,
    flag,
    homeIndicatorHeight,
    hostId,
    isFirstOpen,
    locale,
    modelName,
    osVer,
    statusBarHeight,
  }
})
