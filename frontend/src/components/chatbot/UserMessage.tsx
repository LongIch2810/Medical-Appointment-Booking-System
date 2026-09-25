interface UserMessageProps {
  content: string;
  createdAt?: string;
}

const messageTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${messageTimeFormatter.format(date)} · ${day}/${month}`;
}

export default function UserMessage({ content, createdAt }: UserMessageProps) {
  const timeString = formatTime(createdAt);

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="max-w-[85%] min-w-0 rounded-2xl rounded-tr-xs border border-primary/20 bg-primary px-4 py-2.5 text-sm font-medium leading-relaxed text-primary-foreground shadow-2xs sm:max-w-[75%] sm:text-[15px]"
        style={{ wordBreak: "break-word" }}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
      {timeString && (
        <span className="pr-1 text-[10px] text-muted-foreground">{timeString}</span>
      )}
    </div>
  );
}

