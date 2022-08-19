<template lang="pug">
div(class="tool")
  h1 CSS to VueCSS
  textarea(v-model="css" rows="5"
          placeholder="background-color: #414d70;\nborder-radius: 5px;")
  textarea(:value="vueCss" rows="5"
          placeholder="backgroundColor: '#414d70',\nborderRadius: '5px',")
</template>

<script lang="ts">
import Vue from 'vue'
import _ from 'lodash'

export default Vue.extend({
  data() {
    return {
      css: ''
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
        key = _.camelCase(key.split('-'))
        value = value.trim().replace(';', '')
        if (typeof value === 'number') {
          value = `'${value}px'`
        } else {
          value = `'${value}'`
        }
        rt.push(`${key}: ${value},`)
      }
      return rt.join('\n')
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
  > * {
    width: 80%;
  }
}
</style>
