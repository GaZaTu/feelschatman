import { Observable, OperatorFunction, pipe } from "rxjs";
import { filter, map } from "rxjs/operators";

export function mapAsync<T, R>(fn: (value: T) => R | PromiseLike<R>): OperatorFunction<T, R> {
  return source => {
    return new Observable<R>(sub => {
      const data = {
        buffer: [] as T[],
        error: undefined as any,
        waiting: false,
        failed: false,
        completed: false,
      }

      const doNext = async () => {
        data.waiting = true

        while (data.buffer.length > 0) {
          sub.next(await fn(data.buffer.shift()!))
        }

        if (data.failed) {
          sub.error(data.error)
        } else if (data.completed) {
          sub.complete()
        }

        data.waiting = false
      }

      return source.subscribe({
        next: value => {
          data.buffer.push(value)

          if (!data.waiting) {
            doNext()
          }
        },
        error: err => {
          if (data.waiting) {
            data.failed = true
            data.error = err
          } else {
            sub.error(err)
          }
        },
        complete: () => {
          if (data.waiting) {
            data.completed = true
          } else {
            sub.complete()
          }
        },
      })
    })
  }
}

export function filterAsync<T>(fn: (value: T) => boolean | PromiseLike<boolean>): OperatorFunction<T, T> {
  return pipe(
    mapAsync(async value => ({
      value: value,
      accepted: await fn(value),
    })),
    filter(container => container.accepted),
    map(container => container.value),
  )
}
