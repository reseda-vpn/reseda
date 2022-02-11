import { useEffect, useRef, useState } from "react";
import styles from './UnUI.module.css'

import { ArrowRight } from 'react-feather'
import Loader from '@components/un-ui/loader'
import Image from "next/image";

interface Props { icon?: any, inline?: boolean, children?: React.ReactNode, loaderOnly?: boolean };
declare type NativeAttrs = Omit<React.LinkHTMLAttributes<any>, keyof Props>;

const Button: React.FC<Props & NativeAttrs> = ({ icon, inline, children, className, loaderOnly, ...args }) => {
    return (
        <a 
            {...args}
            className={`${ inline ? styles.inlineButton : "flex items-center justify-center relative h-8 px-3 py-0 rounded-md font-sans hover:cursor-pointer outline-none gap-2 text-sm "+className }`}
            >
            {
                loaderOnly ? 
                <>
                    {
                        children ?? children
                    }
                    
                    {/* <Image src={"/assets/spinner.svg"} alt="" width={16} height={16} color={"#fff"} /> className={styles.spinning}  */}
                    <Loader color="#ffffff" height={16} />
                    {/* <Loader size={16} className={styles.spinning}/> */}
                </>
                :
                <>
                    {
                        children ?? children
                    }
        
                    {
                        icon == false ?
                            <></>
                        : 
                            icon ? icon : <ArrowRight size={16} />
                    }
                </>
            }
            
        </a>
    )
}

export default Button;