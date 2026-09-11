import { ConflictException, NotFoundException } from '@nestjs/common';
import { CoachProfileService } from 'src/modules/coach-profile/coach-profile.service';

describe('CoachProfileService', () => {
  let repository: any;
  let users: any;
  let cache: any;
  let service: CoachProfileService;

  const profile = {
    id: 1,
    display_name: 'My coach',
    health_goal: 'Sleep better',
    preferences: ['walking'],
    age: 30,
    height: 170,
    weight: 65,
  };

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn((value) => ({ ...profile, ...value })),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    users = { isUserExists: jest.fn() };
    cache = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
    };
    service = new CoachProfileService(repository, users, cache);
  });

  it('validates user existence and profile uniqueness before create', async () => {
    users.isUserExists.mockResolvedValueOnce(false);
    await expect(service.create(7, profile as never)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    users.isUserExists.mockResolvedValueOnce(true);
    repository.findOne.mockResolvedValueOnce(profile);
    await expect(service.create(7, profile as never)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('creates a profile and invalidates its user cache', async () => {
    users.isUserExists.mockResolvedValue(true);
    repository.findOne.mockResolvedValue(null);
    await expect(service.create(7, profile as never)).resolves.toMatchObject(
      profile,
    );
    expect(repository.create).toHaveBeenCalledWith({
      ...profile,
      user: { id: 7 },
    });
    expect(cache.delData).toHaveBeenCalledWith('coachProfile:user:7');
  });

  it('updates an existing profile and invalidates cache', async () => {
    repository.findOne.mockResolvedValue({ ...profile });
    await expect(
      service.update(7, { health_goal: 'Run 5K' }),
    ).resolves.toMatchObject({
      health_goal: 'Run 5K',
    });
    expect(cache.delData).toHaveBeenCalledWith('coachProfile:user:7');
  });

  it('rejects an update when no profile exists', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.update(7, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns a cached profile without querying PostgreSQL', async () => {
    cache.getData.mockResolvedValue(profile);
    await expect(service.getByUserId(7)).resolves.toBe(profile);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('caches a database profile for one hour and rejects missing profiles', async () => {
    cache.getData.mockResolvedValue(null);
    repository.findOne.mockResolvedValueOnce(profile);
    await expect(service.getByUserId(7)).resolves.toMatchObject(profile);
    expect(cache.setData).toHaveBeenCalledWith(
      'coachProfile:user:7',
      expect.objectContaining({ id: 1 }),
      3600,
    );

    repository.findOne.mockResolvedValueOnce(null);
    await expect(service.getByUserId(8)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
