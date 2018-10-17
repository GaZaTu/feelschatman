import { MsgRequest } from "./request"

export interface Tags {
  [key: string]: string | number
}

export interface MessageTags {
  "badges": string | 0
  "color": string | 0
  "display-name": string
  "emotes": string | 0
  "id": string
  "mod": 0 | 1
  "room-id": number
  "subscriber": 0 | 1
  "tmi-sent-ts": number
  "turbo": 0 | 1
  "user-id": number
  "user-type": string
}

export interface ClearchatTags {
  "ban-duration": number
  "ban-reason": string
  "room-id": number
  "target-user-id": number
  "tmi-sent-ts": number
}

export interface UsernoticeTags extends MessageTags {
  "login": string
  "msg-id": "sub" | "resub" | "subgift"
  "msg-param-months": number
  "msg-param-sub-plan-name": string
  "msg-param-sub-plan": "Prime" | 1000 | 2000 | 3000
  "system-msg": string
  "msg-param-recipient-display-name"?: string
  "msg-param-recipient-id"?: number
  "msg-param-recipient-user-name"?: string
  "msg-param-sender-count"?: number
}

export interface UserstateTags {
  "badges": string
  "color": string
  "display-name": string
  "emote-sets": number
  "mod": 0 | 1
  "subscriber": 0 | 1
  "user-type": string
}

export interface RoomstateTags {
  "broadcaster-lang": string
  "emote-only": 0 | 1
  "followers-only": number
  "r9k": 0 | 1
  "rituals": 0 | 1
  "room-id": number
  "slow": 0 | 1
  "subs-only": 0 | 1
}

export interface IrcEvents {
  log: string
  log2: string
  message: MsgRequest
  ping: string
  unknown: string
  clearchat: [string, string, ClearchatTags]
  usernotice: [string, string, UsernoticeTags]
  userstate: [string, UserstateTags]
  roomstate: [string, RoomstateTags]
  reconnect: undefined
  join: [string, string]
  part: [string, string]
  names: [string, string[]]
}

export interface SocketConnector {
  onLine?: (line: string) => any
  setKeepAlive?(): any
  connect(): any
  close(): any
  writeLine(data: string): any
}
