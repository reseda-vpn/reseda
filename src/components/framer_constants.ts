import { Variants } from "framer-motion";

export const subTitleControl: Variants = {
    offscreen: { opacity: 0, y: 20, },
    onscreen: {
        opacity: 1,
        y: 0,
        transition: {
            staggerChildren: 0.5,
            type: "spring",
            bounce: 0.2,
            duration: 0.5,
            delay: 0.3
        }
    }
}

export const titleControl: Variants = {
    offscreen: { opacity: 0, y: 20, },
    onscreen: {
        opacity: 1,
        y: 0,
        transition: {
            staggerChildren: 0.6,
            type: "tween",
            ease: "easeOut",
            duration: 0.4,
            delay: 0.2
        }
    }
}

export const titleVariants: Variants = {
    offscreen: {
        opacity: 0,
        y: 20
    },
    onscreen: {
        opacity: 1,
        y: 0,
        transition: {
            type: "tween",
            ease: "easeOut",
            duration: 0.4,
        }
    }
}

export const cardVariants: Variants = {
    offscreen: {
          opacity: 0,
        y: 20
    },
    onscreen: {
         opacity: 1,
        y: 0,
        transition: {
            type: "tween",
            ease: "easeOut",
            duration: 0.4,
        }
    }
};