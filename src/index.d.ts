export {}

// Extend Window type, https://bobbyhadz.com/blog/typescript-extend-window
declare global {
  interface Window {
    TPDirect: TPDirect;
  }
}
