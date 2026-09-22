import { useEffect, useRef, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUp, CornerDownLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Loading from "@/components/loading/Loading";

const MAX_TEXTAREA_HEIGHT_PX = 160;

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isPending: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

export default function ChatComposer({
  value,
  onChange,
  onSend,
  isPending,
  textareaRef: forwardedTextareaRef,
}: ChatComposerProps) {
  const { t } = useTranslation();
  const localTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = forwardedTextareaRef ?? localTextareaRef;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }, [value, textareaRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!isPending && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <footer className="shrink-0 border-t border-border/80 bg-background/95 px-3 py-2.5 backdrop-blur-md sm:px-5 sm:py-3">
      <div className="mx-auto w-full max-w-4xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isPending && value.trim()) onSend();
          }}
          className="flex items-end gap-2 rounded-2xl border border-input bg-card p-1.5 shadow-2xs transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 dark:bg-card"
        >
          <Textarea
            ref={textareaRef}
            aria-label="Nhập câu hỏi hoặc yêu cầu"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            rows={1}
            className="min-h-11 flex-1 resize-none border-0 bg-transparent py-2.5 px-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0 sm:text-[15px]"
            placeholder={
              isPending
                ? t("chatbot.inputThinkingPlaceholder")
                : t("chatbot.inputPlaceholder")
            }
          />
          <Button
            type="submit"
            disabled={isPending || !value.trim()}
            aria-label={t("chatbot.sendBtn")}
            size="icon"
            className="size-11 shrink-0 rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {isPending ? (
              <Loading size={16} />
            ) : (
              <ArrowUp className="size-5" aria-hidden="true" />
            )}
          </Button>
        </form>
        <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <p className="hidden sm:inline-flex items-center gap-1">
            <CornerDownLeft className="size-3 text-muted-foreground/70" />
            <span>Enter để gửi, Shift+Enter xuống dòng</span>
          </p>
          <p className="w-full text-center sm:w-auto sm:text-right">
            {t("chatbot.composerFootnote")}
          </p>
        </div>
      </div>
    </footer>
  );
}

