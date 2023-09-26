<template lang="pug">
div(class="emoji-test")
  div(class="emoji-test__row" :class="{ marked: checkEmojiMarked(emoji) }" v-for="emoji in emojiConfigs" :key="emoji")
    span(class="emoji-test__no-var-sel regular") {{ removeVarSel(emoji) }}
    span(class="emoji-test__w-var-sel regular") {{ testAndRemove(emoji) }}
    span(class="emoji-test__w-var-sel regular") |
    span(class="emoji-test__no-var-sel bold") {{ removeVarSel(emoji) }}
    span(class="emoji-test__w-var-sel bold") {{ testAndRemove(emoji) }}
    span(class="emoji-test__w-var-sel bold") |
    span(class="emoji-test__no-var-sel color") {{ removeVarSel(emoji) }}
    span(class="emoji-test__w-var-sel color") {{ testAndRemove(emoji) }}
    span(class="emoji-test__w-var-sel color") |
    //- span(class="emoji-test__delete" @click="removeEmoji(emoji)") x
    nubtn(class="emoji-test__mark" @click="toggleMarkEmoji(emoji)") toggle mark
  div(class="emoji-test__row")
    nubtn(class="emoji-test__dump" @click="dumpEmojis" theme="ghost") dump
</template>

<script setup lang="ts">
import emojisRaw from '@/assets/json/result.json'
import fileUtils from '@/utils/fileUtils'
import textUtils from '@/utils/textUtils'
import { reactive, ref } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
textUtils.loadDefaultFonts()
store.dispatch('text/addFont', {
  type: 'public',
  face: 'dLe1S0oDanIJjvty5RxG',
  url: '',
  assetId: '',
  userId: '',
  ver: store.getters['user/getVerUni']
})
store.dispatch('text/addFont', {
  type: 'public',
  face: 'teIBwroWmuw1jTIL35ej',
  url: '',
  assetId: '',
  userId: '',
  ver: store.getters['user/getVerUni']
})
store.dispatch('text/addFont', {
  type: 'public',
  face: 'zVUjQ0MaGOm7HOJXv5gB',
  url: '',
  assetId: '',
  userId: '',
  ver: store.getters['user/getVerUni']
})
const emojiConfigs = ref<string[]>(emojisRaw.emojis)
const markedEmojis = reactive<{[key: string]: boolean}>({})

const removeVarSel = (emoji: string) => {
  return emoji.replace(/[\ufe0e\ufe0f]/g, '')
}

const testAndRemove = (emoji: string) => {
  return (emoji.length === 2) && (emoji[1] === '\ufe0f') ? emoji : removeVarSel(emoji)
}

const toggleMarkEmoji = (emoji: string) => {
  if (checkEmojiMarked(emoji)) {
    delete markedEmojis[emoji]
  } else {
    markedEmojis[emoji] = true
  }
}

// const removeEmoji = (emoji: string) => {
//   const deleteIndex = emojiConfigs.value.indexOf(emoji)
//   emojiConfigs.value.splice(deleteIndex, 1)
// }

const checkEmojiMarked = (emoji: string): boolean => {
  return markedEmojis[emoji] ?? false
}

const dumpEmojis = () => {
  fileUtils.exportFile({ emojis: emojiConfigs.value.filter(e => checkEmojiMarked(e)) })
}
</script>

<style lang="scss">
.emoji-test {
  &__row {
    font-size: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    & > .regular {
      font-family: dLe1S0oDanIJjvty5RxG,OOcHgnEpk9RHYBOiWllz,gkNYxJEe72MBxp0Ay9Dv,cRgaSK5ZVXnLDpWTL8MN,-apple-system,gXgHEvSNTPg2mhrpNOUb;
    }
    & > .bold {
      font-family: teIBwroWmuw1jTIL35ej,OOcHgnEpk9RHYBOiWllz,gkNYxJEe72MBxp0Ay9Dv,cRgaSK5ZVXnLDpWTL8MN,-apple-system,gXgHEvSNTPg2mhrpNOUb;
    }
    & > .color {
      font-family: zVUjQ0MaGOm7HOJXv5gB,OOcHgnEpk9RHYBOiWllz,gkNYxJEe72MBxp0Ay9Dv,cRgaSK5ZVXnLDpWTL8MN,gXgHEvSNTPg2mhrpNOUb;
    }
    &.marked {
      text-decoration: underline;
      text-decoration-color: red;
    }
  }
}
</style>
