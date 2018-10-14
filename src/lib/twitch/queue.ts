export class AsyncQueue {
  private _timeout: number
  private _limit: number
  private _millisec = Date.now()
  private _queue = [] as (() => void)[]
  private _timerId: any
  private _stopped = false

  constructor(timeout: number, repeat: number, limit: number) {
    this._timeout = timeout
    this._limit = limit
    this._timerId = setInterval(() => this.onInterval(), repeat)
  }

  onInterval() {
    const millisec = Date.now()
    const diff = millisec - this._millisec

    if (this._queue.length > 0 && diff > this._timeout) {
      this._millisec = millisec
      this._queue.shift()!()
    }
  }

  ready() {
    return new Promise<void>((resolve, reject) => {
      if (this._queue.length < this._limit) {
        this._queue.push(resolve)
        this.onInterval()
      } else {
        reject("queue full")
      }
    })
  }

  stop() {
    clearInterval(this._timerId)
    this._stopped = true
  }

  get queue() {
    return this._queue
  }

  set queue(val) {
    this._queue = val
  }

  get stopped() {
    return this._stopped
  }

  get timeout() {
    return this._timeout
  }
}
