import { useTranslation } from "react-i18next";
import { Sparkles, HeartPulse, Stethoscope, CalendarClock, Info } from "lucide-react";

interface WelcomeStateProps {
  onQuickAction: (promptText: string) => void;
}

export default function WelcomeState({ onQuickAction }: WelcomeStateProps) {
  const { t } = useTranslation();

  const quickActions = [
    {
      icon: HeartPulse,
      title: t("chatbot.quickActionConsultTitle"),
      description: t("chatbot.quickActionConsultDesc"),
      prompt: t("chatbot.prompt1"),
    },
    {
      icon: Stethoscope,
      title: t("chatbot.quickActionFindDoctorTitle"),
      description: t("chatbot.quickActionFindDoctorDesc"),
      prompt: t("chatbot.quickActionFindDoctorPrompt"),
    },
    {
      icon: CalendarClock,
      title: t("chatbot.quickActionBookingTitle"),
      description: t("chatbot.quickActionBookingDesc"),
      prompt: t("chatbot.quickActionBookingPrompt"),
    },
    {
      icon: Info,
      title: t("chatbot.quickActionInfoTitle"),
      description: t("chatbot.quickActionInfoDesc"),
      prompt: t("chatbot.quickActionInfoPrompt"),
    },
  ];

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col items-center justify-center gap-6 px-3 py-6 animate-in fade-in-0 duration-200">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="w-5 h-5" />
        </span>
        <div className="space-y-1">
          <h2 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-[#F1F5F9]">
            {t("chatbot.welcomeHeading")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] max-w-md">
            {t("chatbot.welcomeSubtitle")}
          </p>
        </div>
      </div>

      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickActions.map(({ icon: Icon, title, description, prompt }) => (
          <button
            key={title}
            type="button"
            onClick={() => onQuickAction(prompt)}
            className="flex items-start gap-3 text-left px-4 py-3.5 rounded-2xl border border-slate-200/80 dark:border-[#293548] bg-white/60 dark:bg-[#172033]/60 hover:bg-white dark:hover:bg-[#172033] hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
          >
            <Icon className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800 dark:text-[#F1F5F9]">
                {title}
              </span>
              <span className="block text-xs text-slate-500 dark:text-[#94A3B8]">
                {description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
