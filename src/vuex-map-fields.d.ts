/* eslint-disable no-use-before-define */
/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
declare module 'vuex-map-fields' {
  // ---- From https://github.com/maoberlehner/vuex-map-fields/issues/26#issue-326254766
  import _Vue, { WatchOptions } from 'vue'

  // augment typings of Vue.js

  export class Store<S> {
    constructor(options: StoreOptions<S>);

    readonly state: S;
    readonly getters: any;

    replaceState(state: S): void;

    dispatch: Dispatch;
    commit: Commit;

    subscribe<P extends MutationPayload>(fn: (mutation: P, state: S) => any): () => void;
    watch<T>(getter: (state: S) => T, cb: (value: T, oldValue: T) => void, options?: WatchOptions): () => void;

    registerModule<T>(path: string, module: Module<T, S>, options?: ModuleOptions): void;
    registerModule<T>(path: string[], module: Module<T, S>, options?: ModuleOptions): void;

    unregisterModule(path: string): void;
    unregisterModule(path: string[]): void;

    hotUpdate(options: {
      actions?: ActionTree<S, S>;
      mutations?: MutationTree<S>;
      getters?: GetterTree<S, S>;
      modules?: ModuleTree<S>;
    }): void;
  }

  export function install(Vue: typeof _Vue): void;

  export interface Dispatch {
    (type: string, payload?: any, options?: DispatchOptions): Promise<any>;
    <P extends Payload>(payloadWithType: P, options?: DispatchOptions): Promise<any>;
  }

  export interface Commit {
    (type: string, payload?: any, options?: CommitOptions): void;
    <P extends Payload>(payloadWithType: P, options?: CommitOptions): void;
  }

  export interface ActionContext<S, R> {
    dispatch: Dispatch;
    commit: Commit;
    state: S;
    getters: any;
    rootState: R;
    rootGetters: any;
  }

  export interface Payload {
    type: string;
  }

  export interface MutationPayload extends Payload {
    payload: any;
  }

  export interface DispatchOptions {
    root?: boolean;
  }

  export interface CommitOptions {
    silent?: boolean;
    root?: boolean;
  }

  export interface StoreOptions<S> {
    state?: S;
    getters?: GetterTree<S, S>;
    actions?: ActionTree<S, S>;
    mutations?: MutationTree<S>;
    modules?: ModuleTree<S>;
    plugins?: Plugin<S>[];
    strict?: boolean;
  }

  type ActionHandler<S, R> = (injectee: ActionContext<S, R>, payload: any) => any;
  interface ActionObject<S, R> {
    root?: boolean;
    handler: ActionHandler<S, R>;
  }

  export type Getter<S, R> = (state: S, getters: any, rootState: R, rootGetters: any) => any;
  export type Action<S, R> = ActionHandler<S, R> | ActionObject<S, R>;
  export type Mutation<S> = (state: S, payload: any) => any;
  export type Plugin<S> = (store: Store<S>) => any;

  export interface Module<S, R> {
    namespaced?: boolean;
    state?: S | (() => S);
    getters?: GetterTree<S, R>;
    actions?: ActionTree<S, R>;
    mutations?: MutationTree<S>;
    modules?: ModuleTree<R>;
  }

  export interface ModuleOptions {
    preserveState?: boolean
  }

  export interface GetterTree<S, R> {
    [key: string]: Getter<S, R>;
  }

  export interface ActionTree<S, R> {
    [key: string]: Action<S, R>;
  }

  export interface MutationTree<S> {
    [key: string]: Mutation<S>;
  }

  export interface ModuleTree<R> {
    [key: string]: Module<any, R>;
  }

  const _default: {
    Store: typeof Store;
    install: typeof install;
  }
  type Dictionary<T> = { [key: string]: T };
  type Computed = () => any;
  type MutationMethod = (...args: any[]) => void;
  type ActionMethod = (...args: any[]) => Promise<any>;

