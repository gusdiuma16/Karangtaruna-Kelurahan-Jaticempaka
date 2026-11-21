import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isValidSupabasePublicEnv } from './env.ts';

let cachedClient: SupabaseClient | null = null;

export function getSupabasePublicConfig(): {
  configured: boolean;
  url: string | undefined;
  anonKey: string | undefined;
} {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return {
    configured: isValidSupabasePublicEnv(url, anonKey),
    url: url?.trim(),
    anonKey: anonKey?.trim(),
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig().configured;
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig();
  if (!config.configured || !config.url || !config.anonKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return cachedClient;
}
