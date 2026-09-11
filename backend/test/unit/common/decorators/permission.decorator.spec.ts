import 'reflect-metadata';
import { Permissions } from 'src/common/decorators/permission.decorator';
import { PERMISSIONS_KEY } from 'src/utils/constants';

describe('Permissions decorator', () => {
  it('stores the given permission strings under PERMISSIONS_KEY on the handler', () => {
    class SampleController {
      @Permissions('appointment:create')
      create() {
        return undefined;
      }
    }

    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, SampleController.prototype.create),
    ).toEqual(['appointment:create']);
  });

  it('supports multiple permissions on a single handler', () => {
    class SampleController {
      @Permissions('appointment:update', 'appointment:approve')
      update() {
        return undefined;
      }
    }

    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, SampleController.prototype.update),
    ).toEqual(['appointment:update', 'appointment:approve']);
  });

  it('sets an empty array when called with no permissions', () => {
    class SampleController {
      @Permissions()
      list() {
        return undefined;
      }
    }

    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, SampleController.prototype.list),
    ).toEqual([]);
  });

  it('can be applied at the class level, storing metadata on the class', () => {
    @Permissions('admin:access')
    class SampleController {}

    expect(Reflect.getMetadata(PERMISSIONS_KEY, SampleController)).toEqual([
      'admin:access',
    ]);
  });

  it('keeps distinct metadata per handler on the same class', () => {
    class SampleController {
      @Permissions('appointment:create')
      create() {
        return undefined;
      }

      @Permissions('appointment:delete')
      remove() {
        return undefined;
      }
    }

    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, SampleController.prototype.create),
    ).toEqual(['appointment:create']);
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, SampleController.prototype.remove),
    ).toEqual(['appointment:delete']);
  });

  it('does not set metadata on handlers that are not decorated', () => {
    class SampleController {
      @Permissions('appointment:create')
      create() {
        return undefined;
      }

      untouched() {
        return undefined;
      }
    }

    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        SampleController.prototype.untouched,
      ),
    ).toBeUndefined();
  });

  it('exposes the metadata key used by SetMetadata for Reflector-based lookups', () => {
    expect((Permissions('appointment:create') as any).KEY).toBe(
      PERMISSIONS_KEY,
    );
  });
});
