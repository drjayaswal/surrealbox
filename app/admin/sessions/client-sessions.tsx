"use client";

import { EmptyIcon, UserGearIcon } from "@phosphor-icons/react";
import { SessionTable } from "@/components/app/SessionTable";
import { Session } from "@/app/types/app.type";
import { parseUserAgent } from "@/app/utils/app";

export function ClientSessions({ allSessions }: { allSessions: Session[] }) {
  const mappedSessions = allSessions.map((session) => ({
    ...session,
    parsedDetails: parseUserAgent(session.userAgent),
  }));

  return (
    <div className="mx-auto w-full">
      <header className="mb-6 relative flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <UserGearIcon size={40} weight="regular" className="text-amber-500" />
          <div>
            <h1 className="text-xl font-extrabold  text-black sm:text-3xl">
              Session Panel
            </h1>
            <p className="text-xs font-medium text-amber-600/70 sm:text-sm">
              system-wide session monitoring
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-fit h-9 px-2 pr-3 bg-gray-100 border-none outline-none shadow-inner flex items-center gap-2.5 transition-all duration-300 rounded-2xl">
          <div className="bg-white p-1.5 rounded-full relative shadow-sm">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-amber-500 opacity-75"></span>
            <div className="bg-amber-500 shadow-sm rounded-full p-1" />
          </div>
          <span className="text-[14px] text-amber-500 uppercase  st">
            {allSessions.length}
          </span>
        </div>
      </header>

      {mappedSessions.length > 0 ? (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <SessionTable sessions={mappedSessions} />
        </div>
      ) : (
        <div className="flex flex-col sm:py-70 py-52 items-center justify-center rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-white px-6 text-center">
          <div className="bg-gray-50 p-6 rounded-full mb-6">
            <EmptyIcon size={48} weight="regular" className="text-gray-300" />
          </div>
        </div>
      )}
    </div>
  );
}
