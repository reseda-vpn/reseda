import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { supabase } from '@root/client'
import TabView from '@components/tabview'
import { connect, disconnect, ResedaConnection } from '@root/reseda-api'
import styles from '@styles/Home.module.css'
import { platform } from 'os'
import ip from "ip"
import PlatformControls from '../components/platform_controls'
import Button from './un-ui/button'
import Input from './un-ui/input'
import { AlertCircle, Check } from 'react-feather'

const fetcher = (url, token) =>
  fetch(url, {
    method: 'GET',
    headers: new Headers({ 'Content-Type': 'application/json', token }),
    credentials: 'same-origin',
  }).then((res) => res.json())

type Packet = {
	id: number,
	author: string,
	server: string,
	client_pub_key: string,
	svr_pub_key: string,
	client_number: number,
	awaiting: boolean,
	server_endpoint: string
}

const Auth: NextPage = () => {
	const [ authState, setAuthState ] = useState('auth-login');
    const [ authInputState, setAuthInputState ] = useState({
        email: "",
        password: "",
        username: ""
    });
    const [ authError, setAuthError ] = useState("");

	useEffect(() => {
        setAuthError(null);
    }, [authState])

	useEffect(() => {
		const session = supabase.auth.session()

		fetcher('/api/getUser', session?.access_token ?? "x").then(e => {
			console.log(e);
		});
	}, []);

	return (
		<div className={styles.container}>
			{
				platform() !== "darwin" ?
				<div className={styles.resedaFrame}>
					<div>
						Reseda VPN
					</div>

					<PlatformControls 
						// onClose={() => remote.getCurrentWindow().close()}
						// onMinimize={() => remote.getCurrentWindow().minimize()}	
						// onMaximize={() => {
						// 	maximized == "maximized" ? remote.getCurrentWindow().unmaximize() : remote.getCurrentWindow().maximize();
						//  	setMaximized(maximized == "maximized" ? "unmaximized" : "maximized")
						// }}
					/>
				</div>
				:
				<></>
			}
			

			<div className={styles.resedaAuth}>
				<div>
					<div className={styles.resedaLogo}>
						{/* Logo */}
						<div className={styles.circleCenter}>
							<h1>R</h1>
						</div>

						<div className={styles.circleSmallAbs}></div>
						<div className={styles.circleLargeAbs}></div>
						<div className={styles.circleLargestAbs}></div>
					</div>
					<div className={styles.authParent}>
						<div className={styles.authBox}>
							<div className={styles.authLeft}>
								{
									(authState == 'auth-login') ?
									<div className={styles.authLogin}>
										<div>
											<h2>Welcome Back!</h2>
											<h3>We're so excited to see you again!</h3>
										</div>
										
										<div className={styles.authInput}>
											<Input title={"Email"} type="email" defaultValue={authInputState.email} callback={(e) => setAuthInputState({ ...authInputState, email: e })}/>
											<br />
											<Input title={"Password"} type="password" defaultValue={authInputState.password} callback={(e) => setAuthInputState({ ...authInputState, password: e })}/>
											<a href="">forgot your password?</a>
										</div>

										{
											authError && <div className={styles.authError}><AlertCircle size={18} color={"var(--text-primary)"}/><p>{authError}</p></div>
										}

										<div>
											<Button title={"Login"} onClick={(out, callback) => {
												supabase.auth.signIn({
													email: authInputState.email,
													password: authInputState.password,
												}).then(e => {
													if(e.error) setAuthError(e.error.message)
													else setAuthError(null)

													callback();
												})
											}}>Login</Button>
											<p>Don't have an account? <a href="#" onClick={() => setAuthState('auth-signup')}>Sign Up</a></p> 
										</div>
									</div>
									:
									(authState !== "auth-email") ?
									<div className={styles.authLogin}>
										<div>
											<h2>Create an Account</h2>
											<h3>We're so excited to see you!</h3>
										</div>
										
										<div className={styles.authInput}>
											<Input title={"Email"} defaultValue={authInputState.email} type="email" callback={(e) => setAuthInputState({ ...authInputState, email: e })}/>
											<br />
											<Input title={"Username"} defaultValue={authInputState.username} type="text" callback={(e) => setAuthInputState({ ...authInputState, username: e })}/>
											<br />
											<Input title={"Password"} defaultValue={authInputState.password} type="password" callback={(e) => setAuthInputState({ ...authInputState, password: e })}/>
										</div>

										{
											authError && <div className={styles.authError}><AlertCircle size={18} color={"var(--text-negative)"}/><p>{authError}</p></div>
										}

										<div>
											<Button title={"Sign Up"} onClick={async (out, callback) => {
												if(authInputState.email && authInputState.password && authInputState.username) {
													const usr = await supabase.auth.signUp({
														email: authInputState.email,
														password: authInputState.password,
													}).then(u => {
														console.log(u.error)
														if(u.error)  {
															setAuthError(u.error?.message)

															return;
														}
														else setAuthError(null)

														supabase
															.from('users')
															.insert([
																{
																	id: u.user.id,
																	username: authInputState.username
																}
															])
															.then(e => {
																console.log(e);
																setAuthState('auth-email');

																callback();
															});
													}).catch(e => {
														console.error(e)
													})
												}   
											}}>Sign Up</Button>
											<p>Already have an account? <a href="#" onClick={() => setAuthState('auth-login')}>Log in</a></p> 
										</div>
									</div>
									:
									<div className={styles.authLogin}>
										<div>
											<h2>Create an Account</h2>
											<h3>Welcome to Reseda!</h3>
										</div>
										
										<div className={styles.authSuccess}>
											<div className={styles.authSuccessCircle}>
												<Check color={"white"} size={64}/>
											</div>
											
											<div>
												<h1>Success</h1>
												<h3>Please verify your email</h3>
											</div>
											
										</div>

										<div>
											<p>Havent recieved an email? <a href="#" onClick={() => setAuthState('auth-login')}>Re-send</a></p> 
										</div>
									</div>
								}
							</div>
							
							<div className={styles.authRight}>
								{
									//fetch(` https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${supabase.auth.session().provider_token}`)
								}
							</div>
						</div>
					</div>
                </div>
            </div>
		</div>
	)
}

export default Auth
