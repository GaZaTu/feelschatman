import { ObservableEventEmitter } from "../observable/extra";
import { IrcEventMap } from "./data";
import { webSocket, WebSocketSubjectConfig, WebSocketSubject } from "rxjs/webSocket";
import { mapLineToIrcEvent } from "./parser";
import { tap } from "rxjs/operators";

const webSocketConfig: WebSocketSubjectConfig<string> = {
  url: "ws://irc-ws.chat.twitch.tv/",
  deserializer: event => event.data,
  serializer: data => data,
}

export class IrcClient {
  private _socket!: WebSocketSubject<string>
  private _events = new ObservableEventEmitter<IrcEventMap>()
  private _messages = this._events.on("privmsg")
  private _socketPipeFactory = (defaultPipe: typeof mapLineToIrcEvent) => defaultPipe

  constructor() {
    this._events.on("ping").subscribe(({ src }) => this._socket.next(`PONG :${src}`))
    this._events.on("reconnect").subscribe(() => this.reconnect())
  }

  connect() {
    this._socket = webSocket<string>(webSocketConfig)

    this._socket.pipe(this._socketPipeFactory(mapLineToIrcEvent)).subscribe({
      next: event => this._events.emit(event.type, event),
      error: error => this._events.emit("error", error),
      complete: () => this._events.emit("close", undefined),
    })

    this._events.emit("connect", undefined)
  }

  disconnect() {
    if (this._socket) {
      this._socket.complete()
    }
  }

  reconnect() {
    this.disconnect()
    this.connect()
  }

  login(nick: string, pass: string) {
    this._socket.next(`PASS ${pass}`)
    this._socket.next(`NICK ${nick}`)
  }

  loginAnon() {
    this._socket.next(`NICK justinfan93434586`)
  }

  send(chn: string, msg: string) {
    this._socket.next(`PRIVMSG #${chn} : ${msg}`)
  }

  whisper(usr: string, msg: string) {
    this.send("forsen", `/w ${usr} ${msg}`)
  }

  join(chn: string) {
    this._socket.next(`JOIN #${chn}`)
  }

  part(chn: string) {
    this._socket.next(`PART #${chn}`)
  }

  reqCap(name: "commands" | "membership" | "tags") {
    this._socket.next(`CAP REQ :twitch.tv/${name}`)
  }

  on<K extends keyof IrcEventMap>(event: K) {
    return this._events.on(event)
  }

  once<K extends keyof IrcEventMap>(event: K) {
    return this._events.once(event)
  }

  emit<K extends keyof IrcEventMap>(event: K, args: IrcEventMap[K]) {
    this._events.emit(event, args)
  }

  get messages() {
    return this._messages
  }

  get socketPipeFactory() {
    return this._socketPipeFactory
  }

  set socketPipeFactory(value) {
    this._socketPipeFactory = value
  }
}
