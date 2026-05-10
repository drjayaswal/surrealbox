import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LockKeyIcon, ShieldWarningIcon, TrophyIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ReputationRestrictionModalProps {
  open: boolean;
  onClose: () => void;
  currentReputation: number;
  requiredReputation: number;
}

export function ReputationRestrictionModal({
  open,
  onClose,
  currentReputation,
  requiredReputation,
}: ReputationRestrictionModalProps) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
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
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-black tracking-tight">Not enough reputation</h2>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 rounded-full border border-red-100">
                    <LockKeyIcon size={12} className="text-red-600" weight="fill" />
                    <span className="text-[10px] font-black text-red-700">{currentReputation} / {requiredReputation}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    To maintain high-quality discussions, you need at least <span className="font-bold text-black">{requiredReputation} reputation</span> to ask a question.
                  </p>
                </div>

                <div className="mb-6 overflow-hidden border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Activity</th>
                        <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-2.5 text-[11px] font-medium text-gray-600">Accepted Answer</td>
                        <td className="px-4 py-2.5 text-[11px] font-black text-green-600 text-right">+15</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-[11px] font-medium text-gray-600">Answer Upvoted</td>
                        <td className="px-4 py-2.5 text-[11px] font-black text-green-600 text-right">+10</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-[11px] font-medium text-gray-600">Question Upvoted</td>
                        <td className="px-4 py-2.5 text-[11px] font-black text-green-600 text-right">+5</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button 
                    variant="custom" 
                    onClick={onClose}
                  >
                    <span>Earn reputation</span>
                    <ArrowRightIcon size={14} weight="bold" />
                  </Button>
                  <Button 
                    variant="light" 
                    onClick={onClose}
                  >
                    Maybe later
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
