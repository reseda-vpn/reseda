import * as f from '@tauri-apps/api/fs'
const fs = f

import path from 'path'
import { WgConfigObject } from '../types/WgConfigObject'
import { generateConfigString } from './configParser'
import { execPath } from 'process'

interface Options {
  /** The full path to the file to write (use path.join to construct a full path before passing into this function) */
  filePath: string
  /** The config to write either as a string or config object */
  config: WgConfigObject | string
}

/**
 * A helper for writing a config file using fs.
 * Checks that the dir exists and creates it if not
 */
export const writeConfig = async (opts: Options) => {
  try {
	console.log("Writing Configuration");
	
	const { filePath, config } = opts
	// await makeSureDirExists(dir)
	const configString = typeof config === 'string' ? config : generateConfigString(config);

	console.log(configString);

	const write = await fs.writeFile({
		contents: configString,
		path: filePath
	});

	console.log("Written?", write, execPath);

	// await invoke('write_text_file', { fileName: "wg0.conf", text: configString });
	// await fs.writeFile({ path: filePath, contents: configString })
	// await fs.chmod(filePath, '600')
  } catch (e) {
	const message = `Failed to write config at path: ${opts.filePath}`
	throw new Error(`${message}\n${e}`)
  }
}