export const extractTokenFromCookie = (client: any): string | null => {
  try {
    const cookies = client?.handshake?.headers?.cookie;
    if (!cookies) return null;
    const cookieArray = cookies.split('; ');
    const cookieMap = cookieArray.reduce((acc: any, cookie: string) => {
      const [key, value] = cookie.split('=');
      if (key && value) acc[key.trim()] = decodeURIComponent(value);
      return acc;
    }, {});
    return cookieMap['accessToken'] || null;
  } catch {
    return null;
  }
};
