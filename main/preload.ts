import { getCurrentWindow } from "@electron/remote";
import { ipcRenderer } from "electron";

ipcRenderer?.on("maximize", () => getCurrentWindow().maximize());
ipcRenderer?.on("unmaximize", () => getCurrentWindow().unmaximize());
ipcRenderer?.on("close", () => getCurrentWindow().close());
ipcRenderer?.on("minimize", () => getCurrentWindow().minimize());