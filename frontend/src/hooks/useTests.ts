import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useTests() {
  return useQuery({
    queryKey: ["tests"],
    queryFn: () => api.tests.list(),
  });
}

export function useTest(id?: string) {
  return useQuery({
    queryKey: ["test", id],
    queryFn: () => api.tests.get(id!),
    enabled: !!id,
  });
}

export function useTestResults(testId?: string) {
  return useQuery({
    queryKey: ["testResults", testId],
    queryFn: () => api.testResults.list(testId),
  });
}

export function useSubmitTestResult(testId?: string) {
  return useMutation({
    mutationFn: (answers: { questionId: string; optionId: string }[]) =>
      api.tests.submitResult(testId!, { answers }),
  });
}
