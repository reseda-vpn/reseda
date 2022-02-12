import { useEffect, useRef, useState } from 'react';
import { motion } from "framer-motion";
import { cardVariants, subTitleControl } from '@components/framer_constants';

import { getSession, getCsrfToken, signIn as signInAuth, getProviders, useSession } from "next-auth/react";
import { GetServerSidePropsContext } from 'next';

import { Gradient } from '@components/gradient';
import InputField from '@components/un-ui/input_field';
import Button from '@components/un-ui/button';

import { ArrowRight, Check, GitHub  } from 'react-feather';
import { useRouter } from 'next/router';
import { filter } from "lodash";
import { hashPassword } from '@root/lib/crpyt';
import { platform } from 'process';
import PlatformControls from '@components/platform_controls';
import { ipcRenderer } from 'electron';

import styles from '@styles/Home.module.css'

export default function Home({ providers }) {
    const [ authInformation, setAuthInformation ] = useState({
        email: "",
        password: ""
    });

    const router = useRouter();

    const [ awaitingReply, setAwaitingReply ] = useState(false);
    const [ authFailure, setAuthFailure ] = useState("");
    const [ authSuccess, setAuthSuccess ] = useState<"logged_out" | "logged_in" | "login_failure">("logged_out");

	useEffect(() => {
        // // Create your instance
        const gradient = new Gradient()

        // // Call `initGradient` with the selector to your canvas

        //@ts-expect-error
        gradient.initGradient('#gradient-canvas')
	}, []);

    const signIn = async (provider?) => {
        setAwaitingReply(true);

        if(provider) 
            signInAuth(provider).then(e => {
                console.log(e);
                alert(e);
            });
        else {
            // >> First Hash password for comparison, don't send un-hashed password!.
            const { ok, error } = await signInAuth("credentials", {
                email: authInformation.email,
                password: authInformation.password,
                redirect: false,
            });

            setAwaitingReply(false);

            if(error) {
                console.log(error);
                setAuthSuccess("login_failure");
                setAuthFailure("Account does not exist, try signing up!");
            }else {
                setAuthSuccess("logged_in");
                setAuthFailure("");

                router.replace('./home');
            }
        }
    }

	return (
		<div className="flex-col flex font-sans min-h-screen h-screen" > {/* style={{ background: 'linear-gradient(-45deg, rgba(99,85,164,0.2) 0%, rgba(232,154,62,.2) 100%)' }} */}
            {
				platform !== "darwin" ?
				<div className={styles.resedaFrame}>
					<div>
						Reseda VPN
					</div>

					<PlatformControls 
						onClose={() => ipcRenderer.send('close')}
						onMinimize={() => ipcRenderer.send('minimize')}	
						// onMaximize={() => {
						// 	maximized == "maximized" ? remote.getCurrentWindow().unmaximize() : remote.getCurrentWindow().maximize();
						//  	setMaximized(maximized == "maximized" ? "unmaximized" : "maximized")
						// }}
					/>
				</div>
				:
				<></>
			}

			<div className="flex-col flex flex-1 font-sans w-screen relative overflow-hidden">
				<canvas id="gradient-canvas" className="md:top-0 w-full z-10 absolute h-screen" style={{ width: '200%', height: '200%' }} data-transition-in></canvas>

                <div className="flex-row flex-1 w-screen h-full grid sm:grid-cols-3">
                    <div className="w-full bg-white z-20 flex justify-center items-center flex-col sm:p-72 max-h-screen">
                        <div className="flex flex-col flex-1 gap-8 justify-center">
                            <motion.div initial="offscreen" whileInView="onscreen" viewport={{ once: true }} variants={subTitleControl}>
                                <h2 className="font-bold font-altSans text-lg text-slate-400">RESEDA</h2>
                                <motion.h1 variants={cardVariants} className="m-0 font-bold text-2xl md:text-3xl">Login</motion.h1>
                                <motion.p  variants={cardVariants} className="text-slate-600 text-base">It{'\''}s great to have you here!</motion.p>
                            </motion.div>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm uppercase text-slate-500">Email</p>
                                    <InputField
                                        placeholder='Email'
                                        type="email"
                                        callback={(email) => {
                                            setAuthInformation({
                                                ...authInformation,
                                                email
                                            })
                                        }}
                                    />
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm uppercase text-slate-500">Password</p>
                                    <InputField
                                        type="password"
                                        placeholder='Password'
                                        callback={(password) => {
                                            setAuthInformation({
                                                ...authInformation,
                                                password
                                            })
                                        }}
                                        enterCallback={() => signIn()}
                                    />
                                </div>
                            </div>

                                    {/* Style This! */}
                            {
                                authSuccess == "login_failure" ? (
                                    <div className="flex flex-row gap-4 items-center rounded-2xl rounded-r-lg">
                                        <div className="flex items-center justify-center bg-red-100 rounded-full h-8 w-8">
                                            <p className="text-red-500 font-bold font-altSans">!</p>
                                        </div>

                                        <p className="text-red-500 font-base font-sans text-sm">
                                            { authFailure }
                                        </p>
                                    </div>
                                ) : <></>
                            }
                            
                            <div className="flex flex-row justify-between">
                                <Button 
                                    className=" bg-violet-600 text-slate-50 w-fit font-semibold"
                                    loaderOnly={awaitingReply}
                                    icon={authSuccess == "logged_in" ? <Check size={16}/> : <ArrowRight size={16} />}
                                    onClick={() => signIn()}
                                >
                                    {
                                        awaitingReply ?
                                            "Loading"
                                        :
                                            authSuccess == "logged_in" ?
                                            "Success"
                                            :
                                            authSuccess == "login_failure" ?
                                            "Login" // "Failed"
                                            :
                                            "Login"
                                    }
                                </Button>
                                <div className="flex flex-row items-center text-sm text-slate-700">
                                    No Account?<Button icon={false} className="bg-transparent text-violet-500 w-fit font-semibold" onClick={() => {
                                        router.replace('./signup')
                                    }}> Sign Up</Button>
                                </div>
                            </div>

                            <>
                                {Object.values(providers).map((provider: { name: string, id: string }) => (
                                    <div key={provider.name}>
                                        <Button onClick={(e) => { e.preventDefault(); signInAuth(provider.id) }} icon={provider.name == "GitHub" ? <GitHub size={16} /> : null  }>
                                            {provider.name}
                                        </Button>
                                    </div>
                                ))}
                            </>
                        </div>
                    </div>
                </div>
            </div>
		</div>
	)
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getSession(context);
  
    if (session) {
      return { redirect: { permanent: false, destination: "/home" } };
    }
  
    const csrfToken = await getCsrfToken({ req: context.req });
    const providers = filter(await getProviders(), (provider) => {
      return provider.type !== "credentials";
    });
  
    return {
        props: { 
            csrfToken,
            providers 
        },
    };
}