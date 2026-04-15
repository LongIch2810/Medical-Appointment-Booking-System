export const extractImgUrl = (file: {
  mimetype: string;
  base64: string;
}): string => `data:${file.mimetype};base64,${file.base64}`;
