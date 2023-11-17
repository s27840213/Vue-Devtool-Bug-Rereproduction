export { }

// Extend Window type, https://bobbyhadz.com/blog/typescript-extend-window
declare global {
  interface Window {
    TPDirect: TPDirect
    webkit?: {
      messageHandlers: {
        [key: string]: {
          postMessage: (message: any) => void
        }
      }
    }
    consoleLog: () => void
    consoleLogBuffer: () => void
    testEvent: () => void
    __PRERENDER_INJECTED?: { PRERENDER: 1 }
  }
  interface Performance {
    // Deprecated, https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory
    memory: {
      jsHeapSizeLimit: number
      totalJSHeapSize: number
      usedJSHeapSize: number
    }
  }
}
