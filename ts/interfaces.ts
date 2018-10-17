import { MsgRequest } from "./lib/twitch";

export interface EmoteInfo {
  id: string
  kind: "twitch" | "ffz" | "bttv"
  indexes: [number, number][]
  uri: string
  base64: string
  height: number
  width: number
}

export interface EmoteIndexInfo {
  start: number
  end: number
  data: EmoteInfo
}

export interface ChatMsgRequest extends MsgRequest {
  isAction?: boolean
  emoteInfos?: EmoteInfo[]
  emotes?: EmoteIndexInfo[]
  msgItemMap?: Map<number, string | EmoteInfo>
  msgItems?: (string | EmoteInfo)[]
  displayNameWithColon?: string
  pinged?: boolean
}

export interface FFZEmote {
  id: number
  name: string
  height: number
  width: number
  urls: {
    "1": string
    "2": string
    "4": string
  }
}

export interface FFZRoomResponse {
  room: {}
  sets: {
    [key: string]: {
      emoticons: FFZEmote[]
    }
  }
}

export interface BTTVEmote {
  id: string
  channel: string | null
  code: string
  imageType: string
}

export interface BTTVRoomResponse {
  status: number
  urlTemplate: string
  emotes: BTTVEmote[]
}
