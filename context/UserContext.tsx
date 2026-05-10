"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "@/app/lib/auth-client";

interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  reputation: number;
  bio: string | null;
  gender: string;
  role: "user" | "admin";
  createdAt: Date;
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  refreshUser: () => Promise<void>;
  adjustReputation: (delta: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isSessionLoading } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchUserProfile() {
    if (!session?.user?.id) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isSessionLoading) {
      fetchUserProfile();
    }
  }, [session?.user?.id, isSessionLoading]);

  function adjustReputation(delta: number) {
    setUser((prev) => prev ? { ...prev, reputation: prev.reputation + delta } : prev);
  }

  const value = {
    user,
    isLoading: isLoading || isSessionLoading,
    isLoggedIn: !!session?.user,
    refreshUser: fetchUserProfile,
    adjustReputation,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
