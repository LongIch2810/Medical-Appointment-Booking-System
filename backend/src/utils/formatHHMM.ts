export const formatHHMM = (time: string) => {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};
