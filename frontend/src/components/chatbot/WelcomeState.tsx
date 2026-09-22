import { useTranslation } from "react-i18next";
import { Sparkles, HeartPulse, Stethoscope, CalendarClock, Info, ChevronRight } from "lucide-react";

interface WelcomeStateProps {
  onQuickAction: (promptText: string) => void;
}

export default function WelcomeState({ onQuickAction }: WelcomeStateProps) {
  const { t } = useTranslation();

  const quickActions = [
    {
      id: "consult",
      icon: HeartPulse,
      title: t("chatbot.quickActionConsultTitle"),
      description: t("chatbot.quickActionConsultDesc"),
      prompt: t("chatbot.prompt1"),
      badge: "Sức khỏe",
      iconWrapperClass: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-900/40",
      accentBorder: "hover:border-rose-300 dark:hover:border-rose-800/60",
    },
    {
      id: "doctor",
      icon: Stethoscope,
      title: t("chatbot.quickActionFindDoctorTitle"),
      description: t("chatbot.quickActionFindDoctorDesc"),
      prompt: t("chatbot.quickActionFindDoctorPrompt"),
      badge: "Chuyên khoa",
      iconWrapperClass: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200/50 dark:border-teal-900/40",
      accentBorder: "hover:border-teal-300 dark:hover:border-teal-800/60",
    },
    {
      id: "booking",
      icon: CalendarClock,
      title: t("chatbot.quickActionBookingTitle"),
      description: t("chatbot.quickActionBookingDesc"),
      prompt: t("chatbot.quickActionBookingPrompt"),
      badge: "Đặt khám",
      iconWrapperClass: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/50 dark:border-sky-900/40",
      accentBorder: "hover:border-sky-300 dark:hover:border-sky-800/60",
    },
    {
      id: "info",
      icon: Info,
      title: t("chatbot.quickActionInfoTitle"),
      description: t("chatbot.quickActionInfoDesc"),
      prompt: t("chatbot.quickActionInfoPrompt"),
      badge: "Hệ thống",
      iconWrapperClass: "bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60",
      accentBorder: "hover:border-slate-300 dark:hover:border-slate-700",
    },
  ];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-3 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
          <Sparkles className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-heading text-lg font-bold text-foreground sm:text-2xl">
          {t("chatbot.welcomeHeading")}
        </h2>
        <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {t("chatbot.welcomeSubtitle")}
        </p>
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
        {quickActions.map(
          ({ id, icon: Icon, title, description, prompt, badge, iconWrapperClass, accentBorder }) => (
            <button
              key={id}
              type="button"
              onClick={() => onQuickAction(prompt)}
              className={`group flex min-h-[4.5rem] items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-muted/50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${accentBorder}`}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${iconWrapperClass}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="block truncate text-sm font-bold text-foreground">
                    {title}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground/80">
                    · {badge}
                  </span>
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {description}
                </p>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground"
                aria-hidden="true"
              />
            </button>
          ),
        )}
      </div>
    </div>
  );
}

