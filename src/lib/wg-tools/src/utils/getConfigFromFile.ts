import { invoke } from '@tauri-apps/api/tauri'
import { parseConfigString } from './configParser'
import * as f from '@tauri-apps/api/fs'
import { appDir, executableDir, publicDir, resourceDir, runtimeDir } from "@tauri-apps/api/path"
const fs = f

interface Options {
  /** Full, absolute path to file including file name and extension */
  filePath: string
}

/**
 * Get a wireguard config file as a string
 */
export const getConfigStringFromFile = async (opts: Options) => {
  // const string = await fs.readTextFile(opts.filePath)
  // return string
}

/**
 * Get a wireguard config file as a parsed object
 */
export const getConfigObjectFromFile = async (opts: Options) => {
  const file = fs.readTextFile(`${await resourceDir()}lib\\${opts.filePath}`)
    .then(e => {
      console.log(e);
      const obj = parseConfigString(e)
      return obj;
    });
  
  return file;
}