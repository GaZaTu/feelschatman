import { Observable, Subscriber } from "rxjs";
import { filter, map, first } from "rxjs/operators";

export class ObservableEventEmitter<TEvents = any> {
  private _stream: Observable<{ event: keyof TEvents, data: TEvents[keyof TEvents] }>
  private _subscribers = new Set<Subscriber<{ event: keyof TEvents, data: TEvents[keyof TEvents] }>>()

  constructor() {
    this._stream = new Observable(sub => {
      this._subscribers.add(sub)
      return () => this._subscribers.delete(sub)
    })
  }

  on<K extends keyof TEvents>(event: K) {
    return this._stream
      .pipe(
        filter(ev => ev.event === event),
        map(ev => ev.data as TEvents[K]),
      )
  }

  once<K extends keyof TEvents>(event: K) {
    return this.on<K>(event).pipe(first()).toPromise()
  }

  all() {
    return this._stream
  }

  emit<K extends keyof TEvents>(event: K, data: TEvents[K]) {
    for (const sub of this._subscribers) {
      sub.next({ event, data })
    }
  }
}
