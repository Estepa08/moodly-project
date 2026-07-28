import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PhoneCall } from "lucide-react";
import CrisisDialog from "./CrisisDialog";

export default function CrisisFloatingButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <CrisisDialog open={open} severity="urgent" onDismiss={() => setOpen(false)} />
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-accent text-white shadow-neumorphic flex items-center justify-center cursor-pointer hover:opacity-90 transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t("crisis.floatingButton")}
      >
        <PhoneCall className="w-5 h-5" />
      </button>
    </>
  );
}
