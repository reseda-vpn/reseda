import { InputHTMLAttributes, useEffect, useRef, useState } from "react";
import styles from './UnUI.module.css'

import { ArrowRight, Check, CornerDownLeft, Heart, Key, Loader, RefreshCw, Repeat, Triangle } from 'react-feather'

interface Props { callback: Function, children?: React.ReactNode, enterCallback?: Function };
declare type NativeAttrs = Omit<React.InputHTMLAttributes<any>, keyof Props>;

const InputField: React.FC<Props & NativeAttrs> = ({ children, callback, enterCallback, ...args }) => {
    const input_ref = useRef<HTMLInputElement>(null);

    return (
            <div  >
                <input
                    className={styles.inputField}
                    onKeyPress={(e) => {
                        if(e.key == "Enter") {
                            enterCallback();
                        }
                    }}
                    onChange={() => {
                        callback(input_ref.current.value);
                    }}
                    ref={input_ref}
                    {...args}>
                    {
                        children ?? children
                    }
                </input>
            </div>
        )  
}

export default InputField;