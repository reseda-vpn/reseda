import { InputHTMLAttributes, useEffect, useRef, useState } from "react";
import styles from './UnUI.module.css'

import { ArrowRight } from 'react-feather'

interface Props { callback: Function, children?: React.ReactNode, title?: string, defaultValue?: string };
declare type NativeAttrs = Omit<React.InputHTMLAttributes<any>, keyof Props>;

const Input: React.FC<Props & NativeAttrs> = ({ children, callback, title, defaultValue, ...args }) => {
    const input_ref = useRef<HTMLInputElement>(null);

    return (
        <input 
            className={styles.input}
            onChange={() => {
                if(input_ref?.current) callback(input_ref.current.value)
            }}
            value={defaultValue ?? ""}
            placeholder={title ?? args?.["placeholder"] ?? ""}
            ref={input_ref}
            {...args}>
            {
                children ?? children
            }
        </input>
    )
}

export default Input;