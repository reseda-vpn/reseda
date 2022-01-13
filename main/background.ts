import { app, ipcMain, ipcRenderer } from 'electron';
import serve from 'electron-serve';
import path from 'path';
import fs from "fs"
import sudo from "sudo-prompt"
import { createWindow } from './helpers';
import { init } from '../renderer/reseda-api';
import { WgConfig } from 'wireguard-tools';
import { exec, spawnSync } from 'child_process';
import { Service } from "node-windows"

// require('@electron/remote/main').initialize()
// require("@electron/remote/main").enable(webContents)

const run_loc = path.join(process.cwd(), './', `/wireguard`);
const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app'  });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    minWidth: 1050,
    minHeight: 750,
    frame: false,
    resizable: false,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
    }
  });

  mainWindow.setMenuBarVisibility(false);
  app.setUserTasks([]);

  ipcMain.on('minimize', () => mainWindow.minimize() );
  ipcMain.on('close', () => mainWindow.close())
  
  if (isProd) {
    await mainWindow.loadURL('app://./home.html');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    // mainWindow.webContents.openDevTools();
  }
})();

app.on('window-all-closed', () => {
  app.quit();
});


app.on('ready', async () => {
  const firstTimeFilePath = path.resolve(app.getPath('userData'), '.first-time-huh');
  let isFirstTime;

  try {
    fs.closeSync(fs.openSync(firstTimeFilePath, 'wx'));
    isFirstTime = true;
  } catch(e) {
    if (e.code === 'EEXIST') {
      isFirstTime = false;
    } else {
      // something gone wrong
      throw e;
    }
  }

  if(isFirstTime) {
    const filePath = path.join(process.cwd(), './', '/wg0.conf');

    // ex(`sc.exe create WireGuardTunnel$wg0 DisplayName= ResedaWireguard type= own start= auto error= normal depend= Nsi/TcpIp binPath= "${path.join(run_loc, './main.exe')} install wireguard/wg0.conf"  &&  sc.exe --% sidtype WireGuardTunnel$wg0 unrestricted  &&  sc.exe sdset WireGuardTunnel$wg0 "D:AR(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;SY)(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA)(A;;CCLCSWRPWPDTLOCRRC;;;WD)(A;;CCLCSWLOCRRC;;;IU)S:(AU;FA;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;WD)"`, true, () => {})

    const client_config = new WgConfig({
      wgInterface: {
        dns: ["1.1.1.1"],
        address: ["192.128.69.2/24"]
      },
      filePath
    })
    
    // Generate Private Key for Client
    await client_config.generateKeys();
    console.log("[CONN] >> Generated Client Configuration");
    
    // Generate UNIQUE Public Key using wireguard (wg). public key -> pu-c-key
    const puckey = spawnSync(path.join(run_loc, './wg.exe'), ["pubkey"], { input: client_config.wgInterface.privateKey }).output;
    const key = puckey.toString();
    
    // Set the public key omitting /n and /t after '='.
    client_config.publicKey = key.substring(0, key.indexOf('=')+1)?.substring(1);
    console.log(client_config.publicKey);
  
    client_config.writeToFile();

    ex(`${path.join(run_loc, './wireguard.exe')} /installtunnelservice ${filePath} && sc.exe sdset WireGuardTunnel$wg0 "D:AR(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;SY)(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA)(A;;CCLCSWRPWPDTLOCRRC;;;WD)(A;;CCLCSWLOCRRC;;;IU)S:(AU;FA;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;WD)"`, true, () => {
      console.log(`CONFIG INSTALLED & PUBLICIZED`);
    });
  }
});

const ex = (command: string, with_sudo: boolean, callback: Function) => {
	if(with_sudo) {
		sudo.exec(command, {
			name: "Reseda Wireguard"
		}, (_, __, err) => {
			if(err) throw err;
			callback(__);
		});
	}else {
		exec(command, (_, __, err) => {
			if(err) throw err;
			callback(__);
		})
	}
}