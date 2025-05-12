import { useQuery } from "@tanstack/react-query";

// Replace HUBBLE_API with Neynar API
// Requires NEYNAR_API_KEY in your environment
const NEYNAR_API_BY_ADDRESS = "https://api.neynar.com/v2/farcaster/user-by-address";
const NEYNAR_API_BULK = "https://api.neynar.com/v2/farcaster/user/bulk";

export interface FarcasterProfile {
  fid?: number;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
}

export async function fetchFarcasterProfileByFid(fid: number): Promise<FarcasterProfile | null> {
  if (!fid) return null;
  try {
    const apiKey = import.meta.env.VITE_NEYNAR_API_KEY;
    if (!apiKey) throw new Error('Missing NEYNAR_API_KEY');
    const res = await fetch(`${NEYNAR_API_BULK}?fids=${fid}`, {
      headers: { 'x-api-key': apiKey }
    });
    if (!res.ok) throw new Error('Neynar FID fetch failed');
    const data = await res.json();
    console.log('Neynar FID raw response:', data);
    const user = data.users?.[0];
    if (!user) throw new Error('No user found by FID');
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.pfp_url,
      bio: user.profile?.bio?.text,
      location: user.profile?.location?.description,
    };
  } catch (e) {
    console.warn('Farcaster profile FID fetch failed:', e);
    return null;
  }
}

export async function fetchFarcasterProfile(address: string, fid?: number): Promise<FarcasterProfile | null> {
  // Try FID first if available
  if (fid) {
    const byFid = await fetchFarcasterProfileByFid(fid);
    if (byFid && byFid.avatarUrl) return byFid;
  }
  // Fallback to address
  if (address) {
    try {
      const apiKey = import.meta.env.VITE_NEYNAR_API_KEY;
      if (!apiKey) throw new Error('Missing NEYNAR_API_KEY');
      const res = await fetch(`${NEYNAR_API_BY_ADDRESS}?address=${address}`, {
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
    }
  }
  // Fallback to sdk.context.user if available (Warpcast)
  if (typeof window !== 'undefined' && (window as any).sdk?.context?.user) {
    const user = (window as any).sdk.context.user;
    console.log('Using sdk.context.user as fallback:', user);
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.pfp,
      bio: user.bio,
      location: user.location?.description,
    };
  }
  return null;
}

export function useFarcasterProfile(address: string, fid?: number) {
  return useQuery({
    queryKey: ["farcaster-profile", address, fid],
    queryFn: () => fetchFarcasterProfile(address, fid),
    enabled: !!address || !!fid,
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