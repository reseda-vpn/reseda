import { useEffect, useRef, useState } from "react";
import styles from './UnUI.module.css'

import { ArrowRight } from 'react-feather'

interface Props { icon?: any, children?: React.ReactNode, disabled?: boolean };
declare type NativeAttrs = Omit<React.ButtonHTMLAttributes<any>, keyof Props>;

const Button: React.FC<Props & NativeAttrs> = ({ icon, children, disabled, ...args }) => {
    return (
        <button 
            disabled={disabled}
            style={{ backgroundColor: disabled ? 'rgba(255,255,255,0.1)' : 'inherit' }}
            className={styles.button}
            {...args}>
            {
                children ?? children
            }

            {
                icon == false ?
                    <></>
                : 
                    icon ? icon : <ArrowRight size={16} color={"var(--text-primary)"}/>
            }
        </button>
    )
}

export default Button;