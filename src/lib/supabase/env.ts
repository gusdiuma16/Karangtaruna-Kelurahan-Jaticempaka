export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

const PLACEHOLDER_MARKERS = [
  'YOUR_PROJECT_REF',
  'YOUR_SUPABASE_ANON_KEY',
  'example.supabase.co',
];

export function isValidSupabasePublicEnv(
  url: string | undefined,
  anonKey: string | undefined,
): boolean {
  if (!url || !anonKey) {
    return false;
  }
  const trimmedUrl = url.trim();
  const trimmedKey = anonKey.trim();

  if (trimmedUrl.length < 12 || trimmedKey.length < 20) {
    return false;
  }

  for (const marker of PLACEHOLDER_MARKERS) {
    if (trimmedUrl.includes(marker) || trimmedKey.includes(marker)) {
      return false;
    }
  }

  try {
    const parsed = new URL(trimmedUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
