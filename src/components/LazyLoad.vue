<script lang="ts">
import Vue, { VNode } from 'vue'

export default Vue.extend({
  props: {
    pseudoTag: {
      type: String,
      default: 'div'
    }
  },
  data () {
    return {
      isLoaded: false,
      intersectionObserver: null as IntersectionObserver | null
    }
  },
  render (h): VNode {
    const [slot] = this.$scopedSlots.default!({}) as VNode[]
    const { style, staticClass } = slot.data || {}
    if (this.isLoaded) {
      return slot
    }
    return h(this.pseudoTag, {
      style,
      class: staticClass
    })
  },
  mounted () {
    this.intersectionObserver = new IntersectionObserver(
      ([evt]) => {
        if (evt.isIntersecting) {
          this.isLoaded = true
          this.intersectionObserver && this.intersectionObserver.disconnect()
        }
      }
    )
    this.intersectionObserver.observe(this.$el)
  },
  destroyed () {
    this.intersectionObserver && this.intersectionObserver.disconnect()
  }
})
</script>
