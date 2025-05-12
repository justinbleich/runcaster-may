import { useQuery } from "@tanstack/react-query";

export async function fetchFarcasterProfile(address: string, apiKey: string) {
  const res = await fetch(
    `https://api.neynar.com/v2/farcaster/user-by-address?address=${address}`,
    {
      headers: { 'api_key': apiKey }
    }
  );
  if (!res.ok) throw new Error('Failed to fetch Farcaster profile');
  const data = await res.json();
  return {
    name: data.result.user.display_name || data.result.user.username,
    avatarUrl: data.result.user.pfp_url
  };
}

export function useFarcasterProfile(address: string, apiKey: string) {
  return useQuery({
    queryKey: ["farcaster-profile", address],
    queryFn: () => fetchFarcasterProfile(address, apiKey),
    enabled: !!address && !!apiKey,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
} 