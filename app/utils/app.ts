import { AddressSuggestion } from "../types/app.type";

export async function searchAddressSuggestions(
  query: string,
): Promise<AddressSuggestion[]> {
  try {
    const encodedAddress = encodeURIComponent(query);
    const response = await fetch(
      `/api/geocoding?address=${encodedAddress}&type=suggestions`,
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results ?? []).map((item: any) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}

export const parseUserAgent = (uaString: string | null) => {
  if (!uaString)
    return { browser: "Unknown", os: "Unknown", platform: "Unknown" };

  try {
    const regex =
      /^(?<mozilla>[^ ]+)\s\((?<platform>[^;]+);\s(?<os>[^)]+)\)\s(?<engine>[^\s]+)\s\((?<engineType>[^)]+)\)\s(?<browser>[^\s]+)\s(?<safariVersion>[^\s]+)$/;

    const match = uaString.match(regex);

    if (match && match.groups) {
      return {
        browser: match.groups.browser || "Unknown",
        os: match.groups.os || "Unknown",
        platform: match.groups.platform || "Unknown",
      };
    }
  } catch (e) {
    return { browser: "Generic", os: "Generic", platform: "Generic" };
  }

  return { browser: "Other", os: "Other", platform: "Other" };
};
