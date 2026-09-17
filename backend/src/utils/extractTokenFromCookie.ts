import { getSocketAuthCookie } from './authContext';

export const extractTokenFromCookie = (client: any): string | null => {
  return getSocketAuthCookie(client, 'access');
};
