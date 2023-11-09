<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)] box-border px-24")
  headerbar
    template(#left)
      back-btn(:customCallback="handleBackAction")
    template(#middle)
      span(class="typo-h5 text-app-text-secondary") {{ headerbarTitle }}
    template(#right)
  div(
    v-if="showInitOptions"
    class="grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)] box-border pt-10 overflow-scroll scrollbar-hide"
    ref="scrollContainer")
    div(
      class="w-full box-border p-24 rounded-[20px] flex flex-col items-center justify-between gap-16 gradient--yellow")
      div(class="w-full h-full flex items-center justify-between")
        div(class="flex flex-col items-start justify-between gap-12")
          div(class="typo-h1") {{ $t('CM0030').toUpperCase() }}
          div(class="typo-body-md") {{ $t('CM0033') }}
          div(class="typo-body-md") {{ $t('CM0034') }}
          div(class="typo-body-md") {{ $t('CM0035') }}
        img(src="@/assets/img/crown-3d.png" class="w-128 h-128")
      cm-btn(
        theme="primary"
        :hasIcon="true"
        iconName="crown"
        :full="true"
        @clickBtn="handleProBtnClick") {{ $t('CM0032') }}
    div(class="flex flex-col")
      div(class="text-app-btn-primary-text text-left flex flex-col gap-16 mt-20")
        div(class="w-full box-border py-4 border-b-[1px] border-primary-white")
          span(class="typo-h6") {{ $t('CM0036') }}
        function-bar(
          v-for="(data, index) in supportOptions"
          :key="index"
          :title="data.title"
          :iconName="data.iconName"
          @click="data.callback")
      div(class="text-app-btn-primary-text text-left flex flex-col gap-16 mt-20")
        div(class="w-full box-border py-4 border-b-[1px] border-primary-white")
          span(class="typo-h6") {{ $t('CM0040') }}
        function-bar(
          v-for="(data, index) in mediaOptions"
          :key="index"
          :title="data.title"
          :iconName="data.iconName"
          @click="data.callback")
      div(class="text-app-btn-primary-text text-left flex flex-col gap-16 mt-20")
        div(class="w-full box-border py-4 border-b-[1px] border-primary-white")
          span(class="typo-h6") {{ $t('CM0043') }}
        function-bar(
          v-for="(data, index) in aboutOptions"
          :key="index"
          :title="data.title"
          :iconName="data.iconName"
          @click="data.callback")
        span(class="text-primary-lighter typo-body-sm text-center" @click="handleDebugMode") {{ `1.0/1.0/ v.${buildNumber} ${domain}` }}
      div(v-if="debugMode" class="text-app-btn-primary-text text-left flex flex-col gap-16 mt-20")
        function-bar(
          v-for="(data, index) in debugOptions"
          :key="index"
          :title="data.title"
          :iconName="data.iconName"
          @click="data.callback")
        //- span(class="panel-vvstk-more__option-title version") {{ `${userInfo.appVer}/${userInfo.osVer}/${userInfo.modelName} ${buildNumber}${domain} ${hostId}` }}
  div(v-else-if="showDomainOptions")
    div(class="text-app-btn-primary-text text-left flex flex-col gap-16 mt-20")
      function-bar(
        v-for="(data, index) in domainOptions"
        :key="index"
        :title="data.title"
        :iconName="data.iconName"
        :active="data.title.includes(hostname)"
        @click="data.action")
</template>
<script setup lang="ts">
import { useGlobalStore } from '@/stores/global';
import vuex from '@/vuex';
import useI18n from '@nu/vivi-lib/i18n/useI18n';
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils';
import { storeToRefs } from 'pinia';

const scrollContainer = ref<HTMLElement | null>(null)

const { t } = useI18n()
const router = useRouter()
const hostname = window.location.hostname
// #region userInfo
const domain = `${window.location.hostname.replace('.vivipic.com', '')}`
const buildNumber = computed(() => {
  const { VUE_APP_BUILD_NUMBER: buildNumber } = import.meta.env
  return buildNumber ? `v.${buildNumber}` : 'local'
})

type OptionConfig = {
  title: string
  iconName: string
  action?: () => void
  selected?: () => boolean
}

const domainOptions = computed((): OptionConfig[] => {
  return [
    // {
    //   title: 'production',
    //   iconName: 'global',
    //   selected: () => {
    //     return window.location.hostname === 'sticker.vivipic.com'
    //   },
    //   action: () => {
    //     // this.switchDomain('sticker')
    //   },
    // },
    {
      title: 'rd',
      iconName: 'global',
      action: () => {
        cmWVUtils.switchDomain('https://cmrd.vivipic.com')
      },
    },
    {
      title: 'localhost:8080',
      iconName: 'global',
      action: () => {
        cmWVUtils.switchDomain('localhost:8080')
      },
    },
    {
      title: 'localhost:8081',
      iconName: 'global',
      action: () => {
        cmWVUtils.switchDomain('localhost:8081')
      },
    },
    {
      title: 'localhost:8082',
      iconName: 'global',
      action: () => {
        cmWVUtils.switchDomain('localhost:8082')
      },
    },
    ...Array(6)
      .fill(1)
      .map((_, index) => {
        const host = `dev${index}`
        return {
          title: host,
          iconName: 'global',
          action: () => {
            cmWVUtils.switchDomain(`https://stkdev${index}.vivipic.com`)
          },
        }
      }),
  ]
})
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
  } else if (showLanguageOptions.value) {
    setCurrState('')
  } else if (showDomainOptions.value) {
    setCurrState('')
  }
}
// #endregion

// #region init options
interface IFunctionBarData {
  title: string
  iconName: string
  callback: () => void
}

const supportOptions: Array<IFunctionBarData> = [
  {
    title: t('CM0037'),
    iconName: 'user-cycle',
    callback: () => {
      // if not login
      vuex.commit('user/setShowForceLogin', true)
      // setCurrState('account')
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

const mediaOptions: Array<IFunctionBarData> = [
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

const aboutOptions: Array<IFunctionBarData> = [
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

const debugOptions: Array<IFunctionBarData> = [
  {
    title: 'Domain選單',
    iconName: 'code-bracket-square',
    callback: () => {
      setCurrState('domain')
    },
  },
  {
    title: 'App事件測試',
    iconName: 'code-bracket-square',
    callback: () => {
      console.log('callback')
    },
  },
]
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
    nextTick(() => {
      scrollContainer.value?.scrollTo(0, scrollContainer.value.scrollHeight)
    })
  }
  debugModeTimer.value = window.setTimeout(() => {
    debugModeCounter.value = 0
    debugModeTimer.value = -1
  }, 1000)
}
// #endregion

// #region pro
const handleProBtnClick = () => {
  cmWVUtils.openPayment()
}
// #endregion
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
