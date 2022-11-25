import vivistickerUtils from './vivistickerUtils'
import _ from 'lodash'

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

  get(category: string, key: string):unknown {
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

  update<T>(category: string, key: string, fn: (old: T)=>T) {
    const oldVal = this.get(category, key) as T
    const newVal = fn(oldVal)
    this.set(category, key, newVal)
    return newVal
  }

  appReset(category: string) {
    if (vivistickerUtils.isStandaloneMode) {
      return this.reset(category)
    }
    vivistickerUtils.setState(category, this.defaultValue[category])
  }

  async appSet(category: string, key: string, value: unknown) {
    if (vivistickerUtils.isStandaloneMode) {
      this.set(category, key, value)
      return
    }

    let item = await vivistickerUtils.getState(category)
    if (!item) {
      this.appReset(category)
      item = this.defaultValue[category]
    }
    _.set(item, key, value)
    vivistickerUtils.setState(category, item)
  }

  async appGet(category: string, key: string):Promise<unknown> {
    if (vivistickerUtils.isStandaloneMode) {
      return this.get(category, key)
    }

    const item = await vivistickerUtils.getState(category)
    if (item) {
      return _.get(item, key)
    } else {
      this.appReset(category)
      return _.get(this.defaultValue[category], key)
    }
  }

  async appUpdate<T>(category: string, key: string, fn: (old: T)=>T) {
    if (vivistickerUtils.isStandaloneMode) {
      return this.update(category, key, fn)
    }

    const oldVal = await this.appGet(category, key) as T
    const newVal = fn(oldVal)
    this.appSet(category, key, newVal)
    return newVal
  }
}

export default new LocalStorage()
