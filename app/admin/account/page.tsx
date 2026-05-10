"use client";

import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import {
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CalendarIcon,
  GlobeHemisphereEastIcon,
} from "@phosphor-icons/react";
import { getAreaName } from "@/app/services/geocoding";
import { UniversalAvatar } from "@/components/app/Avatar";

export default function ProfilePage() {
  const { data: session, isPending, error } = authClient.useSession();
  const [area, setArea] = useState<string>();
  const user = session?.user;

  useEffect(() => {
    if (!navigator.geolocation) {
      setArea("Location Disabled");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) =>
        setArea(await getAreaName(pos.coords.latitude, pos.coords.longitude)),
      () => setArea("Permission Denied"),
    );
  }, []);

  const infoItems = useMemo(
    () => [
      { label: "Full Name", value: user?.name, icon: UserIcon },
      { label: "Email", value: user?.email, icon: EnvelopeIcon },
      { label: "Area", value: area, icon: GlobeHemisphereEastIcon },
      {
        label: "Member Since",
        value: user?.createdAt
          ? new Date(user.createdAt).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })
          : "N/A",
        icon: CalendarIcon,
      },
    ],
    [user, area],
  );

  if (isPending)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-main/10 border-t-main rounded-full animate-spin" />
          <p className="text-[10px] uppercase text-black animate-pulse">
            LOADING
          </p>
        </div>
      </div>
    );

  if (error || !session?.user)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="bg-red-50 p-5 rounded-3xl w-fit shadow-inner">
          <ShieldCheckIcon size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-xs  uppercase st text-red-600">
            Access Denied
          </p>
        </div>
      </div>
    );

  return (
    <div className="mx-auto w-full space-y-5">
      <header className="mb-6 relative flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {user?.image ? (
            <img
              src={user.image}
              alt="profile"
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <UniversalAvatar name={user?.name || "Admin"} size={60} />
          )}
          <div>
            <h1 className="text-xl font-extrabold  text-black sm:text-3xl">
              Account
            </h1>
            <p className="text-xs font-medium text-black/70 sm:text-sm">
              account details
            </p>
          </div>
        </div>
      </header>
      <section className="bg-white border border-gray-200/60 rounded-2xl sm:rounded-3xl p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {infoItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-2xl bg-gray-100 shadow-inner flex items-center justify-center text-black/60">
                <item.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px]  uppercase st text-black/35 mb-0.5">
                  {item.label}
                </p>
                <p className=" text-black text-xs sm:text-sm truncate">
                  {item.value || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
