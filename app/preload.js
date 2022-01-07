// const {
//     contextBridge,
//     ipcRenderer
// } = require("electron");

const { ipcRenderer, ipcMain } = require("electron");

// // Expose protected methods that allow the renderer process to use
// // the ipcRenderer without exposing the entire object
// contextBridge.exposeInMainWorld(
//     "api", {
//         send: (channel, data) => {
//             // whitelist channels
//             let validChannels = ["close", "minimize", "maximize", "unmaximize"];
//             if (validChannels.includes(channel)) {
//                 ipcRenderer.send(channel, data);
//             }
//         },
//         receive: (channel, func) => {
//             let validChannels = ["close", "minimize", "maximize", "unmaximize"];
//             if (validChannels.includes(channel)) {
//                 // Deliberately strip event as it includes `sender` 
//                 ipcRenderer.on(channel, (event, ...args) => func(...args));
//             }
//         }
//     },
//     "global", {
//         global
//     }
// );

ipcRenderer.on("close", () => {
    window.top.close();
})