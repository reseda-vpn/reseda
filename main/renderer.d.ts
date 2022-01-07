export interface IElectronAPI {
    send: (channel: string, data: any) => Promise<void>,
    receive: (channel: string, func: Function) => Promise<void>
}
  
declare global {
    interface Window {
        api: IElectronAPI
    }
}