"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowCircleLeftIcon,
  UserIcon,
  UsersThreeIcon,
  CircleNotchIcon,
  HandTapIcon,
  ArrowRightIcon,
  PackageIcon,
  HouseIcon,
  BriefcaseIcon,
  EmptyIcon,
  ListMagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/app/lib/auth-client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter()
  const { data: session, isPending, error } = authClient.useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedState = localStorage.getItem("admin_sidebar_collapsed");
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "admin_sidebar_collapsed",
      JSON.stringify(isCollapsed),
    );
  }, [isCollapsed]);

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        setUser(session.user);
      }
      setIsLoading(false);
    }
  }, [isPending, session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white" />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-accent px-6 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
          <EmptyIcon size={32} className="text-main" weight="fill" />
        </div>
      </div>
    );
  }

  const navItems = [
    {
      name: "Home", href: `/admin/home`, icon: HouseIcon,
      bgcolor: "bg-main/10",
      color: "text-main"
    },
    {
      name: "Sessions",
      href: `/admin/sessions`,
      icon: UsersThreeIcon,
      bgcolor: "bg-secondary/20",
      color: "text-secondary",
    },
    {
      name: "Account",
      href: `/admin/account`,
      icon: UserIcon,
      bgcolor: "bg-main/10",
      color: "text-main",
    },
  ];
  return (
    <div
      onClick={() => {
        if (isPoliciesOpen) {
          setIsPoliciesOpen(false);
        }
      }}
      className="flex h-screen w-full font-sans overflow-hidden bg-white"
    >
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-white/60 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed && !isMobileOpen ? 64 : 240,
        }}
        transition={{ type: "spring", stiffness: 250, damping: 30 }}
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <nav className="flex-1 overflow-y-auto pb-4 pt-3 space-y-0.5 px-3 custom-scrollbar">
          {navItems.map((item, i) => {
            const isActive =
              pathname === item.href || item.name === `${user?.name}`;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className="block"
              >
                <motion.div
                  className={`group relative flex h-10 items-center transition-all duration-200 cursor-pointer ${isCollapsed && !isMobileOpen ? "justify-center" : "px-2"}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className={`absolute inset-0 ${isCollapsed ? `${item.bgcolor}` : `bg-black/5`} shadow-inner rounded-xl -z-10`}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <div
                    className={`bg-background ${isActive && "shadow-sm"} rounded-full p-1.5`}
                  >
                    <Icon
                      weight={isActive ? "fill" : "regular"}
                      size={isCollapsed && !isMobileOpen ? 20 : 16}
                      className={`shrink-0 transition-transform duration-300 ${isActive ? `scale-110 ${item.color}` : "text-secondary opacity-50 group-hover:opacity-100 scale-100 group-hover:scale-110"}`}
                    />
                  </div>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`ml-3 whitespace-nowrap overflow-hidden  uppercase text-[11px] st ${isActive ? item.color : "text-secondary opacity-50 group-hover:opacity-100"}`}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block shrink-0 space-y-2 border-t border-accent p-3 bg-background">
          <button
            onClick={() => router.push("/")}
            className="flex w-full items-center justify-center h-10 shadow-inner bg-accent rounded-2xl transition-all cursor-pointer border-none outline-none"
          >
            <ListMagnifyingGlassIcon
              weight="regular"
              size={!isCollapsed ? 20 : 24}
              className="transition-transform duration-300 text-main"
            />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-2 text-[10px] uppercase   text-main overflow-hidden whitespace-nowrap"
                >
                  Search
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-center h-10 shadow-inner bg-gray-100 rounded-2xl transition-all cursor-pointer border-none outline-none"
          >
            <ArrowCircleLeftIcon
              weight="regular"
              size={!isCollapsed ? 20 : 24}
              className={`transition-transform duration-300 text-black ${isCollapsed ? "rotate-180" : ""}`}
            />
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0, x: -10 }}
                  animate={{ opacity: 1, width: "auto", x: 0 }}
                  exit={{ opacity: 0, width: 0, x: -10 }}
                  className="ml-2 text-[10px] uppercase   text-black overflow-hidden whitespace-nowrap"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
      <div className="relative z-100">
        <div
          className="absolute bg-main rounded-r-xl hover:shadow-md top-1 left-0 flex items-center gap-4"
          ref={menuRef}
        >
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-1.5 text-white cursor-pointer border-none outline-none bg-transparent"
          >
            <ArrowRightIcon size={20} />
          </button>
        </div>
      </div>
      <main className="px-6 sm:py-10 py-12 w-full bg-white overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
