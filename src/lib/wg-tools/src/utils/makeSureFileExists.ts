import * as f from '@tauri-apps/api/fs'
const fs = f

/** make sure a file exists on the file system */
export const makeSureFileExists = async (path: string) => {
  try {
    await fs.readTextFile(path)
  } catch (e) {
    await fs.writeFile({ path, contents: '' })
  }
}