export type Tags = any

export interface PrivmsgTags {
  "badges": string
  "color": string
  "display-name": string
  "emotes": string
  "id": string
  "mod": "0" | "1"
  "room-id": string
  "subscriber": "0" | "1"
  "tmi-sent-ts": string
  "turbo": "0" | "1"
  "user-id": string
  "user-type": string
}

export class IrcEvent {
  constructor(
    public type: keyof IrcEventMap,
  ) { }
}

export class UnknownEvent extends IrcEvent {
  constructor(
    public line: string,
    public tags: Tags,
  ) {
    super("unknown")
  }
}

export class PrivmsgEvent extends IrcEvent {
  constructor(
    public usr: string,
    public chn: string,
    public msg: string,
    public tags: PrivmsgTags,
  ) {
    super("privmsg")
  }
}

export class PingEvent extends IrcEvent {
  constructor(
    public src: string,
  ) {
    super("ping")
  }
}

export class ReconnectEvent extends IrcEvent {
  constructor(
  ) {
    super("reconnect")
  }
}

export interface IrcEventMap {
  connect: undefined
  error: any
  close: undefined
  unknown: UnknownEvent
  privmsg: PrivmsgEvent
  ping: PingEvent
  reconnect: ReconnectEvent
}
