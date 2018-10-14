import { SocketConnector } from "./interfaces"

export class Writer {
  private _socketFactory: () => SocketConnector
  private _socket!: SocketConnector
  private _lineHandler: (line: string) => void
  private _lastsent = ""
  private _user = ""

  setupSocket() {
    this._socket = this._socketFactory()

    if (this._socket.setKeepAlive) {
      this._socket.setKeepAlive()
    }

    this._socket.onLine = this._lineHandler
    // this._socket.onClose = this._events.emit("reconnect")
  }

  constructor(socketFactory: () => SocketConnector, lineHandler: (line: string) => void) {
    this._socketFactory = socketFactory
    this._lineHandler = lineHandler

    this.setupSocket()
  }

  async sendInsecure(chn: string, msg: string) {
    if (msg === this._lastsent) {
      msg += "  ⁭"
    }

    this._lastsent = msg

    this.writeln(`PRIVMSG #${chn} : ${msg}`)
  }

  async writeln(data: string) {
    await this._socket.writeLine(data)
  }

  async connect() {
    await this._socket.connect()
  }

  async login(user: string, pass: string) {
    this._user = user

    await this.writeln(`PASS ${pass}`)
    await this.writeln(`NICK ${user}`)
  }

  close() {
    this._socket.close()
    this.setupSocket()
  }

  get user() {
    return this._user
  }
}
