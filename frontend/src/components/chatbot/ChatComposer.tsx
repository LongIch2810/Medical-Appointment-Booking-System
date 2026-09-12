import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Loading from "@/components/loading/Loading";

const MAX_TEXTAREA_HEIGHT_PX = 150;

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isPending: boolean;
}

export default function ChatComposer({
  value,
  onChange,
  onSend,
  isPending,
}: ChatComposerProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="shrink-0 mx-auto w-full max-w-[900px] px-3 sm:px-4 pb-3 sm:pb-4 pt-1">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 dark:border-[#293548] bg-white dark:bg-[#172033] px-3 py-2 shadow-xs focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition-colors">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          rows={1}
          className="flex-1 resize-none border-0 shadow-none min-h-9 py-1.5 focus-visible:ring-0 dark:bg-transparent bg-transparent"
          placeholder={
            isPending
              ? t("chatbot.inputThinkingPlaceholder")
              : t("chatbot.inputPlaceholder")
          }
        />
        <Button
          type="button"
          disabled={isPending || !value.trim()}
          onClick={onSend}
          aria-label={t("chatbot.sendBtn")}
          size="icon"
          className="rounded-full w-9 h-9 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer active:scale-95 transition-transform"
        >
          {isPending ? <Loading size={10} /> : <ArrowUp className="w-4 h-4" />}
        </Button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-[#64748B]">
        {t("chatbot.composerFootnote")}
      </p>
    </div>
  );
}
