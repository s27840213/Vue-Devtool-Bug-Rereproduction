<template lang="pug">
div(class="native-event-tester")
  div(class="native-event-tester__leave" :style="leaveStyles" @click="goHome")
    svg-icon(iconName="chevron-left"
              iconWidth="24px"
              iconColor="white")
  div(class="native-event-tester__send-event")
    div(class="native-event-tester__title") SEND EVENT
    div(class="native-event-tester__row horizontal")
      div(class="native-event-tester__label") Event Name:
      input(class="native-event-tester__event-name" v-model="eventName")
    div(class="native-event-tester__row vertical")
      div(class="native-event-tester__label") Message Body:
      textarea(ref="paramsEle"
                class="native-event-tester__params"
                rows="5"
                v-model="eventParamsStr"
                @keydown.tab.prevent="insertAtCursor")
    div(class="native-event-tester__row horizontal flex-between")
      div(class="native-event-tester__option")
        checkbox(v-model="doAlertOnTimeout")
        div(class="native-event-tester__label-inverted") alert on timeout (5s)
      nubtn(class="native-event-tester__submit"
        theme="ghost"
        size="sm"
        :disabled="!eventParamsValid || eventName === ''"
        @click="submitEvent") SEND
    div(class="native-event-tester__row vertical")
      div(class="native-event-tester__label") Callbacks From Native:
      div(class="native-event-tester__callbacks scrollbar-gray-thin")
        div(class="native-event-tester__callback"
            :class="{ selected: checkRecordSelected(record) }"
            v-for="record in callbackRecords" :key="record.id"
            @click="selectRecord(record)")
          div(class="native-event-tester__label") {{ record.name }}
    div(class="native-event-tester__row horizontal flex-between")
      div(class="native-event-tester__option")
        checkbox(v-model="doClearOnSubmet")
        div(class="native-event-tester__label-inverted") clear on submit
      nubtn(class="native-event-tester__clear"
        theme="ghost"
        size="sm"
        @click="clearCallbacks") CLEAR
    div(v-if="selectedRecord" class="native-event-tester__row vertical native-event-tester__record-args")
      pre(class="native-event-tester__record-arg"
          v-for="arg in selectedRecord.args" :key="arg.toString()") {{ processedArg(arg) }}
</template>

<script setup lang="ts">
import Checkbox from '@/components/global/Checkbox.vue'
import { ICallbackRecord } from '@/interfaces/webView'
import autoWVUtils, { app, appType } from '@/utils/autoWVUtils'
import generalUtils from '@/utils/generalUtils'
import { notify } from '@kyvg/vue3-notification'
import { computed, nextTick, reactive, ref, watch, watchEffect } from 'vue'
import { useStore } from 'vuex'

enum mobileOSType {
  IOS,
  Android
}

const mobileOS = ref(mobileOSType.IOS) // TODO: auto-detect OS type

let callbackGroup = ''
switch (app) {
  case appType.Vivipic:
    callbackGroup = 'main'
    break
  case appType.Vivisticker:
    callbackGroup = 'vvstk'
    break
}
autoWVUtils.registerCallbacks(callbackGroup)

const store = useStore()
const callbackRecords = computed(() => store.getters['webView/getCallbackRecords'])

const leaveStyles = computed(() => {
  return { top: `${autoWVUtils.getUserInfoFromStore().statusBarHeight ?? 0}px` }
})

const goHome = () => {
  window.location.pathname = ''
}

const paramsEle = ref(null as HTMLTextAreaElement | null)

const eventName = ref('')

const eventParamsStr = ref('{}')
const eventParamsValid = ref(true)
let eventParams = reactive({})

watchEffect(() => {
  try {
    eventParams = JSON.parse(eventParamsStr.value)
    eventParamsValid.value = true
  } catch (error) {
    eventParamsValid.value = false
  }
})

const insertAtCursor = () => {
  const tabString = '\t'
  if (!paramsEle.value) return
  if (paramsEle.value.selectionStart || paramsEle.value.selectionStart === 0) {
    const startPos = paramsEle.value.selectionStart
    const endPos = paramsEle.value.selectionEnd
    eventParamsStr.value = eventParamsStr.value.substring(0, startPos) +
      tabString +
      eventParamsStr.value.substring(endPos, eventParamsStr.value.length)
    nextTick(() => {
      if (!paramsEle.value) return
      paramsEle.value.selectionStart = startPos + tabString.length
      paramsEle.value.selectionEnd = startPos + tabString.length
    })
  } else {
    eventParamsStr.value += tabString
  }
}

