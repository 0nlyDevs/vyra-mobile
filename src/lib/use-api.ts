import useSWR from "swr";

import { get } from "@/lib/api";

/** Lit une route de l'API (avec cache et « tirer pour actualiser »). */
export function useApi<T>(path: string | null) {
  return useSWR<T>(path, (key: string) => get<T>(key), { revalidateOnFocus: false });
}
