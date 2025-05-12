import { useQuery } from "@tanstack/react-query";

const HUBBLE_API = "https://hoyt.farcaster.xyz:2281";

export async function fetchFarcasterProfile(address: string) {
  if (!address) return null;
  // Hubble API: /v1/userDataByAddress?address=0x...
  const res = await fetch(`${HUBBLE_API}/v1/userDataByAddress?address=${address}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.result || !data.result.user) return null;
  const user = data.result.user;
  return {
    fid: user.fid,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.pfp,
    bio: user.bio,
    location: user.location?.description,
  };
}

export function useFarcasterProfile(address: string) {
  return useQuery({
    queryKey: ["farcaster-profile", address],
    queryFn: () => fetchFarcasterProfile(address),
    enabled: !!address,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
} 