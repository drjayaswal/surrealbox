import { Author } from "@/app/types/home.type";
import { SealCheckIcon } from "@phosphor-icons/react";
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import { useMemo } from "react";

export function Avatar({ author, size = 30, gender }: { author: Author; size?: number; gender?: string }) {
  const userGender = (gender || author.gender)?.toLowerCase() || "other";
  const isVerified = author.role?.toLowerCase() === "admin" || author.emailVerified;

  const svg = useMemo(() => {
    const hairVariants = userGender === "female"
      ? [
        "variant13", "variant14", "variant15", "variant16",
        "variant17", "variant18", "variant19", "variant21", "variant23",
        "variant32", "variant33", "variant35",
        "variant40", "variant41", "variant42", "variant45", "variant46", "variant48"
      ]
      : [
        "variant04",
        "variant05",
        "variant06",
        "variant08",
        "variant12",
        "variant39",
        "variant43"
      ];

    const avatar = createAvatar(lorelei, {
      seed: author.name,
      beardProbability: 0,
      earrings: [],
      earringsColor: [],
      earringsProbability: 0,
      eyebrows: [
        "variant03"
      ],
      eyes: [
        "variant01", "variant02", "variant03", "variant04", "variant05",
        "variant07", "variant08", "variant09", "variant10", "variant11",
        "variant12", "variant13", "variant14", "variant15", "variant16",
        "variant17", "variant18", "variant19", "variant20", "variant21",
        "variant22", "variant23", "variant24", "variant06"
      ],
      frecklesProbability: gender == "male" ? 0 : 100,
      glassesProbability: isVerified ? 100 : 0,
      glasses: [
        "variant02"
      ],
      hair: hairVariants as any,
      hairAccessoriesColor: ["transparent"],
      hairAccessoriesProbability: 0,
      head: ["variant04"],
      mouth: [
        "happy01", "happy02", "happy03", "happy04", "happy05", "happy06",
        "happy07", "happy08", "happy09", "happy10", "happy11", "happy12",
        "happy13", "happy14", "happy15", "happy16", "happy17", "happy18"
      ],
    });

    return avatar.toDataUri();
  }, [author.username, author.name, userGender, isVerified]);

  return (
    <div className={`relative w-fit ${author.image || "scale-150"} shrink-0`}>
      <div
        className="rounded-full overflow-hidden flex items-center justify-center"
        style={{
          width: size,
          height: size,
        }}
      >
        <img
          src={author.image || svg}
          alt={author.name}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
