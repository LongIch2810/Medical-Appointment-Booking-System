interface UserMessageProps {
  content: string;
}

export default function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] min-w-0 rounded-2xl rounded-tr-xs border border-primary/20 bg-primary px-4 py-2.5 text-sm font-medium leading-relaxed text-primary-foreground shadow-2xs sm:max-w-[75%] sm:text-[15px]"
        style={{ wordBreak: "break-word" }}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

