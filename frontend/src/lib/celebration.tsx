import { toast } from "sonner";
import CelebrationToast from "../components/CelebrationToast";

export function celebrate(title: string, description?: string) {
  toast.custom(
    (t) => <CelebrationToast title={title} description={description} />,
    { duration: 4000 },
  );
}
