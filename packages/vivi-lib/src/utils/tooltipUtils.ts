import { destroyTooltip, VTooltip } from 'floating-vue'

class TooltipUtils {
  themes: {
    hint: {
      $extend: string,
      $resetCss: boolean,
    },
    'hint-menu': {
      $extend: string,
      $resetCss: boolean,
      placement: string,
      popperTriggers: string[],
      distance: number,
      delay: {
        show: number,
        hide: number
      }
    }
  }

  constructor() {
    this.themes = {
      hint: {
        $extend: 'tooltip',
        $resetCss: true
      },
      'hint-menu': {
        $extend: 'tooltip',
        $resetCss: true,
        placement: 'bottom',
        popperTriggers: ['hover', 'focus'],
        distance: 7,
        delay: {
          show: 200,
          hide: 200
        }
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
    const options = {
      value: this.generateConfig(binding.value),
      oldValue: binding.oldValue,
      modifiers: binding.modifiers
    }
    VTooltip.beforeMount(el, options)
  }

  unbind(el: HTMLElement): void {
    destroyTooltip(el)
  }
}

export default TooltipUtils
