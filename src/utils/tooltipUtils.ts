import { destroyTooltip, VTooltip } from 'floating-vue'

class TooltipUtils {
  themes: {
    hint: {
      $extend: string,
      $resetCss: boolean
    }
  }

  constructor() {
    this.themes = {
      hint: {
        $extend: 'tooltip',
        $resetCss: true
      }
    }
  }

  generateConfig(content: string, placement?: string, delay?: { show: number, hide: number }): {
    content: string,
    theme: string,
    placement: string,
    delay: {
      show: number,
      hide: number
    }
  } {
    return {
      content,
      theme: 'hint',
      placement: placement ?? 'bottom',
      delay: delay ?? {
        show: 200,
        hide: 0
      }
    }
  }

  async bind(el: HTMLElement, binding: any): Promise<void> {
    // const options = {
    //   value: this.generateConfig(binding.value),
    //   oldValue: binding.oldValue,
    //   modifiers: binding.modifiers
    // }
    // VTooltip.bind(el, options)
  }

  unbind(el: HTMLElement): void {
    // destroyTooltip(el)
  }
}

export default TooltipUtils
