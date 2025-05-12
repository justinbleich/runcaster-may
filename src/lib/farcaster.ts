import { useQuery } from "@tanstack/react-query";

const HUBBLE_API = "https://hoyt.farcaster.xyz:2281";

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
    const res = await fetch(`${HUBBLE_API}/v1/userDataByAddress?address=${address}`);
    if (!res.ok) throw new Error('Hubble fetch failed');
    const data = await res.json();
    if (!data.result || !data.result.user) throw new Error('No user found');
    const user = data.result.user;
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.pfp,
      bio: user.bio,
      location: user.location?.description,
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
  console.log('Truncating address:', address);
  const truncated = address.slice(0, 4) + '…' + address.slice(-4);
  console.log('Truncated result:', truncated);
  return truncated;
} 