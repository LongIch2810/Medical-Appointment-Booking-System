import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/configs/axios', () => ({ default: axiosMock }));

import { createChannel, findChannelByParticipants, getChannelById } from '@/api/channelApi';
import { fetchDoctors, fetchOutstandingDoctors } from '@/api/doctorApi';

describe('patient API normalization', () => {
  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
  });

  it('normalizes legacy channel ids, message numbers and participant usernames', async () => {
    axiosMock.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          channel_id: '9',
          unread_count: '2',
          last_message: { content: null, created_at: null, sender_id: '4' },
          participants: [{ id: 1, fullname: 'Patient', username: null }],
        },
      },
    });
    const result = await createChannel([1, 2]);
    expect(axiosMock.post).toHaveBeenCalledWith('/channels/create', [1, 2]);
    expect(result.data).toMatchObject({
      id: 9,
      channel_id: 9,
      unread_count: 2,
      last_message: { content: '', created_at: '', sender_id: 4 },
      participants: [{ username: 'Patient' }],
    });
  });

  it('reuses channel creation for participant lookup and normalizes absent messages', async () => {
    axiosMock.post.mockResolvedValue({
      data: { success: true, data: { id: 3, participants: [] } },
    });
    const result = await findChannelByParticipants({ senderId: 5, receiverId: 7 });
    expect(axiosMock.post).toHaveBeenCalledWith('/channels/create', [5, 7]);
    expect(result.data.last_message).toBeNull();

    axiosMock.get.mockResolvedValue({
      data: { success: true, data: { id: 3, participants: [] } },
    });
    await getChannelById(3);
    expect(axiosMock.get).toHaveBeenCalledWith('/channels/3');
  });

  it('normalizes doctor fields from nested backend user/specialty objects', async () => {
    axiosMock.get.mockResolvedValue({
      data: {
        success: true,
        data: [{
          id: '2',
          user: { id: '8', fullname: 'Doctor A', address: 'HCM', phone: '0900' },
          specialty: { specialty_name: 'Cardiology' },
          experience: '12',
          avg_rating: '4.5',
          appointments_completed: '20',
          isOutstanding: 1,
        }],
      },
    });
    const result = await fetchOutstandingDoctors();
    expect(result.data[0]).toMatchObject({
      id: 2,
      user_id: 8,
      fullname: 'Doctor A',
      specialty: 'Cardiology',
      experience: 12,
      avg_rating: 4.5,
      isOutstanding: true,
    });
  });

  it('returns an empty doctor list for malformed list payloads', async () => {
    axiosMock.post.mockResolvedValue({
      data: { success: true, data: { doctors: null, total: 0 } },
    });
    const result = await fetchDoctors({ page: 1 } as never);
    expect(result.data.doctors).toEqual([]);
  });
});
