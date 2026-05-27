import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Observable } from 'rxjs';
export interface AuditStore {
  oldData?: any;
  newData?: any;
  user_id?: number;
}
@Injectable()
export class AuditContextService {
  private readonly storage = new AsyncLocalStorage<AuditStore>();

  run<T>(callback: () => Observable<T>): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.storage.run({}, () => {
        callback().subscribe(subscriber);
      });
    });
  }

  setOldData(oldData: any) {
    const store = this.storage.getStore();
    if (store) {
      store.oldData = oldData;
    }
  }

  setNewData(newData: any) {
    const store = this.storage.getStore();
    if (store) {
      store.newData = newData;
    }
  }

  getStore() {
    return this.storage.getStore();
  }
}
