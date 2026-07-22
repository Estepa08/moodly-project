import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: () => api.reports.list(),
    staleTime: 30_000,
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
