#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::fs;

mod tunnel;

use base64;
use rand_core::OsRng;
use x25519_dalek::{PublicKey, StaticSecret};

#[tauri::command]
fn is_wireguard_up() -> String {
	println!("Starting Status Check... ");

	let output = if cfg!(target_os = "windows") {
		Command::new("sc")
			.arg("query")
			.arg("WireGuardTunnel$wg0")
			.stdout(Stdio::piped())
			.spawn()
			.unwrap()
			.wait_with_output()
			.expect("Failed to read stdout")
			
	} else {
		Command::new("wg-quick")
			.arg("up ./lib/wg0.conf")
			.stdout(Stdio::piped())
			.spawn()
			.unwrap()
			.wait_with_output()
			.expect("Failed to read stdout")
	};

	// println!("Status Check:: Wireguard is {}", String::from_utf8(output.stdout.to_vec()).unwrap());

	String::from_utf8(output.stdout.to_vec()).unwrap()
}


#[tauri::command]
fn start_wireguard_tunnel(path: String) -> String {
	println!("Starting Tunnel... ");

	// Switch based on target operating sys.
	let output = if cfg!(target_os = "windows") {
		// thread::spawn(|| {
			Command::new("net")
			.arg("start")
			.arg("WireGuardTunnel$wg0")
			.output()
			.expect("Failed to start wireguard!");
		// })
	} else {
		// thread::spawn(move || {
			Command::new("wg-quick")
				.arg(format!("up {}/lib/wg0.conf", path))
				.output()
				.expect("Failed to start wireguard!");
		// })
	};

	println!("Started Tunnel: {:?}", output);
	return (&"Y").to_string();
}

#[tauri::command]
fn stop_wireguard_tunnel(path: String) -> String {
	println!("Stopping Tunnel... ");

	// Switch based on target operating sys.
	let output = if cfg!(target_os = "windows") {
		Command::new("net")
			.arg("stop")
			.arg("WireGuardTunnel$wg0")
			.output()
			.expect("Failed to stop wireguard!")
	} else {
		Command::new("wg-quick")
			.arg(format!("down {}/lib/wg0.conf", path))
			.output()
			.expect("Failed to stop wireguard!")
	};

	println!("Stopped Tunnel: {:?}", output);
	"Y".to_string()
}

#[tauri::command]
fn add_peer(public_key: String, endpoint: String) -> String {
	println!("Adding Peer");

	let output = Command::new("wg")
		.args(["set", "wg0", "peer", &public_key, "allowed-ips", "0.0.0.0/0", "endpoint", &endpoint])
		.output()
		.expect("Failed to start wireguard!");

	println!("{:?}", output);
	
	"Yes".to_string()
}

#[tauri::command]
fn remove_peer(public_key: String) -> String {
	println!("Adding Peer");

	Command::new("wg")
		.args(["set", "wg0", "peer", &public_key, "remove"])
		.output()
		.expect("Failed to start wireguard!");

	"Yes".to_string()
}

fn read_text_file(path: PathBuf, file_name: String) -> String  {
	println!("Reading script from file.. {}", file_name);

	let contents = fs::read_to_string(format!("{}/lib/{}", &path.display(), file_name.to_owned().clone()))
        .expect("Something went wrong reading the file");

	println!("Read script {} successfully.", file_name);
	
	return contents;
}

fn write_text_file(path: &PathBuf, file_name: String, text: String) {
	println!("Writing script to file.. {}\n\n{}", format!("{}/lib/{}", &path.display(), file_name.to_owned().clone()), text);

	match fs::write(format!("{}/lib/{}", &path.display(), file_name.to_owned().clone()), text) {
		Result::Err(_) => {
			println!("Unable to write!");
		},
		Result::Ok(_) => {
			println!("Wrote script {} successfully.", file_name);
		}
	}
}

#[tauri::command]
fn log_to_console(content: String) {
	println!("[INFO]: {}", content);
}

fn slice_to_array_32<T>(slice: &[T]) -> Result<&[T; 32], &str> {
    if slice.len() == 32 {
        let ptr = slice.as_ptr() as *const [T; 32];
        unsafe {Ok(&*ptr)}
    } else {
        Err("err")
    }
}

#[tauri::command]
fn generate_public_key(private_key: String) -> String {
	println!("Generating Public Key... ");

	let code = match base64::decode(private_key) {
		Ok(c) => c,
		Err(_) => return "Error1".to_string(),
	};

	// println!("{:?} @ {}", private_key.as_bytes(), private_key.as_bytes().len());

	let key = match slice_to_array_32(code.as_slice()) {
		Ok(a) => a.to_owned(),
		Err(_) => return "Error".to_string(),
	};

	let priv_key = StaticSecret::from(key);

	// println!("KEY: {:?}", key);

	let public = PublicKey::from(&priv_key);

	println!("KEY: {:?}", public);

   	base64::encode(public.as_bytes())
}

#[tauri::command]
fn generate_private_key() -> String {
	println!("Generating Private Key... ");

	let private = StaticSecret::new(&mut OsRng);
	base64::encode(private.to_bytes())
}

