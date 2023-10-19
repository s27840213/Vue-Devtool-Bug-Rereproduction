<!-- <template lang="pug">
div
  input(
    v-model="initInputValue"
    @change="updateModelValue"
    @input="updateInputWidth"
    :style="inputStyles"
    ref="inputRef"
    :placeholder="placeholder")
</template>

<script setup lang="ts">
import { PropType, computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  fontSize: {
    type: String,
    default: '16px',
  },
  /**
   * @param updateTiming - sometime we need to update the input width when the input value is changed
   */
  updateTiming: {
    type: String as PropType<'input' | 'change'>,
    default: 'input'
  },
  paddingX: {
    type: Number,
    default: 4
  },
  paddingY: {
    type: Number,
    default: 2
  }
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref<HTMLInputElement>(null as unknown as HTMLInputElement)
const inputWidth = ref(150)

/**
 * @param initInputValue - used when the updateTiming is 'change'
 */

const initInputValue = ref('')
onMounted(() => {
  initInputValue.value = props.modelValue
})

watch(() => props.modelValue, (newValue) => {
  initInputValue.value = newValue
})

const updateModelValue = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

const inputStyles = computed(() => {
  return {
    width: `${inputWidth.value + 2 * props.paddingX + 8}px`,
    maxWidth: '120px',
    fontSize: `${props.fontSize}px`,
    padding: `${props.paddingY}px ${props.paddingX}px`
  }
})

const updateInputWidth = (event: Event) => {
  // Measure the input width with the current value
  const elValue = (event.target as HTMLInputElement).value ? (event.target as HTMLInputElement).value : props.placeholder
  const tmp = document.createElement('div')
  tmp.style.display = 'inline-block'
  tmp.style.fontSize = props.fontSize
  tmp.style.whiteSpace = 'nowrap'
  tmp.innerText = elValue
  document.body.appendChild(tmp)
  const width = tmp.getBoundingClientRect().width

  inputWidth.value = width
}

</script>

<style lang="scss" scoped>
input {
    text-overflow: ellipsis;
    box-sizing: border-box;
    border: 2px solid transparent;
    padding: 2px;
    transition: all 0.3s;
    background-color: transparent;
    &::placeholder {
      transition: color 0.3s;
    }
    &:hover,
    &:focus {
      border: 2px solid setColor(blue-1, 0.5);
      box-sizing: border-box;
      border-radius: 5px;
      &::placeholder {
        color: setColor(blue-1, 0.5);
      }
    }
  }
</style> -->
