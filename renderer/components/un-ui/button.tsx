import { useEffect, useRef, useState } from "react";
import styles from './UnUI.module.css'

import { ArrowRight } from 'react-feather'

interface Props { icon?: any, children?: React.ReactNode };
declare type NativeAttrs = Omit<React.ButtonHTMLAttributes<any>, keyof Props>;

const Button: React.FC<Props & NativeAttrs> = ({ icon, children, ...args }) => {
    return (
        <button 
            className={styles.button}
            {...args}>
            {
                children ?? children
            }

            {
                icon == false ?
                    <></>
                : 
                    icon ? icon : <ArrowRight size={16} />
            }
        </button>
    )
}

export default Button;