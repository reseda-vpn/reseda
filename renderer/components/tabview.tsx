import type { NextPage } from 'next'
import { useState } from 'react'
import styles from '../styles/Home.module.css'

const TabView: NextPage = () => {
    const [ currentTab, setCurrentTab ] = useState("servers");

	return (
		<div className={styles.resedaContentCenter}>
            <div className={styles.resedaTabBar}>
                <div>Servers</div>
                <div>Multi-Hop</div>
                <div>Settings</div>
            </div>
        </div>
	)
}

export default TabView
