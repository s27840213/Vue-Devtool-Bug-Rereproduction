<template lang="pug">
div(class="settings w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)] box-border px-24")
  headerbar
    template(#left)
      back-btn(:customCallback="handleBackAction")
    template(#middle)
      span(class="typo-h5 text-white") {{ headerbarTitle }}
    template(#right)
  //- Use v-for and v-show to keep scroll position when state switch.
  div(
    v-for="[cKey, config] in Object.entries(configs)"
    v-show="cKey === currState"
    :key="cKey"
    class="grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)] gap-16 py-10 overflow-scroll scrollbar-hide")
    div(
      v-show="showInitOptions"
      class="w-full box-border p-24 rounded-20 flex-between-center flex-col gap-16 gradient--yellow")
      div(class="w-full h-full flex-between-center")
        div(class="flex-between-start flex-col gap-12")
          div(class="typo-h1") {{ $t('CM0030').toUpperCase() }}
          div(class="typo-body-md") {{ $t('CM0033') }}
          div(class="typo-body-md") {{ $t('CM0034') }}
          div(class="typo-body-md") {{ $t('CM0035') }}
        img(src="@/assets/img/crown-3d.png" class="w-128 h-128")
      nubtn(
        icon="crown"
        size="mid-full") {{ $t('CM0032') }}
    div(class="flex flex-col gap-16 text-white text-left typo-h6")
      template(
        v-for="op in config"
        :key="op.title")
        function-bar(
          v-if="op.iconName"
          :title="op.title"
          :iconName="op.iconName"
          :active="op.selected"
          :class="op.class"
          @click="op.callback")
        span(
          v-else
          :class="op.class"
          @click="op.callback") {{ op.title }}
</template>

<script setup lang="ts">
import { useGlobalStore } from '@/stores/global'
import vuex from '@/vuex'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import loginUtils from '@nu/vivi-lib/utils/loginUtils'
import { storeToRefs } from 'pinia'

interface IOptionConfig {
  title: string
  class?: string
  iconName?: string // Feature-bar has an iconName, while span does not.
  selected?: boolean
  callback?: () => void
}

const { t, tc } = useI18n()
const router = useRouter()
const hostname = window.location.hostname
// #region userInfo
const domain = `${hostname.replace('.vivipic.com', '')}`
const buildNumber = computed(() => {
  const { BITBUCKET_BUILD_NUMBER: buildNumber } = process.env
  return buildNumber ? `v.${buildNumber}` : 'local'
})
const userInfo = computed(() => vuex.getters['cmWV/getUserInfo'])
const userId = computed(() => vuex.getters['user/getUserId'])

const domainOptions = computed((): IOptionConfig[] => [
  {
    //   title: 'production',
    //   iconName: 'global',
    //   selected: () => {
    //     return hostname === 'sticker.vivipic.com'
    //   },
    //   action: () => {
    //     // this.switchDomain('sticker')
    //   },
    // }, {
    title: 'rd',
    iconName: 'global',
    selected: hostname.includes('cmrd'),
    callback: () => {
      cmWVUtils.switchDomain('https://cmrd.vivipic.com')
    },
  },
  ...Array(3)
    .fill(1)
    .map((_, index) => ({
      title: `localhost:808${index}`,
      iconName: 'global',
      selected: hostname.includes(`localhost:808${index}`),
      callback: () => {
        cmWVUtils.switchDomain(`localhost:808${index}`)
      },
    })),
  ...Array(6)
    .fill(1)
    .map((_, index) => ({
      title: `dev${index}`,
      iconName: 'global',
      selected: hostname.includes(`dev${index}`),
      callback: () => {
        cmWVUtils.switchDomain(`https://stkdev${index}.vivipic.com`)
      },
    })),
])
// #endregion

// #region settings state
const currState = ref('')
const setCurrState = (state: string) => {
  currState.value = state
}

const showInitOptions = computed(() => currState.value === '')
const showAccountOptions = computed(() => currState.value === 'account')
const showLanguageOptions = computed(() => currState.value === 'language')
const showDomainOptions = computed(() => currState.value === 'domain')

const headerbarTitle = computed(() => {
  if (showInitOptions.value) {
    return t('CM0047')
  } else if (showAccountOptions.value) {
    return t('CM0037')
  } else if (showLanguageOptions.value) {
    return t('CM0039')
  } else if (showDomainOptions.value) {
    return '選擇 Domain'
  }
  return ''
})

const handleBackAction = () => {
  if (showInitOptions.value) {
    router.push({ name: 'MyDesign' })
  } else if (currState.value) {
    setCurrState('')
  }
}
// #endregion

// #region debugMode section
const globalStore = useGlobalStore()
const { setDebugMode } = globalStore
const { debugMode } = storeToRefs(globalStore)

const debugModeTimer = ref(-1)
const debugModeCounter = ref(0)

const handleDebugMode = () => {
  if (debugModeTimer.value) {
    clearTimeout(debugModeTimer.value)
  }
  debugModeCounter.value++
  if (debugModeCounter.value === 7) {
    setDebugMode(!debugMode.value)
    // Scroll debug options into view to ensure users are aware of it.
    nextTick(() => {
      document.querySelector('.debug-option')?.scrollIntoView({ behavior: 'smooth' })
    })
  }
  debugModeTimer.value = window.setTimeout(() => {
    debugModeCounter.value = 0
    debugModeTimer.value = -1
  }, 1000)
}
// #endregion

// #region init options
const supportOptions: Array<IOptionConfig> = [
  {
    title: t('CM0037'),
    iconName: 'user-cycle',
    callback: () => {
      if (vuex.state.user.token === '') {
        // Open PanelLogin
        vuex.commit('user/setShowForceLogin', true)
      } else {
        setCurrState('account')
      }
    },
  },
  {
    title: t('CM0038'),
    iconName: 'film',
    callback: () => {
      console.log('callback')
    },
  },
  {
    title: t('CM0039'),
    iconName: 'language',
    callback: () => {
      setCurrState('language')
    },
  },
]

const mediaOptions: Array<IOptionConfig> = [
  {
    title: t('CM0041'),
    iconName: 'instagram',
    callback: () => {
      console.log('callback')
    },
  },
  {
    title: t('CM0042'),
    iconName: 'tiktok',
    callback: () => {
      console.log('callback')
    },
  },
]

const aboutOptions: Array<IOptionConfig> = [
  {
    title: t('CM0044'),
    iconName: 'star',
    callback: () => {
      console.log('callback')
    },
  },
  {
    title: t('CM0045'),
    iconName: 'chat-bubble',
    callback: () => {
      console.log('callback')
    },
  },
  {
    title: t('CM0046'),
    iconName: 'document-text',
    callback: () => {
      console.log('callback')
    },
  },
]

const debugOptions: Array<IOptionConfig> = [
  {
    title: 'Domain選單',
    class: 'debug-option',
    iconName: 'code-bracket-square',
    callback: () => {
      setCurrState('domain')
    },
  },
  {
    title: '進入 Native 事件測試器',
    class: 'debug-option',
    iconName: 'code-bracket-square',
    callback: () => {
      router.push({ name: 'NativeEventTester' })
    },
  },
]

const segmentTitleStyle = 'py-4 border-0 border-b-1 border-solid border-lighter/80'
const initOptions = computed(
  () =>
    [
      { title: t('CM0036'), class: segmentTitleStyle },
      ...supportOptions,
      { title: t('CM0040'), class: segmentTitleStyle },
      ...mediaOptions,
      { title: t('CM0043'), class: segmentTitleStyle },
      ...aboutOptions,
      {
        title: `${userInfo.value.appVer}/${userInfo.value.osVer}/${userInfo.value.modelName} ${buildNumber.value} ${domain} ${userInfo.value.hostId}:${userId.value}`, // Debug info
        class: 'typo-body-sm text-center text-lighter py-10',
        callback: handleDebugMode,
      },
      ...(debugMode.value ? debugOptions : []),
    ] as IOptionConfig[],
)
// #endregion

// #region account options
const accountOptions = computed(
  () =>
    [
      {
        title: tc('NN0167', 1),
        iconName: 'logout2',
        callback: loginUtils.logout,
      },
      {
        title: tc('NN0317', 1),
        iconName: 'info-warning',
        callback: () => {
          //
        },
      },
    ] as IOptionConfig[],
)
// #endregion

const configs = computed(
  () =>
    ({
      domain: domainOptions.value,
      account: accountOptions.value,
      '': initOptions.value,
    }) as Record<string, IOptionConfig[]>,
)
</script>
<style scoped lang="scss">
.gradient--yellow {
  background: linear-gradient(100deg, #ffd004 0.75%, #fff2a7 52.64%, #fff 105.53%);
  background: linear-gradient(
    100deg,
    color(display-p3 0.9922 0.8235 0.2824) 0.75%,
    color(display-p3 1 0.9529 0.6902) 52.64%,
    color(display-p3 1 1 1) 105.53%
  );
}
</style>
