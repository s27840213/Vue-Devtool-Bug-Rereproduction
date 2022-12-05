import _ from 'lodash'

class LocalStorage {
  defaultValue = {
    textEffectSetting: {
      tab: 'shadow'
    }
  } as Record<string, Record<string, string>>

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
}

export default new LocalStorage()
