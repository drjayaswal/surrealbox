"use client"
import { motion } from "framer-motion";

const Logo = () => {
    return (
        <motion.header
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute bottom-2 left-2 w-20 h-20 justify-center items-center flex z-50 bg-white/15 backdrop-blur-md rounded-3xl"
        >
            <img
                src="/favicon.png"
                alt="logo"
                className="aspect-square w-10 h-10"
            />
        </motion.header>
    );
};

export default Logo;
