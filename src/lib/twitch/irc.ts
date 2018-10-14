import { AsyncQueue } from "./queue"
import { Writer } from "./writer"
import { handleLine } from "./parser"
import { ObservableEventEmitter } from "../observable/extra"
import { IrcEvents, SocketConnector } from "./interfaces"

export class IrcClient {
  private _socketFactory: () => SocketConnector
  private _socket!: SocketConnector
  private _events = new ObservableEventEmitter<IrcEvents>()
  private _pending = new AsyncQueue(1600, 200, 3)
  private _writers = [] as Writer[]
  private _writerIdx = -1
  private _messages = this._events.on("message")

  setupSocket() {
    this._socket = this._socketFactory()

    if (this._socket.setKeepAlive) {
      this._socket.setKeepAlive()
    }

    this._socket.onLine = line => handleLine(this, line)
    // this._socket.onClose = this._events.emit("reconnect")
  }

  constructor(socketFactory: () => SocketConnector) {
    this._socketFactory = socketFactory
    this.setupSocket()

    this._events.on("ping").subscribe(who => {
      const text = `PONG :${who}`

      this.writeln(text)

      for (const writer of this._writers) {
        writer.writeln(text)
      }
    })

    this._events.on("reconnect").subscribe(() => this.close())
  }

  async writeln(data: string) {
    await this._socket.writeLine(data)

    this._events.emit("log", `>>> ${data}`)
  }

  async connect() {
    await this._socket.connect()
  }

  async login(user: string, pass: string) {
    this._writers = []

    await this.addConnectedWriter(user, pass)
    await this.writeln(`PASS ${pass}`)
    await this.writeln(`NICK ${user}`)
  }

  async loginAnon() {
    await this.writeln(`NICK justinfan1123746`)
  }

  pauseMessageQueue() {
    this._pending.stop()
  }

  continueMessageQueue() {
    const queue = this._pending.queue

    this._pending = new AsyncQueue(1600 / this._writers.length, 200, 3)
    this._pending.queue = queue
  }

  restartMessageQueue() {
    this.pauseMessageQueue()
    this.continueMessageQueue()
  }

  addWriter() {
    const writer = new Writer(this._socketFactory, line => handleLine(this, line))

    this._writers.push(writer)
    this.restartMessageQueue()

    return writer
  }

  async addConnectedWriter(user: string, pass: string) {
    const writer = this.addWriter()

    await writer.connect()
    await writer.login(user, pass)

    return writer
  }

  remWriter(writer: Writer) {
    writer.close()
    this._writers.splice(this._writers.indexOf(writer), 1)
    this.restartMessageQueue()
  }

  close() {
    this._pending.stop()
    this._socket.close()
    this.setupSocket()

    for (let i = this._writers.length - 1; i >= 0; i--) {
      this._writers[i].close()
      this._writers.splice(i, 1)
    }
  }

  reconnect() {
    this._events.emit("reconnect", undefined)
  }

  async sendInsecure(chn: string, msg: string) {
    // if (this._pending.stopped) {
    //   this.continueMessageQueue()
    // }

    await this._pending.ready()

    // setTimeout(() => {
    //   if (this._pending.queue.length === 0) {
    //     this.pauseMessageQueue()
    //   }
    // }, this._pending.timeout)

    if (this._writers.length === 0) {
      throw "nice writers nam"
    }

    if (++this._writerIdx === this._writers.length) {
      this._writerIdx = 0
    }

    await this._writers[this._writerIdx].sendInsecure(chn, msg)
  }

  async validateMessage(_0: string, _1: string) {
    return true
  }

  async send(chn: string, msg: string) {
    switch (msg[0]) {
      case "!": case "/": case ".":
        throw "msg starts with invalid characters"
    }

    if (!await this.validateMessage(chn, msg)) {
      throw "msg includes invalid phrase"
    }

    await this.sendInsecure(chn, msg.replace(/\./g, "·"))
  }

  whisper(usr: string, msg: string) {
    return this.send("forsen", `/w ${usr} ${msg}`)
  }

  join(chn: string) {
    return this.writeln(`JOIN #${chn}`)
  }

  part(chn: string) {
    return this.writeln(`PART #${chn}`)
  }

  async reqCap(name: "commands" | "membership" | "tags") {
    const text = `CAP REQ :twitch.tv/${name}`

    await this.writeln(text)

    for (const writer of this._writers) {
      await writer.writeln(text)
    }
  }

  on<K extends keyof IrcEvents>(event: K) {
    return this._events.on(event)
  }

  once<K extends keyof IrcEvents>(event: K) {
    return this._events.once(event)
  }

  emit<K extends keyof IrcEvents>(event: K, args: IrcEvents[K]) {
    this._events.emit(event, args)
  }

  get writers() {
    return this._writers
  }

  get events() {
    return this._events
  }

  get messages() {
    return this._messages
  }
}
