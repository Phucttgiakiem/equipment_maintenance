import { AlertCircleIcon, InfoCircleIcon } from "@/components/ui/icons";

const TONE_CLASSES = {
  danger: "bg-[#F9DBD7] text-[#9B1C12] dark:bg-[#452220] dark:text-[#FF9F94]",
  info: "bg-[#DCE8F7] text-[#1F4A8A] dark:bg-[#1E3350] dark:text-[#9CC3F5]",
};

export function Alert({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "info";
  children: React.ReactNode;
}) {
  const ToneIcon = tone === "danger" ? AlertCircleIcon : InfoCircleIcon;
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm leading-5 ${TONE_CLASSES[tone]}`}
    >
      <ToneIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}
