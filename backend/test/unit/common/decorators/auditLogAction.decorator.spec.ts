import 'reflect-metadata';
import { AuditLogAction } from 'src/common/decorators/auditLogAction.decorator';
import { AUDIT_LOG_KEY } from 'src/utils/constants';

describe('AuditLogAction decorator', () => {
  it('stores the action/entityName metadata under AUDIT_LOG_KEY on the handler', () => {
    class SampleController {
      @AuditLogAction({ action: 'CREATE', entityName: 'Appointment' })
      create() {
        return undefined;
      }
    }

    const metadata = Reflect.getMetadata(
      AUDIT_LOG_KEY,
      SampleController.prototype.create,
    );

    expect(metadata).toEqual({ action: 'CREATE', entityName: 'Appointment' });
  });

  it('keeps distinct metadata per handler on the same class', () => {
    class SampleController {
      @AuditLogAction({ action: 'CREATE', entityName: 'Appointment' })
      create() {
        return undefined;
      }

      @AuditLogAction({ action: 'DELETE', entityName: 'Appointment' })
      remove() {
        return undefined;
      }
    }

    expect(
      Reflect.getMetadata(AUDIT_LOG_KEY, SampleController.prototype.create),
    ).toEqual({ action: 'CREATE', entityName: 'Appointment' });
    expect(
      Reflect.getMetadata(AUDIT_LOG_KEY, SampleController.prototype.remove),
    ).toEqual({ action: 'DELETE', entityName: 'Appointment' });
  });

  it('does not set metadata on handlers that are not decorated', () => {
    class SampleController {
      @AuditLogAction({ action: 'READ', entityName: 'Appointment' })
      list() {
        return undefined;
      }

      untouched() {
        return undefined;
      }
    }

    expect(
      Reflect.getMetadata(AUDIT_LOG_KEY, SampleController.prototype.untouched),
    ).toBeUndefined();
  });

  it('exposes the metadata key used by SetMetadata for Reflector-based lookups', () => {
    expect(
      (AuditLogAction({ action: 'LOGIN', entityName: 'User' }) as any).KEY,
    ).toBe(AUDIT_LOG_KEY);
  });

  it.each([
    ['CREATE', 'Appointment'],
    ['UPDATE', 'DoctorSchedule'],
    ['DELETE', 'Notification'],
    ['READ', 'HealthProfile'],
    ['LOGIN', 'User'],
    ['LOGOUT', 'User'],
  ] as const)(
    'supports the %s action for entity %s',
    (action, entityName) => {
      class SampleController {
        @AuditLogAction({ action, entityName })
        handler() {
          return undefined;
        }
      }

      expect(
        Reflect.getMetadata(AUDIT_LOG_KEY, SampleController.prototype.handler),
      ).toEqual({ action, entityName });
    },
  );
});
