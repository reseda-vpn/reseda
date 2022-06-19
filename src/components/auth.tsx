import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import TabView from '@components/tabview'
import styles from '@styles/Home.module.css'
import { platform } from 'os'
import ip from "ip"
import PlatformControls from '../components/platform_controls'
import Button from './un-ui/button'
import Input from './un-ui/input'
import { AlertCircle, Check } from 'react-feather'

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

	return (
		<div className={styles.container}>
			{
				platform() !== "darwin" ?
				<div className={styles.resedaFrame}>
					<div>
						Reseda VPN
					</div>

					<PlatformControls />
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
											<p>Haven{'\''}t received an email? <a href="#" onClick={() => setAuthState('auth-login')}>Re-send</a></p> 
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
