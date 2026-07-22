import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["userMe"],
    queryFn: () => api.users.me(),
  });
}
