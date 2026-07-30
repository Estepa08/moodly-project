import { toast } from "sonner";
import CelebrationToast from "./CelebrationToast";

export function celebrate(title: string, description?: string) {
  toast.custom((_t) => <CelebrationToast title={title} description={description} />, {
    duration: 4000,
  });
}
