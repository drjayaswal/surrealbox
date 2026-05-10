"use client";

import {
  HouseIcon,
  InfoIcon,
  UserIcon,
  ListIcon,
  FileTextIcon,
  UserGearIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { authClient } from "@/app/lib/auth-client";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { data: session } = authClient.useSession();
  const [isSigningOut, setIsSignOutLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isAdmin = (session?.user as { role?: string })?.role?.toLowerCase() === "admin";
  const user = session?.user;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    setIsSignOutLoading(true);
    try {
      await authClient.signOut();
    } catch {
      throw new Error("Failed to sign out");
    } finally {
      setIsSignOutLoading(false);
      setMobileOpen(false);
    }
  };

  const navLinks = [
    { name: "Home", href: "/", icon: HouseIcon, color: "text-primary" },
    ...(isAdmin
      ? [
        {
          name: "Admin",
          href: "/admin/home",
          icon: UserGearIcon,
          color: "text-primary",
        },
      ]
      : []),
    ...(user
      ? [
        {
          name: "Profile",
          href: "/profile",
          icon: UserIcon,
          color: "text-primary",
        },
      ]
      : []),
    { name: "About", href: "/about", icon: InfoIcon, color: "text-primary" },
    { name: "Terms", href: "/terms", icon: FileTextIcon, color: "text-primary" },
  ];

  if (!mounted) return null;

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 left-0 z-50 w-full lg:w-1/2 lg:bg-black/20 lg:backdrop-blur-md pointer-events-none"
        style={{ minWidth: "min-content" }}
      >
        <div className="hidden lg:flex h-0.5 w-full pointer-events-auto" />
        <div className="hidden lg:flex max-w-full px-4 h-12 items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <nav className="flex items-center p-1 gap-1">
              {navLinks.map((link, idx) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={idx}
                    href={link.href}
                    className="relative flex items-center justify-center gap-1.5 h-8 px-3 rounded-3xl text-[10px] font-bold uppercase transition-colors duration-200 cursor-pointer whitespace-nowrap"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 bg-white border border-white rounded-3xl shadow-sm"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 28,
                        }}
                      />
                    )}
                    <span
                      className={`relative flex items-center gap-1.5 transition-colors duration-200 ${isActive ? link.color : "text-white"
                        }`}
                    >
                      <Icon size={14} weight={isActive ? "fill" : "regular"} />
                      {link.name && <span>{link.name}</span>}
                    </span>
                  </Link>
                );
              })}
            </nav>
            {user && (
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors pointer-events-auto cursor-pointer"
                title="Sign Out"
              >
                {isSigningOut ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <SignOutIcon size={14} weight="bold" className="text-white" />
                )}
              </button>
            )}
          </div>
        </div>
        <div className="hidden lg:block h-px w-full" />
        <div className="flex lg:hidden items-center h-14 px-3 pointer-events-auto">
          <motion.button
            onClick={() => setMobileOpen(true)}
            whileTap={{ scale: 0.92 }}
            className="flex items-center justify-center bg-white/10 backdrop-blur-md w-10 h-10 rounded-xl shadow-md cursor-pointer"
            aria-label="Open menu"
          >
            <ListIcon
              size={20}
              weight="bold"
              className="absolute text-primary"
              aria-hidden
            />
          </motion.button>
        </div>
      </motion.header>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-60 bg-black/5 backdrop-blur-[3px] lg:hidden"
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: -24, scaleY: 0.92 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -16, scaleY: 0.94 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
                mass: 0.8,
              }}
              style={{ transformOrigin: "top center" }}
              className="fixed top-0 left-1/2 max-w-xl w-full -translate-x-1/2 z-70 lg:hidden"
            >
              <div className="bg-white border-b border-gray-200 rounded-b-2xl overflow-hidden">
                <nav className="px-3 py-3 flex flex-col gap-1">
                  {[...navLinks].map((link, i) => {
                    const Icon = link.icon;
                    const isActive =
                      pathname === link.href ||
                      (link.href !== "/" && pathname.startsWith(link.href));
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.04, duration: 0.2 }}
                      >
                        <Link
                          href={link.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-4xl text-sm font-semibold transition-all duration-150 ${isActive
                            ? "bg-primary text-white"
                            : "text-black hover:bg-gray-100"
                            }`}
                        >
                          <Icon
                            size={18}
                            weight={isActive ? "fill" : "regular"}
                            className={isActive ? "text-white" : "text-black"}
                          />
                          {link.name}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
                {user && (
                  <div className="px-3 pb-3">
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-4xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all duration-150"
                    >
                      {isSigningOut ? (
                        <div className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                      ) : (
                        <SignOutIcon size={18} weight="bold" />
                      )}
                      {isSigningOut ? "Signing out..." : "Sign Out"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;