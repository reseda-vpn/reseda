import { useEffect, useRef, useState } from "react";
import styles from './UnUI.module.css'

import { ArrowRight, Loader } from 'react-feather'

interface Props { icon?: any, children?: React.ReactNode, disabled?: boolean, onClick?: Function };
declare type NativeAttrs = Omit<React.ButtonHTMLAttributes<any>, keyof Props>;

const Button: React.FC<Props & NativeAttrs> = ({ icon, children, disabled, onClick, ...args }) => {
    const [ active, setActive ] = useState(false);

    return (
        <button 
            disabled={disabled}
            style={{ backgroundColor: disabled ? 'rgba(255,255,255,0.1)' : 'inherit' }}
            className={styles.button}
            onClick={(e) => {
                setActive(true);
                
                onClick(e, () => {
                    setActive(false)
                })
            }}
            {...args}>
            {
                !active ? 
                    <>
                        {
                            children ?? children
                        }
                        {
                            icon == false ?
                                <></>
                            : 
                                icon ? icon : <ArrowRight size={16} color={"var(--text-primary)"}/>
                        }
                    </>       
                :
                    <Loader size={16} className={styles.spinning}/>
            }

            
        </button>
    )
}

export default Button;