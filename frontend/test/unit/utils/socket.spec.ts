import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const listeners = new Map<string, (...args: unknown[]) => unknown>();
  const socket = {
    id: 'socket-1',
    connected: true,
    on: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      listeners.set(event, handler);
      return socket;
    }),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
  };
  return {
    listeners,
    socket,
    io: vi.fn(() => socket),
    toastError: vi.fn(),
    refresh: vi.fn(),
  };
});

vi.mock('socket.io-client', () => ({ io: mocks.io }));
vi.mock('react-toastify', () => ({ toast: { error: mocks.toastError } }));
vi.mock('@/configs/axios', () => ({
  default: { post: mocks.refresh },
  backendOrigin: 'http://backend.test',
}));

import {
  connectSocket,
  disconnectSocket,
  getSocket,
  safeEmit,
} from '@/utils/socket';

describe('patient websocket pending-event behavior', () => {
  beforeEach(() => {
    mocks.listeners.clear();
    mocks.socket.connected = true;
    mocks.socket.emit.mockClear();
    mocks.socket.connect.mockClear();
    mocks.socket.disconnect.mockClear();
    mocks.socket.removeAllListeners.mockClear();
    mocks.toastError.mockClear();
    mocks.refresh.mockReset();
    disconnectSocket();
    mocks.socket.disconnect.mockClear();
  });

  afterEach(() => disconnectSocket());

  it('connects once and emits an event envelope with a stable id', () => {
    expect(connectSocket()).toBe(mocks.socket);
    expect(connectSocket()).toBe(mocks.socket);
    expect(mocks.io).toHaveBeenCalledWith('http://backend.test', {
      transports: ['websocket'],
      withCredentials: true,
    });

    const id = safeEmit('join-channel', { channelId: 3 });
    expect(mocks.socket.emit).toHaveBeenCalledWith(
      'join-channel',
      expect.objectContaining({ id, data: { channelId: 3 }, isSuccess: false }),
    );
    expect(getSocket()).toBe(mocks.socket);
  });

  it('drops a rate-limited pending event, shows retry time, and keeps the socket connected', async () => {
    connectSocket();
    const id = safeEmit('send-message', { message: 'hello' });

    await mocks.listeners.get('ws-error')!({ code: 429, eventId: id, retryAfter: 15 });

    expect(mocks.toastError).toHaveBeenCalledWith(
      expect.stringContaining('15'),
      { toastId: 'websocket-rate-limit' },
    );
    expect(mocks.socket.disconnect).not.toHaveBeenCalled();
  });

  it('refreshes once on unauthorized errors and reconnects the active socket', async () => {
    mocks.refresh.mockResolvedValue({});
    connectSocket();

    await mocks.listeners.get('ws-error')!({ code: 401 });

    expect(mocks.refresh).toHaveBeenCalledWith('/auth/refresh', {});
    expect(mocks.socket.disconnect).toHaveBeenCalledOnce();
    expect(mocks.socket.connect).toHaveBeenCalledOnce();
  });
});
