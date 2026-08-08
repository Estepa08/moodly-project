import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSync } from "./useSync";

/**
 * Координатор синхронизации: на монтировании (авторизованное приложение)
 * запускает полный цикл syncNow и после завершения инвалидирует локальные
 * запросы, чтобы react-query перечитал свежие данные из IndexedDB.
 */
export default function SyncCoordinator() {
  const queryClient = useQueryClient();

  const { sync } = useSync({
    onSynced: () => {
      void queryClient.invalidateQueries({ queryKey: ["entries"] });
      void queryClient.invalidateQueries({ queryKey: ["creature"] });
      void queryClient.invalidateQueries({ queryKey: ["creature", "pets"] });
      void queryClient.invalidateQueries({ queryKey: ["testResults"] });
      void queryClient.invalidateQueries({ queryKey: ["myFeedback"] });
      void queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });

  useEffect(() => {
    // Первичный синк при входе в приложение (восстановление офлайн-очереди и дельт).
    void sync();
  }, [sync]);

  return null;
}
