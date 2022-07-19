import WireGuard from '@components/reseda'
import { useEffect, useState } from 'react'
import type { NextPage } from 'next'

const Home: NextPage = () => {
    const [ config, setConfig ] = useState<{ file_path: string, user: any }>(null);

    useEffect(() => {
        const session = JSON.parse(localStorage.getItem("reseda.safeguard"));

        if(typeof navigator !== 'undefined') {
            (async () => {
                const { appDir } = await import('@tauri-apps/api/path');

                setConfig({ file_path: await appDir() + "lib\\wg0.conf", user: session })
            })();
        }
    }, [])

	return (
        <>
            {
                config?.file_path ?
                <WireGuard file_path={config.file_path} user={config.user}></WireGuard>
                :
                <></>
            }
        </>
    )
}

export default Home
