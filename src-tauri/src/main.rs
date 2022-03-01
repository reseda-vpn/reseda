#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::{Command, Stdio};
use std::fs;
use std::io::{BufWriter, Write};
use relative_path::RelativePath;

#[tauri::command]
fn start_wireguard_tunnel() -> String {
	// Switch based on target operating sys.
	let output = if cfg!(target_os = "windows") {
		Command::new("net")
			.arg("start")
			.arg("WireGuardTunnel$wg0")
			.output()
			.expect("failed to execute process");
	} else {
		Command::new("wg-quick")
			.arg("up ./wg0.conf")
			.output()
			.expect("failed to execute process");
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
			.output()
			.expect("failed to execute process");
	} else {
		Command::new("wg-quick")
			.arg("down ./wg0.conf")
			.output()
			.expect("failed to execute process");
	};

	println!("Stopping Tunnel: {:?}", output);

	return (&"Y").to_string();
}

#[tauri::command]
fn read_text_file(file_name: String) -> String  {
	let contents = fs::read_to_string(format!("../bin/wireguard/{}", file_name.to_owned().clone()))
        .expect("Something went wrong reading the file");

	return contents;
}

#[tauri::command]
fn write_text_file(file_name: String, text: String) {
	fs::write(format!("../bin/wireguard/{}", file_name.to_owned().clone()), text);
}

#[tauri::command]
fn generate_public_key(private_key: String) -> String {
	let mut exec_process = Command::new("../bin/wireguard/wg.exe")
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
	let mut exec_process = Command::new("../bin/wireguard/wg.exe")
		.arg("genkey")
		.stdin(Stdio::piped())
		.stdout(Stdio::piped())
		.spawn()
		.unwrap();

	let output = exec_process.wait_with_output().expect("Failed to read stdout");
	String::from_utf8(output.stdout.to_vec()).unwrap()
}

fn main() {
	// Is it initial setup?
	if true {
		// let private_key = generate_private_key();
		// println!("{:?}", private_key);

		let path = std::env::current_dir().unwrap();

		println!("{}/bin/wireguard/wg0.conf", &path.display());

		let relative_path = RelativePath::new(path.display());
		let path = Path::new("../bin/wireguard/wg0.conf");
		let full_path = relative_path.to_path(path);

		Command::new("../bin/wireguard/wireguard.exe")
			.arg("/installtunnelservice")
			.arg(full_path) 
			.output()
			.expect("failed to execute process");

		Command::new("sc.exe")
			.arg("sdset WireGuardTunnel$wg0 \"D:AR(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;SY)(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA)(A;;CCLCSWRPWPDTLOCRRC;;;WD)(A;;CCLCSWLOCRRC;;;IU)S:(AU;FA;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;WD)")
			.output()
			.expect("failed to execute process");
	}

	// Then Build TAURI.
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![start_wireguard_tunnel, stop_wireguard_tunnel, read_text_file, write_text_file, generate_public_key])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}