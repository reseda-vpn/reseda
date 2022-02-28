import { invoke } from '@tauri-apps/api/tauri'
import { parseConfigString } from './configParser'

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
  const output: string = await invoke('read_text_file', { fileName: opts.filePath });
  console.log(output);
  
  const obj = parseConfigString(output)
  return obj
}