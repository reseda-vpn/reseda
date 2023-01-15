use std::{net::{SocketAddrV4, SocketAddr, Ipv4Addr}, str::FromStr, sync::Arc};
use futures::future::abortable;
use tauri::{plugin::{Builder, TauriPlugin}, Manager, Runtime, State, async_runtime::{spawn_blocking, JoinHandle, Mutex}};
use onetun::{config::{X25519PublicKey, X25519SecretKey, Config}, events::Bus};
use futures::stream::{AbortHandle, Abortable};

pub fn generate_tun_config(private_key: &str, register_ip: &str, endpoint_key: &str, endpoint_ip: &str) -> Config {
	let key = match X25519SecretKey::from_str(private_key) {
		Ok(val) => val,
		Err(err) => panic!("Failed to parse {}", err),
	};

	let endpoint_key = match X25519PublicKey::from_str(endpoint_key) {
		Ok(val) => val,
		Err(err) => panic!("Failed to parse {}", err),
	};

	let ipv4 = match SocketAddrV4::from_str(endpoint_ip) {
		Ok(val) => val,
		Err(err) => panic!("Unable to parse IPV4 from value {}. Reason: {}", endpoint_ip, err),
	};

	let endpoint_addr = std::net::SocketAddr::V4(ipv4);

	let endpt_bind = match SocketAddrV4::from_str("0.0.0.0:0") {
		Ok(val) => val,
		Err(err) => panic!("Unable to parse IPV4 from value {}. Reason: {}", endpoint_ip, err),
	};

	let endpoint_bind_addr = SocketAddr::V4(endpt_bind);

	let register = match Ipv4Addr::from_str(register_ip) {
		Ok(val) => val,
		Err(err) => panic!("Unable to parse IPV4 from value {}. Reason: {}", register_ip, err),
	};

	Config {
		port_forwards: vec![],
		remote_port_forwards: vec![],
		private_key: Arc::new(key),
		endpoint_public_key: Arc::new(endpoint_key),
		endpoint_addr: endpoint_addr,
		endpoint_bind_addr: endpoint_bind_addr,
		source_peer_ip: std::net::IpAddr::V4(register),
		keepalive_seconds: None,
		max_transmission_unit: 1420,
		log: format!("info"),
		warnings: vec![],
		pcap_file: None,
	}
}

pub async fn spawn_tunnel_handler(config: Config) -> anyhow::Result<()> {
    onetun::start_tunnels(config, Bus::default()).await?;
	futures::future::pending().await
}

#[tauri::command]
async fn start_tunnel(private_key: String, register_ip: String, endpoint_key: String, endpoint_ip: String, state: State<'_, GlobalTunState>) -> Result<(), ()> {
	let conf = generate_tun_config(&private_key, &register_ip, &endpoint_key, &endpoint_ip);
	
	let task = tauri::async_runtime::spawn(async {
		spawn_blocking(move || {
			spawn_tunnel_handler(conf)
		});
	});

    state.0.lock().await.tunnel = Some(abortable(task));
    Ok(())
}

#[tauri::command]
async fn stop_tunnel(state: State<'_, GlobalTunState>) -> Result<(), ()> {
    let s = state.0.lock().await;

	match &s.tunnel {
        Some((_, handle)) => {
            handle.abort();
            Ok(())
        },
        None => {
            Err(())
        } 
    }
}
  
#[derive(Default)]  
struct TunState {
    pub tunnel: Option<(Abortable<JoinHandle<()>>, AbortHandle)>
}

#[derive(Default)]  
pub struct GlobalTunState(Mutex<TunState>);
  
pub fn init<R: Runtime>() -> TauriPlugin<R> {
Builder::new("onetun")
    .invoke_handler(tauri::generate_handler![start_tunnel, stop_tunnel])
    .setup(|app_handle| {
    // setup plugin specific state here
    app_handle.manage(GlobalTunState::default());
    Ok(())
    })
    .build()
}