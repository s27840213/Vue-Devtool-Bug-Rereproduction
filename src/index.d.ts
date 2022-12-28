export {}

// Extend Window type, https://bobbyhadz.com/blog/typescript-extend-window
declare global {
  interface Window {
    TPDirect: TPDirect
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
