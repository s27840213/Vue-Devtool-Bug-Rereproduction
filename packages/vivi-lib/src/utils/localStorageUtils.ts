import i18n from '@/i18n'
import modalUtils from '@/utils/modalUtils'
import _ from 'lodash'
import stkWVUtils from '@/utils/stkWVUtils'

class LocalStorage {
  defaultValue = {
    textEffectSetting: {
      tab: 'shadow'
    },
    favorites: {
      objects: {
        categories: {
          order: [],
          obj: {}
        },
        tags: {
          order: [],
          obj: {}
        },
        items: {
          order: [],
          obj: {}
        }
      },
      giphy: {
        categories: {
          order: [],
          obj: {}
        },
        tags: {
          order: [],
          obj: {}
        },
        items: {
          order: [],
          obj: {}
        }
      }
    }
  } as Record<string, Record<string, unknown>>

  errorModal(errorCode: number) {
    modalUtils.setModalInfo(
      i18n.global.t('NN0457'),
      i18n.global.t('NN0860', { feature: i18n.global.t('NN0759'), errorCode }),
      {
        msg: i18n.global.t('NN0861'),
        action: () => { location.reload() }
      },
      {
        msg: i18n.global.t('NN0271'),
        class: 'btn-light-mid',
        style: {
          border: 'none',
          color: '#474A57',
          backgroundColor: '#D3D3D3'
        },
      },
    )
  }

  reset(category: string) {
    localStorage.setItem(category, JSON.stringify(this.defaultValue[category]))
  }

  set(category: string, key: string, value: unknown) {
    let item = localStorage.getItem(category)
    if (!item) {
      this.reset(category)
      item = localStorage.getItem(category)
    }

    let obj: Record<string, unknown>
    try {
      obj = JSON.parse(item as string)
    } catch {
      this.reset(category)
      obj = this.defaultValue[category]
    }
    _.set(obj, key, value)
    localStorage.setItem(category, JSON.stringify(obj))
  }

  get(category: string, key: string): unknown {
    const item = localStorage.getItem(category)
    if (item && typeof item === 'string') {
      try {
        const obj = JSON.parse(item)
        return _.get(obj, key)
      } catch {
        this.reset(category)
        return _.get(this.defaultValue[category], key)
      }
    } else {
      this.reset(category)
      return _.get(this.defaultValue[category], key)
    }
  }

  update<T>(category: string, key: string, fn: (old: T) => T) {
    const oldVal = this.get(category, key) as T
    const newVal = fn(oldVal)
    this.set(category, key, newVal)
    return newVal
  }

  appReset(category: string) {
    if (stkWVUtils.isStandaloneMode) {
      return this.reset(category)
    }
    stkWVUtils.setState(category, this.defaultValue[category])
  }

  async appSet(category: string, key: string, value: unknown) {
    if (stkWVUtils.isStandaloneMode) {
      this.set(category, key, value)
      return
    }

    let item = await stkWVUtils.getState(category)
    if (item === undefined) { // init
      this.appReset(category)
      item = this.defaultValue[category]
    } else if (item === null) { // timeout or error
      this.errorModal(1)
      return
    }
    _.set(item, key, value)
    stkWVUtils.setState(category, item)
  }

  async appGet(category: string, key: string): Promise<unknown> {
    if (stkWVUtils.isStandaloneMode) {
      return this.get(category, key)
    }

    const item = await stkWVUtils.getState(category)
    if (item) {
      return _.get(item, key)
    } else if (item === undefined) { // init
      this.appReset(category)
      return _.get(this.defaultValue[category], key)
    } else { // === null, timeout or error
      this.errorModal(2)
      return _.get(this.defaultValue[category], key)
    }
  }

  async appUpdate<T>(category: string, key: string, fn: (old: T) => T) {
    if (stkWVUtils.isStandaloneMode) {
      return this.update(category, key, fn)
    }

    const oldVal = await this.appGet(category, key) as T
    const newVal = fn(oldVal)
    this.appSet(category, key, newVal)
    return newVal
  }
}

export default new LocalStorage()
