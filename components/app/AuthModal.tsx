"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightIcon, GoogleLogoIcon, UserCircleDashedIcon } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  title = "Sign in to continue",
  description = "Join the community to ask questions, share answers, and take part in discussions that matter.",
}: AuthModalProps) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-80 bg-black/25 backdrop-blur-[3px]"
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, y: -24, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 440, damping: 34, mass: 0.7 }}
            style={{ transformOrigin: "top center" }}
            className="fixed top-[10vh] sm:top-[14vh] left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-sm z-90"
          >
            <div className="bg-white overflow-hidden shadow-xl">
              <div className="flex items-center justify-left gap-2 px-5 pt-5 pb-0">
                <div className="w-9 h-9 flex rounded-2xl items-center justify-center overflow-hidden">
                  <Image
                    src="/assets/logo.png"
                    alt="Logo"
                    width={24}
                    height={24}
                    className="object-contain invert"
                  />
                </div>
                <h2 className="text-[30px] text-black tracking-tight">Surrealbox</h2>
              </div>

              <div className="px-5 pt-5 pb-6">
                <h2 className="text-sm font-bold text-black tracking-tight">{title}</h2>
                <div className="mb-5">
                  <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="custom"
                      onClick={() => {
                        router.push("/continue")
                      }}
                    >
                      <span>Sign in</span>
                      <ArrowRightIcon
                        size={14}
                        weight="bold"
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </Button>

                    <Button
                      variant="light"
                      onClick={() => {
                        router.push("/create-account")
                      }}
                      className="flex items-center justify-center gap-2"
                    >
                      <UserCircleDashedIcon />
                      Create an account
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}