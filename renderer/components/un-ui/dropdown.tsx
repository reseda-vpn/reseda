import { InputHTMLAttributes, useEffect, useRef, useState } from "react";
import styles from './UnUI.module.css'

import { ArrowRight } from 'react-feather'

interface Props { callback: Function, defaultValue: any, parameter?: string, valueParameter?: string, options: any[] };
declare type NativeAttrs = Omit<React.InputHTMLAttributes<any>, keyof Props>;

const DropDown: React.FC<Props & NativeAttrs> = ({ options, defaultValue, parameter, valueParameter, callback, ...args }) => {
    const input_ref = useRef<HTMLSelectElement>(null);

    return (
        <select
            className={styles.input}
            onChange={() => {
                if(input_ref?.current) callback(input_ref.current.value)
            }}
            defaultValue={defaultValue}
            ref={input_ref}
            {...args}
        >
        {
            options.map((e, i) => 
                <option key={`OPTION_${i}_`} value={valueParameter ? e?.[valueParameter] : parameter ? e?.[parameter] : e}>
                    {
                        parameter ?
                            e?.[parameter]
                        :
                            e
                    }
                </option>
            )
        }
        </select>
    )
}

export default DropDown;