import { useQuery } from "@tanstack/react-query";

// Replace HUBBLE_API with Neynar API
// Requires NEYNAR_API_KEY in your environment
const NEYNAR_API = "https://api.neynar.com/v2/farcaster/user-by-address";

export interface FarcasterProfile {
  fid?: number;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
}

export async function fetchFarcasterProfile(address: string): Promise<FarcasterProfile | null> {
  if (!address) return null;
  try {
    const apiKey = import.meta.env.VITE_NEYNAR_API_KEY;
    if (!apiKey) throw new Error('Missing NEYNAR_API_KEY');
    const res = await fetch(`${NEYNAR_API}?address=${address}`, {
      headers: { 'x-api-key': apiKey }
    });
    if (!res.ok) throw new Error('Neynar fetch failed');
    const data = await res.json();
    console.log('Neynar raw response:', data);
    const user = data.result?.user;
    if (!user) throw new Error('No user found');
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.pfp_url,
      bio: user.profile?.bio?.text,
      location: user.profile?.location?.description,
    };
  } catch (e) {
    console.warn('Farcaster profile fetch failed:', e);
    // Fallback: return minimal profile with address as displayName
    return { displayName: address };
  }
}

export function useFarcasterProfile(address: string) {
  return useQuery({
    queryKey: ["farcaster-profile", address],
    queryFn: () => fetchFarcasterProfile(address),
    enabled: !!address,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function truncateAddress(address: string) {
  if (!address) {
    console.warn('truncateAddress called with empty address');
    return '';
  }
  const truncated = address.slice(0, 4) + '…' + address.slice(-4);
  return truncated;
} 