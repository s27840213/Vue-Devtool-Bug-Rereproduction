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
    obj[key] = value
    localStorage.setItem(category, JSON.stringify(obj))
  }

  get(category: string, key: string):unknown {
    const item = localStorage.getItem(category)
    if (item && typeof item === 'string') {
      try {
        const obj = JSON.parse(item)
        return obj[key]
      } catch {
        this.reset(category)
        return this.defaultValue[category][key]
      }
    } else {
      this.reset(category)
      return this.defaultValue[category][key]
    }
  }
}

export default new LocalStorage()
