#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::{Command};
use std::{io, fs};

#[tauri::command]
fn start_wireguard_tunnel() {
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
}

#[tauri::command]
fn read_text_file(file_name: String) -> String  {
	println!("{}", file_name);

	let contents = fs::read_to_string(format!("../{}", file_name.to_owned().clone()))
        .expect("Something went wrong reading the file");

	return contents;
}

#[tauri::command]
fn write_text_file(file_name: String, text: String) {
	println!("{}", text);

	let contents = fs::write(format!("../{}", file_name.to_owned().clone()), text);
}


fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![start_wireguard_tunnel, read_text_file, write_text_file])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}