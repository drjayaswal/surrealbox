import React, { useMemo } from 'react';
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  gender?: 'male' | 'female' | 'other';
  size?: number;
  className?: string;
  isConfused?: boolean;
}

export const UniversalAvatar = ({ 
  name, 
  gender = 'male', 
  size = 64,
  className,
  isConfused = false
}: AvatarProps) => {
  const baseUrl = "https://api.dicebear.com/9.x/lorelei/svg";

  const dynamicSeed = useMemo(() => {
    const hourlySalt = new Date().getHours();
    return encodeURIComponent(`${name}-${hourlySalt}`);
  }, [name]);

  const getGenderOptions = () => {
    if (gender === 'male') {
      return "&beardProbability=100&hair=variant01,variant02,variant03,variant04,variant05,variant06,variant07,variant08,variant09";
    }
    return "&beardProbability=0&hair=variant13,variant14,variant15,variant16,variant17,variant18,variant19,variant20,variant21";
  };
  // const colors = "16a34a,7c3aed,dc2626,2563eb,ea580c,0891b2,4f46e5,d946ef";
  const colors = "ffffff";

  const avatarUrl = `${baseUrl}?seed=${dynamicSeed}${getGenderOptions()}${isConfused ? "&mood=confused" : ""}&backgroundType=solid&backgroundColor=${colors}&size=${size}`;

  return (
    <div 
      className={cn(
        "relative shrink-0 overflow-visible transition-all duration-300",
        className
      )}
      style={{ width: size, height: size }}
    >
      <img 
        src={avatarUrl} 
        alt={name} 
        className={cn(
          "w-full h-full object-contain rounded-full", 
          isConfused && "animate-pulse brightness-95"
        )}
      />
    </div>
  );
};