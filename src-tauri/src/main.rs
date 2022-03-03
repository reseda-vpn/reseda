#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::{Command, Stdio};
use std::fs;
use std::io::{BufWriter, Write};
use relative_path::RelativePath;
use std::path::Path;


#[tauri::command]
fn is_wireguard_up() -> String {
	let mut output = if cfg!(target_os = "windows") {
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

	println!("Status Check:: Wireguard is {}", String::from_utf8(output.stdout.to_vec()).unwrap());

	String::from_utf8(output.stdout.to_vec()).unwrap()
}

#[tauri::command]
fn start_wireguard_tunnel() -> String {
	// Switch based on target operating sys.
	let output = if cfg!(target_os = "windows") {
		Command::new("net")
			.arg("start")
			.arg("WireGuardTunnel$wg0")
			.output()

	} else {
		Command::new("wg-quick")
			.arg("up ./lib/wg0.conf")
			.output()
	};

	println!("Starting Tunnel: {:?}", output);
	return (&"Y").to_string();
}

#[tauri::command]
fn stop_wireguard_tunnel() -> String {
	// Switch based on target operating sys.
	let output = if cfg!(target_os = "windows") {
		Command::new("net")
			.arg("stop")
			.arg("WireGuardTunnel$wg0")
			.status()
			.unwrap();
	} else {
		Command::new("wg-quick")
			.arg("down ./lib/wg0.conf")
			.status()
			.unwrap();
	};

	println!("Stopping Tunnel: {:?}", output);

	return (&"Y").to_string();
}

#[tauri::command]
fn read_text_file(file_name: String) -> String  {
	let contents = fs::read_to_string(format!("lib/{}", file_name.to_owned().clone()))
        .expect("Something went wrong reading the file");

	return contents;
}

#[tauri::command]
fn write_text_file(file_name: String, text: String) {
	fs::write(format!("lib/{}", file_name.to_owned().clone()), text);
}

#[tauri::command]
fn generate_public_key(private_key: String) -> String {
	let mut exec_process = Command::new("lib/wg.exe")
		.arg("pubkey")
		.stdin(Stdio::piped())
		.stdout(Stdio::piped())
		.spawn()
		.unwrap();
		// .expect("failed to execute process");

	let mut stdin = exec_process.stdin.take().expect("Failed to open stdin");
	std::thread::spawn(move || {
		stdin.write_all(private_key.as_bytes()).expect("Failed to write to stdin");
	});

	let output = exec_process.wait_with_output().expect("Failed to read stdout");
	String::from_utf8(output.stdout.to_vec()).unwrap()
}

fn generate_private_key() -> String {
	let exec_process = Command::new("lib/wg.exe")
		.arg("genkey")
		.stdin(Stdio::piped())
		.stdout(Stdio::piped())
		.spawn()
		.unwrap();

	let output = exec_process.wait_with_output().expect("Failed to read stdout");
	String::from_utf8(output.stdout.to_vec()).unwrap()
}

#[tauri::command]
fn remove_windows_service(private_key: String) -> String {
	let mut exec_process = Command::new("sc")
		.arg("delete")
		.arg("WireGuardTunnel$wg0")
		.spawn()
		.unwrap();

	let output = exec_process.wait_with_output().expect("Failed to read stdout");
	String::from_utf8(output.stdout.to_vec()).unwrap()
}

fn main() {
	let path = std::env::current_dir().unwrap();
	let wireguard_config_path_exists = fs::metadata(format!("{}/lib/wg0.conf", &path.display()));

	let exists_ = match wireguard_config_path_exists {
		Ok(inner) => true,
		Err(ref e) => false 
	};

	println!("{:?}", exists_);
	
	if !exists_ {
		let private_key = generate_private_key();
		println!("{:?}", private_key);

		write_text_file(
			(&"wg0.conf").to_string(), 
			format!("[Interface]\nAddress = 10.0.0.0/24\nDNS = 1.1.1.1\nListenPort = 51820\nPrivateKey = {}", private_key)
		);

		let in_path = format!("{}/lib/wg0.conf", &path.display());

		if cfg!(target_os = "windows") {
			println!("Performing first time setup on WINDOWS");
			let service = runas::Command::new("lib\\wireguard.exe")
				.arg("/installtunnelservice")
				.arg(in_path)
				.status()
				.unwrap();

			println!("{:?}", service);

			let service_perms = runas::Command::new("sc.exe")
				.arg("sdset")
				.arg("WireGuardTunnel$wg0") 
				.arg("D:AR(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;SY)(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA)(A;;CCLCSWLOCRRC;;;IU)(A;;RPWPDTRC;;;BU)S:AU;FA;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;WD)")
				.status()
				.unwrap();

			println!("{:?}", service_perms);

			stop_wireguard_tunnel().await;
		}else {
			println!("Exec.OS is not currently a supported operating system.");
		}
	}else {
		println!("Configuration already exists, performing non-first time setups.");
	}

	// Then Build TAURI.
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![start_wireguard_tunnel, stop_wireguard_tunnel, read_text_file, write_text_file, generate_public_key, is_wireguard_up, remove_windows_service])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}