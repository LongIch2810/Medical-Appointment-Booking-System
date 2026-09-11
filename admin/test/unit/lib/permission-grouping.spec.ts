import { groupPermissions } from '@/lib/permission-grouping';

describe('groupPermissions', () => {
  it('classifies every known permission family and omits empty groups', () => {
    const groups = groupPermissions([
      { id: 1, name: 'doctor.appointments' },
      { id: 2, name: 'users.create' },
      { id: 3, name: 'roles.manage' },
      { id: 4, name: 'articles.publish' },
      { id: 5, name: 'settings.update' },
    ]);

    expect(Object.fromEntries(groups.map((group) => [group.name, group.permissions.map((item) => item.id)]))).toEqual({
      clinical: [1],
      users: [2],
      governance: [3],
      content: [4],
      other: [5],
    });
  });

  it('returns no groups for no permissions', () => {
    expect(groupPermissions([])).toEqual([]);
  });
});

