import i18n from "@/i18n";

export const formatDate = (
  date: Date | null | undefined,
  weekdayLocale?: string,
  isHasWeekday: boolean = true
): string => {
  if (date === null || date === undefined) return "";
  const currentLang = i18n.language || "vi";
  const activeLocale = weekdayLocale || (currentLang === "en" ? "en-US" : "vi-VN");
  const weekday = new Intl.DateTimeFormat(activeLocale, {
    weekday: "long",
  }).format(date);

  const dateFormat = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replace(/\//g, "-");

  return isHasWeekday ? `${weekday}, ${dateFormat}` : dateFormat;
};

export const getWeekday = (date: Date, locale?: string): string => {
  const currentLang = i18n.language || "vi";
  const activeLocale = locale || (currentLang === "en" ? "en-US" : "vi-VN");
  const weekday = new Intl.DateTimeFormat(activeLocale, {
    weekday: "long",
  }).format(date);

  return weekday;
};

const WEEKDAY_KEYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const getWeekdayKey = (date: Date): (typeof WEEKDAY_KEYS)[number] => {
  return WEEKDAY_KEYS[date.getDay()];
};

export const checkSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const formatDateYYYYMMDD = (date: Date): string => {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  })
    .format(date)
    .replace(/-/g, "-");
};

export const getVietnamTimeHHmm = (date: Date): string => {
  return new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
};

export const toDate = (dateString: string) => {
  const [day, month, year] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};