const doAlertOnTimeout = ref(true)
const doClearOnSubmet = ref(true)
let eventTimeout = -1

const resetEventTimeout = () => {
  window.clearTimeout(eventTimeout)
  eventTimeout = -1
}

watch(() => callbackRecords, (val) => {
  if (val.value.length !== 0) {
    resetEventTimeout()
  }
}, { deep: true })

const submitEvent = () => {
  if (doClearOnSubmet.value) {
    clearCallbacks()
  }
  resetEventTimeout()
  if (doAlertOnTimeout.value) {
    eventTimeout = window.setTimeout(() => {
      notify({ group: 'error', text: 'no reply in 5 seconds' })
    }, 5000)
  }
  try {
    switch (mobileOS.value) {
      case mobileOSType.IOS:
        autoWVUtils.sendToIOS(eventName.value, eventParams, true)
        break
      case mobileOSType.Android:
        // TODO: implement Android event sender
        break
    }
  } catch (error: any) {
    resetEventTimeout()
    notify({ group: 'error', text: error.toString() })
  }
}

const clearCallbacks = () => {
  store.commit('webView/UPDATE_clearCallbackRecords')
  selectedRecord.value = null
}

const selectedRecord = ref(null as ICallbackRecord | null)

const selectRecord = (record: ICallbackRecord) => {
  selectedRecord.value = record
}

const checkRecordSelected = (record: ICallbackRecord): boolean => {
  return selectedRecord.value?.id === record.id
}

const processedArg = (arg: string): string => {
  return JSON.stringify(generalUtils.unproxify(arg), undefined, 2)
}
</script>

<style lang="scss" scoped>
.native-event-tester {
  @include size(100%, 100%);
  font-family: Poppins;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: setColor(gray-1);
  &__leave {
    position: fixed;
    left: 16px;
    z-index: 9999;
  }
  &__send-event {
    width: 80vw;
    padding: 16px;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-end;
    justify-content: center;
    background: setColor(blue-1);
    filter: drop-shadow(0px 0px 15px setColor(white, 0.3));
  }
  &__title {
    align-self: center;
    @include text-H5;
    color: white;
  }
  &__label {
    margin-left: 4px;
    @include body-MD;
    color: white;
    white-space: nowrap;
    align-self: self-start;
  }
  &__label-inverted {
    margin-left: 4px;
    @include body-MD;
    color: setColor(blue-1);
    white-space: nowrap;
    align-self: self-start;
  }
  &__event-name {
    width: 100%;
    border-radius: 5px;
    background: setColor(gray-2);
    color: white;
  }
  &__row {
    width: 100%;
    display: flex;
    align-items: center;
    &.horizontal {
      gap: 8px;
    }
    &.vertical {
      flex-direction: column;
      & > div {
        width: 100%;
      }
    }
  }
  &__params {
    width: 100%;
    border-radius: 5px;
    box-sizing: border-box;
    resize: none;
    background: setColor(gray-2);
    color: white;
    tab-size: 4;
    &:focus {
      outline: none;
    }
  }
  &__callbacks {
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 84px;
    overflow: scroll;
    border: white solid 2px;
    padding: 6px;
    border-radius: 5px;
  }
  &__callback {
    width: 100%;
    border-radius: 5px;
    box-sizing: border-box;
    background: setColor(gray-2);
    &.selected {
      background: setColor(white);
      & > div {
        color: setColor(blue-2);
      }
    }
  }
  &__option {
    display: flex;
    background-color: setColor(white);
    padding: 0px 6px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgb(156, 156, 156);
    & > .native-event-tester__label, & > .native-event-tester__label-inverted {
      margin: 0;
    }
  }
  &__record-args {
    height: 30vh;
    overflow: scroll;
  }
  &__record-arg {
    width: 100%;
    border-radius: 5px;
    box-sizing: border-box;
    background: setColor(gray-2);
    color: white;
    tab-size: 4;
    text-align: start;
    white-space: pre-wrap;
    padding: 10px
  }
}
</style>
