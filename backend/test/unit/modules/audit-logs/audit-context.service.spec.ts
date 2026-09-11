import { firstValueFrom, Observable } from 'rxjs';
import { AuditContextService } from 'src/modules/audit-logs/audit-context.service';

describe('AuditContextService', () => {
  it('provides one async-local store throughout an observable request', async () => {
    const context = new AuditContextService();
    const result = await firstValueFrom(
      context.run(
        () =>
          new Observable((subscriber) => {
            context.setOldData({ status: 'PENDING' });
            setImmediate(() => {
              context.setNewData({ status: 'CONFIRMED' });
              subscriber.next(context.getStore());
              subscriber.complete();
            });
          }),
      ),
    );

    expect(result).toEqual({
      oldData: { status: 'PENDING' },
      newData: { status: 'CONFIRMED' },
    });
    expect(context.getStore()).toBeUndefined();
  });

  it('does not leak writes made outside a request context', () => {
    const context = new AuditContextService();
    context.setOldData({ secret: true });
    context.setNewData({ secret: true });
    expect(context.getStore()).toBeUndefined();
  });
});
