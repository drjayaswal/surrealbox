"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import { apiRequest } from "@/app/lib/api-client";
import { motion } from "framer-motion";
import {
  UserIcon,
  CheckIcon,
  WarningIcon,
  EnvelopeIcon,
  CameraIcon,
  SpinnerGapIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/app/HomeFeed/Avatar";
import { Author } from "@/app/types/home.type";
import { toast } from "sonner";

interface UserProfile {
  name?: string;
  email?: string;
  gender?: string;
  image?: string;
  bio?: string;
  emailVerified?: boolean;
}

type SaveState = "idle" | "saving" | "success" | "error";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const inputCls =
  "w-full h-11 rounded-2xl border border-black/5 bg-black/5 px-4 text-sm font-medium text-black outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder:text-black/30 disabled:opacity-50 disabled:cursor-not-allowed";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] flex item-center gap-2 text-black">{label}
          {hint && <span className="text-[9px]  shrink-0 text-black capitalize">{hint}</span>}
        </span>
      </div>
      {children}
    </div>
  );
}

function SaveButton({ state, onClick, label = "Save Changes" }: { state: SaveState; onClick: () => void; label?: string }) {
  const cfg = {
    idle: { text: label, cls: "", Icon: CheckIcon, spin: false },
    saving: { text: "Saving…", cls: "cursor-not-allowed", Icon: SpinnerGapIcon, spin: true },
    success: { text: "Saved!", cls: "", Icon: SealCheckIcon, spin: false },
    error: { text: "Retry", cls: "", Icon: WarningIcon, spin: false },
  }[state];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={state === "saving"}
      className={`inline-flex items-center gap-2 h-7 px-2 bg-white active:scale-95 rounded cursor-pointer text-[14px]  text-main hover:bg-gray-50 shadow-none! transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${cfg.cls}`}
    >
      <cfg.Icon size={14} weight="bold" className={cfg.spin ? "animate-spin" : ""} />
      {cfg.text}
    </motion.button>
  );
}

export default function ProfilePage() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const router = useRouter();
  let user: any;
  if (session?.user) {
    user = session?.user;
  }

  const [userForm, setUserForm] = useState<UserProfile>({});
  const [userSave, setUserSave] = useState<SaveState>("idle");

  useEffect(() => {
    if (!user) return;
    setUserForm({
      name: user.name ?? "",
      email: user.email ?? "",
      gender: user.gender ?? "",
      image: user.image ?? "",
      bio: user.bio ?? "",
      emailVerified: user.emailVerified ?? "",
    });
  }, [user?.id]);

  const doSave = async (setState: (s: SaveState) => void, fn: () => Promise<{ success: boolean }>) => {
    setState("saving");
    try {
      const r = await fn();
      if (r.success) {
        await refetch();
        setState("success");
        toast.success("Profile updated!");
      } else {
        setState("error");
      }
    } catch (err: any) {
      setState("error");
      if (err.data?.details) {
        toast.error(err.data.error || "Inappropriate content", {
          description: `Flagged for: ${err.data.details} (${err.data.confidence})`,
        });
      } else {
        toast.error(err.message || "Failed to update profile");
      }
    } finally {
      setTimeout(() => setState("idle"), 2500);
    }
  };

  const saveUser = () => doSave(setUserSave, () => apiRequest(`/api/profile/user/${user!.id}`, { method: "PATCH", body: userForm }));

  useEffect(() => {
    if (!isPending && !user) {
      router.replace("/");
    }
  }, [isPending, user, router]);

  if (isPending || !user) {
    return (
      <div className="min-h-[96vh] flex items-center justify-center bg-black/5 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-2 border-t-white border-l-transparent border-r-transparent border-b-transparent animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1166px] relative mx-auto w-full">
        <section className="p-10 rounded-3xl">

          <motion.div
            variants={fadeUp}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10"
          >
            <div>
              <h1 className="text-2xl sm:text-4xl  text-black">
                My Profile
              </h1>
              <p className="text-[12px]  text-black/60 mt-1.5">
                Manage your personal account details
              </p>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="w-full flex-1 lg:w-[300px] shrink-0"
            >
              <motion.div className="overflow-hidden">
                <div className="p-5 flex flex-col items-center text-center relative z-10">
                  <div className="relative mb-4">
                    {!userForm.image ? (
                      <Avatar author={userForm as Author} size={90} gender={userForm.gender} />
                    ) : (
                      <img
                        src={userForm.image}
                        alt={userForm.name}
                        className="w-24 h-24 rounded-full object-cover bg-black/5"
                      />
                    )}
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-2xl bg-white/10 backdrop-blur-md text-main hover:bg-gray-100 cursor-pointer shadow-lg flex items-center justify-center transition-all active:scale-90">
                      <CameraIcon size={14} weight="bold" />
                    </div>
                  </div>

                  <p className=" text-[15px] text-black ">{userForm.name || "Your Name"}</p>
                  <p className="text-[11px]  text-black/60 mt-0.5 flex items-center justify-center gap-1">
                    {user.email}
                    {user.emailVerified && <SealCheckIcon size={12} weight="fill" className="text-primary" />}
                  </p>

                  <div className="mt-4 px-4 py-2 rounded-xl inline-block">
                    <p className="text-xs text-black/40  uppercase st">Reputation</p>
                    <p className={`text-xl  ${user.reputation > 0 ? "text-green-600" : user.reputation < 0 ? "text-orange-600" : "text-black"}`}>{user.reputation}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-4 w-full"
            >
              <div className="flex-1 w-full space-y-6">
                <div className="p-6 sm:p-8 space-y-6">
                  <Field label="Full Name">
                    <div className="relative">
                      <input
                        type="text"
                        value={userForm.name ?? ""}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        placeholder="Your full name"
                        className={inputCls + " pl-10 bg-white"}
                      />
                      <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
                    </div>
                  </Field>
                  <Field label="Email Address">
                    <div className="relative">
                      <EnvelopeIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
                      <input
                        type="email"
                        value={user.email ?? ""}
                        disabled
                        className={cn(inputCls, "pl-10 cursor-not-allowed bg-white border-transparent text-black/40")}
                      />
                      {user.emailVerified && (
                        <SealCheckIcon size={16} weight="fill" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary" />
                      )}
                    </div>
                  </Field>
                  <Field label="Gender Identity">
                    <div className="flex flex-wrap items-center">
                      {(["male", "female", "other"] as const).map((g) => (
                        <Button
                          key={g}
                          type="button"
                          variant="ghost"
                          onClick={() => setUserForm({ ...userForm, gender: g })}
                          className={cn(
                            "h-10 px-6 rounded-none text-[12px] font-bold capitalize transition-all duration-300",
                            userForm.gender === g
                              ? "bg-primary hover:text-white text-white hover:bg-secondary"
                              : "bg-black/5 text-black/60 hover:bg-black/10"
                          )}
                        >
                          {g}
                        </Button>
                      ))}
                    </div>
                  </Field>
                  <Field label="About Me">
                    <textarea
                      value={userForm.bio ?? ""}
                      onChange={(e) => setUserForm({ ...userForm, bio: e.target.value })}
                      placeholder="Share your interests, expertise, or what you're looking for in Surrealbox..."
                      className={cn(inputCls, "h-32 py-3 resize-none bg-white")}
                    />
                  </Field>
                  <SaveButton state={userSave} onClick={saveUser} label="Save" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}