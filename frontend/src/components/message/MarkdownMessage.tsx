import ReactMarkdown from "react-markdown";

export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <div
      className="prose prose-slate dark:prose-invert max-w-none
        prose-headings:font-semibold prose-headings:text-[14px] sm:prose-headings:text-[15px]
        prose-headings:mt-4 prose-headings:mb-1.5 first:prose-headings:mt-0
        prose-p:leading-[1.65] prose-p:my-2
        prose-li:my-1 prose-li:leading-[1.65]
        prose-strong:font-semibold"
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
