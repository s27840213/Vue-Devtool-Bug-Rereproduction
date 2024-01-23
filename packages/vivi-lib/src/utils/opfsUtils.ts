import generalUtils from "@/utils/generalUtils"

// The actual file in Mac Chrome is located at: ~/Library/Application Support/Google/Chrome/Default/File System
// To debug OPFS, install https://chromewebstore.google.com/detail/opfs-explorer/acndjpgkpaclldomagafnognkcgjignd.
class OPFSUtils {
  opfsRoot: Promise<FileSystemDirectoryHandle> | undefined
    = navigator.storage?.getDirectory() // storage is udf in app.

  private checkRoot(): this is { opfsRoot: Promise<FileSystemDirectoryHandle> } {
    if (!this.opfsRoot) {
      console.warn('opfsRoot is udf!')
      return false
    }
    return true
  }

  private async find(type: 'file', path: string, dir: FileSystemDirectoryHandle): Promise<FileSystemFileHandle>
  private async find(type: 'folder', path: string, dir: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle>
  private async find(type: 'file' | 'folder', path: string, dir: FileSystemDirectoryHandle): Promise<FileSystemFileHandle | FileSystemDirectoryHandle>
  private async find(type: 'file' | 'folder', path: string, dir: FileSystemDirectoryHandle): Promise<FileSystemFileHandle | FileSystemDirectoryHandle> {
    // console.log('fileSystem.ts:18', path)
    const matcher = path.match(/([^/]+)\/(.+)/)
    // console.log('find', matcher, path)
    if (matcher) { // Have sub folder, recursive.
      const [, subDir, remainPath] = matcher
      // console.log('fileSystem.ts:20', subDir, remainPath)
      return await this.find(type, remainPath, await dir.getDirectoryHandle(subDir, { create: true }))
    }

    return type === 'file'
      ? await dir.getFileHandle(path, { create: true })
      : await dir.getDirectoryHandle(path, { create: true })
  }

  /**
   * Return the Blob for a file with an image extension.
   */
  async read(path: string): Promise<unknown> {
    if (!this.checkRoot()) return
    const fileHandle = await this.find('file', path, await this.opfsRoot)
    const f = await fileHandle.getFile()

    if (!f.type.includes('image/')) return JSON.parse(await f.text())
    // Convert the image to base64.
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(f)
    })
  }

  private toBlob(data: unknown) {
    if (data instanceof Blob) return data
    if (typeof data !== 'string' || !/data:([^;]+);base64/.test(data)) return
    return generalUtils.dataURLtoBlob(data)
  }

  /**
   * @param content Can be Blob, base64, Object, Array, string, number.
   */
  async write(path: string, content: unknown) {
    if (!this.checkRoot()) return
    const file = await this.find('file', path, await this.opfsRoot)
    if (!file.createWritable) { // createWritable is not available in Safari.
      console.warn('createWritable is udf!', file)
      return
    }

    const writable = await file.createWritable()
    const blob = this.toBlob(content) // Blobs don't require stringification.
    await writable.write(blob ?? JSON.stringify(content ?? ''))
    await writable.close()
  }

  /**
   * Support folder recursive delete.
   */
  async delete(path: string) {
    if (!this.checkRoot()) return
    const file = await this.find(
      /\.(\w{3,4})$/.test(path) ? 'file' : 'folder', path, await this.opfsRoot
    ) as FileSystemHandle as FileSystemHandle & { remove?: (option: { recursive: boolean }) => Promise<void> }
    if (!file.remove) { // Only Chromium has a remove method.
      console.warn('remove is udf!')
      return
    }
    
    await file.remove({ recursive: true })
  }

  async deleteAll() {
    if (!this.checkRoot()) return
    for await (const name of (await this.opfsRoot).keys()) {
      await (await this.opfsRoot).removeEntry(name, { recursive: true })
    }
  }

  // async clone(path: string) {
  //   //
  // }

  // async move(path: string) {
  //   //
  // }

  private async lsInner(dir: FileSystemDirectoryHandle, depth = 0) {
    let str = ''
    const entries = []
    for await (const ent of dir.entries()) entries.push(ent)
    entries.sort((a, b) => { // Folder first, lexicographical order.
      if (a[1].kind !== b[1].kind) return a[1].kind === 'directory' ? -1 : 1
      if (a[0] === b[0]) return 0
      return a[0] < b[0] ? -1 : 1
    })

    for (const [name, handle] of entries) {
      const isFolder = handle.kind === 'directory'
      // console.log('| '.repeat(depth), name, handle, entries)
      str += `${'| '.repeat(depth)}|-${isFolder ? '📁': '📄'}${name}\n`
      if (!isFolder) continue
      str += await this.lsInner(await dir.getDirectoryHandle(name), depth + 1)
    }
    return str
  }

  /**
   * Print folder tree for debugging purposes.
   */
  async ls() {
    if (!this.checkRoot()) return
    const tree = await (this.lsInner(await this.opfsRoot))
    console.log(`Print OPFS folder tree\n🏠Root\n${tree ?? '<empty>'}`)
  }

  async test() {
    await this.deleteAll()
    await this.write('PF/d1/sd1/original.json', { test: 12345 })
    await this.write('PF/d1/sd1/original.txt', 123456)
    await this.write('PF/d1/sd1/result.txt', { page: [1, 2, 3], index: 5 })
    await this.write('PF/d1/sd1/result.json', [1,2,3,4,5,6,7,8,9])
    await this.write('PF/d1/sd2/123.txt', '1234556687')
    await this.write('dfd14f54e6/f4d544123.txt', null)
    await this.write('dfd14f54e6/f4d5dfefe23.txt', undefined)
    console.log(await this.read('PF/d1/sd1/original.json'))
    console.log(await this.read('PF/d1/sd1/original.txt'))
    console.log(await this.read('PF/d1/sd1/result.txt'))
    console.log(await this.read('PF/d1/sd1/result.json'))
    console.log(await this.read('PF/d1/sd2/123.txt'))
    console.log(await this.read('dfd14f54e6/f4d544123.txt'))
    console.log(await this.read('dfd14f54e6/f4d5dfefe23.txt'))
    await this.ls()
    await this.delete('PF/d1/sd1/original.json')
    await this.ls()
    await this.delete('PF')
    await this.ls()
  }
}

const opfsUtils = new OPFSUtils()
window.opfs = opfsUtils
export default opfsUtils
