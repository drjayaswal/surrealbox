"use client";

import { useState } from "react";
import {
  DeviceMobileSpeakerIcon,
  GlobeSimpleIcon,
  MonitorIcon,
  AppleLogoIcon,
  WindowsLogoIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { UniversalAvatar } from "@/components/app/Avatar";
import { Session } from "@/app/types/app.type";

export function SessionTable({ sessions }: { sessions: Session[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getOSIcon = (os: string) => {
    const lowerOS = os.toLowerCase();
    if (lowerOS.includes("mac") || lowerOS.includes("ios"))
      return <AppleLogoIcon size={18} weight="fill" />;
    if (lowerOS.includes("win"))
      return <WindowsLogoIcon size={18} weight="fill" />;
    return <MonitorIcon size={18} />;
  };

  return (
    <div className="overflow-x-auto bg-white border-2 border-gray-100 rounded-3xl">
      <table className="w-full text-left border-collapse min-w-175">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="px-6 py-4 text-[11px]  uppercase st text-black/50">
              User
            </th>
            <th className="px-6 py-4 text-[11px]  uppercase st text-black/50">
              System / Browser
            </th>
            <th className="px-6 py-4 text-[11px]  uppercase st text-black/50">
              IP Address
            </th>
            <th className="px-6 py-4 text-[11px]  uppercase st text-black/50 text-right">
              Expires
            </th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => (
            <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <UniversalAvatar
                    name={s.userName || s.userEmail?.split("@")[0] || "Guest"}
                    size={40}
                  />
                  <div className="min-w-0">
                    <div className=" text-gray-900 truncate">
                      {s.userName || s.userEmail?.split("@")[0] || "Guest"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {s.userEmail}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div
                  onClick={() => {
                    copyToClipboard(s.userAgent || "", `${s.id}-ua`);
                    toast.success("Copied to clipboard!");
                  }}
                  className="flex flex-col gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <span className="text-amber-500">
                      {getOSIcon(s.parsedDetails?.os || "")}
                    </span>
                    <span>{s.parsedDetails?.os || "Unknown OS"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <DeviceMobileSpeakerIcon
                      size={14}
                      className="text-gray-400"
                    />
                    <span className="truncate max-w-[37.5">
                      {s.parsedDetails?.browser || "Unknown Browser"}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div
                  onClick={() => {
                    copyToClipboard(s.ipAddress || "", `${s.id}-ip`);
                    toast.success("Copied to clipboard!");
                  }}
                  className="flex items-center cursor-pointer gap-2 text-sm font-mono text-gray-600"
                >
                  <GlobeSimpleIcon
                    size={18}
                    className="text-gray-400 shrink-0 max-w-xl"
                  />
                  <span>
                    {s.ipAddress?.slice(0, 12).concat("...") || "0.0.0.0"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="text-sm font-medium text-gray-600">
                  {new Date(s.expiresAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="text-[10px] text-gray-400 uppercase">
                  {new Date(s.expiresAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
