<template lang="pug">
div(class="tool")
  h1 CSS to VueCSS
  textarea(v-model="css" rows="5"
          placeholder="background-color: #414d70;\nborder-radius: 5px;")
  textarea(:value="vueCss" rows="5"
          placeholder="backgroundColor: '#414d70',\nborderRadius: '5px',")
  h1 html replace " with '
  textarea(v-model="htmlQ" rows="5"
          placeholder="background-color: #414d70;\nborder-radius: 5px;")
  textarea(:value="htmlQ2" rows="5"
          placeholder="backgroundColor: '#414d70',\nborderRadius: '5px',")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import _ from 'lodash'

export default defineComponent({
  emits: [],
  data() {
    return {
      css: '',
      htmlQ: ''
    }
  },
  computed: {
    vueCss():string {
      const lines = this.css.split('\n')
      const rt = []
      for (const line of lines) {
        if (!line.includes(':')) {
          rt.push(line)
          continue
        }

        let [key, value] = line.split(':')
        key = _.camelCase(key)
        value = value.trim().replace(';', '')
        if (typeof value === 'number') {
          value = `'${value}px'`
        } else {
          value = `'${value}'`
        }
        rt.push(`${key}: ${value},`)
      }
      return rt.join('\n')
    },
    htmlQ2():string {
      return this.htmlQ.replace(/"/g, "'")
    }
  }
})
</script>

<style lang="scss" scoped>
.tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  height: 100%;
  background-color: rgba(181, 181, 181, 0.92);
  > * {
    width: 80%;
  }
}
</style>