#[tauri::command]
fn remove_windows_service() -> Result<String, &'static str> {
	println!("Removing Window Service... ");

	let exec_process = runas::Command::new("sc.exe")
		.arg("delete")
		.arg("WireGuardTunnel$wg0")
		.status()
		.unwrap();

	let conf_removal_success = match fs::remove_file("lib/wg0.conf") {
		Ok(_) => true,
		Err(e) => {
			println!("Failed to remove configuration (wg0.conf) when removing windows service. Err:\t{}", e);
			false
		}
	};

	let ft_removal_success = match fs::remove_file("lib/.first_time") {
		Ok(_) => true,
		Err(e) => {
			println!("Failed to remove first time marker (.first_time) when removing windows service. Err:\t{}", e);
			false
		}
	};

	if !conf_removal_success || !ft_removal_success {
		return Err("Unable to complete windows service removal, failed to remove indicator files.");
	}

	println!("Removed Windows Service.");

	let output = exec_process.to_string();
	Ok(output)
}

#[tauri::command]
fn verify_installation() -> bool {
	let wireguard_installed = match Command::new("wg").output() {
		Ok(_) => true,
		Err(error) => {
			println!("{:?}", error);
			false
		},
	};

	wireguard_installed
}

fn main() {
	// Then Build TAURI.
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![verify_installation, generate_private_key, add_peer, remove_peer, start_wireguard_tunnel, stop_wireguard_tunnel, generate_public_key, is_wireguard_up, remove_windows_service, log_to_console])
		.setup(| _app | {
			let rpath = _app.path_resolver().resource_dir().expect("Unable to access resources directory.");
			let apath = _app.path_resolver().app_dir().expect("Unable to access app directory...");
			let wireguard_config_path_exists = fs::metadata(format!("{}/lib/wg0.conf", &apath.display()));

			println!("Dir: {}", format!("{}/lib/wg0.conf", &apath.display()));

			let exists_ = match wireguard_config_path_exists {
				Ok(_inner) => true,
				Err(ref _e) => false 
			};

			println!("{:?}", exists_);
			
			if !exists_ {
				fs::create_dir_all(apath.clone().join("lib"))?;

				let private_key = generate_private_key();

				write_text_file(
					&apath,
					(&"wg0.conf").to_string(), 
					format!("[Interface]\nAddress = 10.0.0.0/24\nDNS = 1.1.1.1\nListenPort = 8443\nPrivateKey = {}", private_key)
				);

				let mut perms = fs::metadata(format!("{}/lib/wg0.conf", &apath.display()))?.permissions();
				perms.set_readonly(false);
				fs::set_permissions(format!("{}/lib/wg0.conf", &apath.display()), perms)?;

				write_text_file(
					&apath,
					(&"reseda.first_time").to_string(), 
					format!("Yes!")
				);

				let in_path = format!("{}/lib/wg0.conf", &apath.display());

				if cfg!(target_os = "windows") {
					println!("Performing first time setup on WINDOWS");
					
					let service = runas::Command::new(format!("{}\\lib\\wireguard.exe", &rpath.display()))
						.arg("/installtunnelservice")
						.arg(in_path)
						.status();

					match service {
						Result::Err(_) => {
							println!("Failed to install tunnel service for wg0.");
						},
						Result::Ok(_) => {
							println!("Installed tunnel service: windows.")
						}
					};

					let service_perms = runas::Command::new("sc.exe")
						.arg("sdset")
						.arg("WireGuardTunnel$wg0") 
						// .arg("\"D:AR(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;SY)(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA)(A;;CCLCSWRPWPDTLOCRRC;;;WD)(A;;CCLCSWLOCRRC;;;IU)S:(AU;FA;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;WD)\"")
						.arg("D:AR(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;SY)(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA)(A;;CCLCSWLOCRRC;;;IU)(A;;RPWPDTRC;;;BU)(A;;CCLCSWRPWPDTLOCRRC;;;WD)S:AU;FA;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;WD)")
						.status();

					match service_perms {
						Result::Err(_) => {
							println!("Failed to install tunnel service for wg0.");
						},
						Result::Ok(_) => {
							println!("Installed tunnel service: windows.")
						}
					};

					stop_wireguard_tunnel(apath.display().to_string());
				}else {
					println!("Alternate Setup Route");

					// let execution_perms = Command::new("chmod")
					// 	.arg("a+x")
					// 	.arg(format!("{}\\lib\\wg.exe", &apath.display()))
					// 	.status();

					// match execution_perms {
					// 	Ok(ok) => {
					// 		println!("Success in changing execution permissions for WG.EXE {:?}", ok)
					// 	},
					// 	Err(err) => {
					// 		println!("Error in changing permissions of WG.EXE: {:?}", err)
					// 	}
					// };

					println!("Exec.OS is not currently a supported operating system.");
				}
			}else {
				println!("Configuration already exists, performing non-first time setups.");
			}	

			Ok(())
		})
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}