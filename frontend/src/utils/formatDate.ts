export const formatDate = (
  date: Date | null | undefined,
  weekdayLocale: string = "en-US",
  isHasWeekday: boolean = true
): string => {
  if (date === null || date === undefined) return "";
  const weekday = new Intl.DateTimeFormat(weekdayLocale, {
    weekday: "long",
  }).format(date);

  const dateFormat = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(date)
    .replace(/\//g, "-");

  return isHasWeekday ? `${weekday},${dateFormat}` : dateFormat;
};

export const getWeekday = (date: Date): string => {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(date);

  return weekday;
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
