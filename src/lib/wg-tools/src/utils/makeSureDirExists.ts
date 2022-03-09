import * as f from '@tauri-apps/api/fs'
const fs = f

/** Make sure a directory exists on the file system */
export const makeSureDirExists = async (path: string) => {
  try {
    fs.readDir(path).then(e => {
      return true;
    })
  } catch (e) {
    fs.createDir(path, { recursive: true });
  }
}