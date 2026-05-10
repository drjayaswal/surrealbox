import { AddressSuggestion } from "../types/app.type";

export async function getAreaName(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(`/api/geocoding?lat=${lat}&lon=${lon}&type=full`);
    if (!response.ok) throw new Error("404 or Proxy Error");
    const data = await response.json();
    return data.area;
  } catch {
    return "Jaipur";
  }
}
export async function getCoordinatesFromAddress(
  address: string,
): Promise<{ lat: number; lon: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `/api/geocoding?address=${encodedAddress}&type=coords`,
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.lat || !data.lon) return null;
    return { lat: parseFloat(data.lat), lon: parseFloat(data.lon) };
  } catch {
    return null;
  }
}
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
