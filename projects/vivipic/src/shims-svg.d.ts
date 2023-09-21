// Define import svg type, https://stackoverflow.com/a/60937609

declare module '*.svg' {
  import Vue, { VueConstructor } from 'vue'
  const content: VueConstructor<Vue>
  export default content
}
