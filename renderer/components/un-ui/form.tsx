import { useEffect, useRef, useState } from "react";
import styles from './UnUI.module.css'

import { ArrowRight } from 'react-feather'

interface Props { children?: React.ReactNode };
declare type NativeAttrs = Omit<React.HTMLAttributes<any>, keyof Props>;

const Form: React.FC<Props & NativeAttrs> = ({ children, ...args }) => {
    return (
        <div 
            {...args}>
            {
                children ?? children
            }
        </div>
    )
}

export default Form;