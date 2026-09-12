interface UserMessageProps {
  content: string;
}

export default function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      <div className="max-w-[70%] min-w-0 px-4 py-2.5 rounded-2xl rounded-br-sm break-words whitespace-pre-wrap text-sm md:text-base font-medium bg-primary/90 text-primary-foreground dark:bg-teal-500/20 dark:text-teal-100 dark:border dark:border-teal-500/30">
        {content}
      </div>
    </div>
  );
}
