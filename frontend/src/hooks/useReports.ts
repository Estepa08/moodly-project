import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { components } from "../lib/api-types";

type Report = components["schemas"]["Report"];

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: () => api.reports.list(),
    staleTime: 30_000,
    refetchInterval: (query) => {
      const data = query.state.data as Report[] | undefined;
      if (!data || data.some((r) => r.status === "pending")) return 3000;
      return false;
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: { format: "pdf" | "csv"; periodFrom: string; periodTo: string }) =>
      api.reports.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(t("reports.created"));
    },
  });
}