  interface Mapper<R> {
    (map: string[]): Dictionary<R>;
    (map: Dictionary<string>): Dictionary<R>;
  }

  interface MapperWithNamespace<R> {
    (namespace: string, map: string[]): Dictionary<R>;
    (namespace: string, map: Dictionary<string>): Dictionary<R>;
  }

  interface FunctionMapper<F, R> {
    (map: Dictionary<(this: typeof _Vue, fn: F, ...args: any[]) => any>): Dictionary<R>;
  }

  interface FunctionMapperWithNamespace<F, R> {
    (
      namespace: string,
      map: Dictionary<(this: typeof _Vue, fn: F, ...args: any[]) => any>
    ): Dictionary<R>;
  }

  interface MapperForState {
    <S>(
      map: Dictionary<(this: typeof _Vue, state: S, getters: any) => any>
    ): Dictionary<Computed>;
  }

  interface MapperForStateWithNamespace {
    <S>(
      namespace: string,
      map: Dictionary<(this: typeof _Vue, state: S, getters: any) => any>
    ): Dictionary<Computed>;
  }

  interface NamespacedMappers {
    mapState: Mapper<Computed> & MapperForState;
    mapMutations: Mapper<MutationMethod> & FunctionMapper<Commit, MutationMethod>;
    mapFields: Mapper<Computed>;
    mapActions: Mapper<ActionMethod> & FunctionMapper<Dispatch, ActionMethod>;
  }

  // export  const mapState: Mapper<Computed>
  //   & MapperWithNamespace<Computed>
  //   & MapperForState
  //   & MapperForStateWithNamespace;

  // export  const mapMutations: Mapper<MutationMethod>
  //   & MapperWithNamespace<MutationMethod>
  //   & FunctionMapper<Commit, MutationMethod>
  //   & FunctionMapperWithNamespace<Commit, MutationMethod>;

  // export  const mapGetters: Mapper<Computed>
  //   & MapperWithNamespace<Computed>;

  // export  const mapActions: Mapper<ActionMethod>
  //   & MapperWithNamespace<ActionMethod>
  //   & FunctionMapper<Dispatch, ActionMethod>
  //   & FunctionMapperWithNamespace<Dispatch, ActionMethod>;

  interface HelperOptions {
    getterType: string;
    mutationType: string
  }
  export function createHelpers(helperOptions: HelperOptions): NamespacedMappers;

  export default _default
  // ---- End

  // ---- From https://github.com/maoberlehner/vuex-map-fields/pull/137/commits/30818675137df73e82d72e29b45a458997a44c36#diff-093ad82a25aee498b11febf1cdcb6546e4d223ffcb49ed69cc275ac27ce0ccce
  export function getField(state: any): (path: any) => any;
  export function updateField(state: any, { path, value }: {
    path: any;
    value: any;
  }): void;
  export function mapFields(...params: any[]): any;
  export function mapMultiRowFields(...params: any[]): any;
  export function createHelpers({ getterType, mutationType }: {
    getterType: any;
    mutationType: any;
  }): {
    [x: number]: typeof updateField;
    mapFields: (...params: any[]) => any;
    mapMultiRowFields: (...params: any[]) => any;
  };
  // ---- End

  // ---- From https://github.com/maoberlehner/vuex-map-fields/issues/75#issuecomment-976451210
  interface Mapper<R> {
    <Key extends string>(map: Key[]): { [K in Key]: R }
    <Map extends Record<string, string>>(map: Map): { [K in keyof Map]: R }
  }

  interface MapperWithNamespace<R> {
    <Key extends string>(namespace: string, map: Key[]): { [K in Key]: R }
    <Map extends Record<string, string>>(namespace: string, map: Map): { [K in keyof Map]: R }
  }

  type Computed = () => any

  export const mapFields: Mapper<Computed>
    & MapperWithNamespace<Computed>
  // ---- End
}
