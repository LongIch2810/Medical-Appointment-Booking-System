const MAX_AI_FILE_NAME_LENGTH = 150;

export function sanitizeAiDocumentFileName(
  value: string | undefined,
  fallback: string,
) {
  const normalized = (value || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/gi, 'd')
    .replace(/(?:\.[a-z0-9]+)+$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, MAX_AI_FILE_NAME_LENGTH)
    .replace(/-+$/g, '');

  return `${normalized || 'ai-document'}.pdf`;
}
