import util from 'util'
import { Command } from '@tauri-apps/api/shell'

const execute = (...params: any) => new Command(params).execute()

interface Options {
  /** Function to run when data is returned from exec */
  onData?: (data: string) => any
  /** Function to run when error occurs */
  onError?: (err: string) => any
  /** Function to run when exec ends */
  onClose?: (code: number) => any
}

/**
 * A better exec with promises etc.
 */
export const exec = async (command: string, opts?: Options) => {
  const promise = execute(command)
  const child = await promise;
  
  if (opts) {
    const { onData, onError, onClose } = opts
    if (onData && typeof opts.onData === 'function') {
      onData(child.stdout)
    }
    if (onError && typeof opts.onError === 'function') {
      onError(child.stderr)
    }
    if (onClose && typeof opts.onClose === 'function') {
      onClose(child.code ?? 0)
    }
  }

  // i.e. can then await for promisified exec call to complete
  const { stdout, stderr } = await promise
  if (stderr) throw new Error(stderr)
  return stdout
}