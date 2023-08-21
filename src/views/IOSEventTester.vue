<template lang="pug">
div(class="ios-event-tester")
  div(class="ios-event-tester__send-event")
    div(class="ios-event-tester__title") SEND EVENT
    div(class="ios-event-tester__row horizontal")
      div(class="ios-event-tester__label") Event Name:
      input(class="ios-event-tester__event-name" v-model="eventName")
    div(class="ios-event-tester__row vertical")
      div(class="ios-event-tester__label") Message Body:
      textarea(ref="paramsEle"
                class="ios-event-tester__params"
                rows="5"
                v-model="eventParamsStr"
                @keydown.tab.prevent="insertAtCursor")
    div(class="ios-event-tester__row horizontal flex-between")
      div(class="ios-event-tester__option")
        checkbox(v-model="doAlertOnTimeout")
        div(class="ios-event-tester__label-inverted") alert on timeout (5s)
      nubtn(class="ios-event-tester__submit"
        theme="ghost"
        size="sm"
        :disabled="!eventParamsValid || eventName === ''"
        @click="submitEvent") SEND
    div(class="ios-event-tester__row vertical")
      div(class="ios-event-tester__label") Events From IOS:
      div(class="ios-event-tester__callbacks scrollbar-gray-thin")
        div(class="ios-event-tester__callback"
            :class="{ selected: checkRecordSelected(record) }"
            v-for="record in callbackRecords" :key="record.id"
            @click="selectRecord(record)")
          div(class="ios-event-tester__label") {{ record.name }}
    div(class="ios-event-tester__row horizontal flex-between")
      div(class="ios-event-tester__option")
        checkbox(v-model="doClearOnSubmet")
        div(class="ios-event-tester__label-inverted") clear on submit
      nubtn(class="ios-event-tester__clear"
        theme="ghost"
        size="sm"
        @click="clearCallbacks") CLEAR
    div(v-if="selectedRecord" class="ios-event-tester__row vertical ios-event-tester__record-args")
      pre(class="ios-event-tester__record-arg"
          v-for="arg in selectedRecord.args" :key="arg.toString()") {{ processedArg(arg) }}
</template>

<script setup lang="ts">
import Checkbox from '@/components/global/Checkbox.vue'
import { ICallbackRecord } from '@/interfaces/vivisticker'
import generalUtils from '@/utils/generalUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { notify } from '@kyvg/vue3-notification'
import { computed, nextTick, reactive, ref, watch, watchEffect } from 'vue'
import { useStore } from 'vuex'

vivistickerUtils.registerCallbacks('vvstk')

const store = useStore()
const callbackRecords = computed(() => store.getters['vivisticker/getCallbackRecords'])

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

watch(() => callbackRecords, (val) => {
  if (val.value.length !== 0) {
    window.clearTimeout(eventTimeout)
    eventTimeout = -1
  }
}, { deep: true })

const submitEvent = () => {
  if (doClearOnSubmet.value) {
    clearCallbacks()
  }
  window.clearTimeout(eventTimeout)
  if (doAlertOnTimeout.value) {
    eventTimeout = window.setTimeout(() => {
      notify({ group: 'error', text: 'no reply in 5 seconds' })
    }, 5000)
  }
  try {
    vivistickerUtils.sendToIOS(eventName.value, eventParams, true)
  } catch (error: any) {
    notify({ group: 'error', text: error.toString() })
  }
}

const clearCallbacks = () => {
  vivistickerUtils.clearCallbackRecords()
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
.ios-event-tester {
  @include size(100%, 100%);
  font-family: Poppins;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: setColor(gray-1);
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
    & > .ios-event-tester__label, & > .ios-event-tester__label-inverted {
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
