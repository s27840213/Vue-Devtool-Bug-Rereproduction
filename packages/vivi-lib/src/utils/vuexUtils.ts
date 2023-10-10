import store from "@/store"

type Condition = () => boolean
type Context<T> = string | {[k in keyof T]: string}
type Mutation = (...args: any[]) => void
type Action = (...args: any[]) => any

export default new (class VuexUtils {
  checkContext<T>(context: Context<T>): context is string {
    return typeof context === 'string'
  }

  getKey<T>(key: keyof T, context: string, contextDetails: {[k in keyof T]: string}): string
  getKey<T>(key: keyof T, context: {[k in keyof T]: string}): string
  getKey<T>(key: keyof T, context: Context<T>, contextDetails?: {[k in keyof T]: string}): string {
    if (this.checkContext(context)) {
      return context + '/' + contextDetails![key]
    } else {
      return context[key]
    }
  }

  mapState<T extends object>(condition: Condition, defaultValues: T, context: string, contextDetails: {[k in keyof T]: string}): {[k in keyof T]: () => T[k]}
  mapState<T extends object>(condition: Condition, defaultValues: T, context: {[k in keyof T]: string}): {[k in keyof T]: () => T[k]}
  mapState<T extends object>(condition: Condition, defaultValues: T, context: Context<T>, contextDetails?: {[k in keyof T]: string}): {[k in keyof T]: () => T[k]} {
    return Object.fromEntries(
      (Object.keys(defaultValues) as (keyof T)[]).map(k => {
        if (this.checkContext(context)) {
          return [k, () => condition() ? ((store.state as any)[context][contextDetails![k]] as T[typeof k]) : defaultValues[k]]
        } else {
          const [prefix, key] = context[k].split('/')
          return [k, () => condition() ? ((store.state as any)[prefix][key] as T[typeof k]) : defaultValues[k]]
        }
      })
    ) as {[k in keyof T]: () => T[k]}
  }

  mapGetters<T extends object>(condition: Condition, defaultValues: T, context: string, contextDetails: {[k in keyof T]: string}): {[k in keyof T]: () => T[k]}
  mapGetters<T extends object>(condition: Condition, defaultValues: T, context: {[k in keyof T]: string}): {[k in keyof T]: () => T[k]}
  mapGetters<T extends object>(condition: Condition, defaultValues: T, context: Context<T>, contextDetails?: {[k in keyof T]: string}): {[k in keyof T]: () => T[k]} {
    return Object.fromEntries(
      (Object.keys(defaultValues) as (keyof T)[]).map(k => {
        if (this.checkContext(context)) {
          return [k, () => condition() ? (store.getters[this.getKey(k, context, contextDetails!)] as T[typeof k]) : defaultValues[k]]
        } else {
          return [k, () => condition() ? (store.getters[this.getKey(k, context)] as T[typeof k]) : defaultValues[k]]
        }
      })
    ) as {[k in keyof T]: () => T[k]}
  }

  mapMutations<T extends object>(condition: Condition, context: string, contextDetails: {[k in keyof T]: string}): {[k in keyof T]: Mutation}
  mapMutations<T extends object>(condition: Condition, context: {[k in keyof T]: string}): {[k in keyof T]: Mutation}
  mapMutations<T extends object>(condition: Condition, context: Context<T>, contextDetails?: {[k in keyof T]: string}): {[k in keyof T]: Mutation} {
    const isContextPrefix = this.checkContext(context)
    const config = isContextPrefix ? contextDetails! : context
    return Object.fromEntries(
      (Object.keys(config) as (keyof T)[]).map(k => {
        if (isContextPrefix) {
          return [k, (...args: any[]) => condition() ? (store.commit(this.getKey(k, context, contextDetails!), ...args) as T[typeof k]) : undefined]
        } else {
          return [k, (...args: any[]) => condition() ? (store.commit(this.getKey(k, context), ...args) as T[typeof k]) : undefined]
        }
      })
    ) as {[k in keyof T]: Mutation}
  }

  mapActions<T extends object>(condition: Condition, context: string, contextDetails: {[k in keyof T]: string}): {[k in keyof T]: Action}
  mapActions<T extends object>(condition: Condition, context: {[k in keyof T]: string}): {[k in keyof T]: Action}
  mapActions<T extends object>(condition: Condition, context: Context<T>, contextDetails?: {[k in keyof T]: string}): {[k in keyof T]: Action} {
    const isContextPrefix = this.checkContext(context)
    const config = isContextPrefix ? contextDetails! : context
    return Object.fromEntries(
      (Object.keys(config) as (keyof T)[]).map(k => {
        if (isContextPrefix) {
          return [k, (...args: any[]) => condition() ? (store.dispatch(this.getKey(k, context, contextDetails!), ...args) as T[typeof k]) : undefined]
        } else {
          return [k, (...args: any[]) => condition() ? (store.dispatch(this.getKey(k, context), ...args) as T[typeof k]) : undefined]
        }
      })
    ) as {[k in keyof T]: Action}
  }
})
