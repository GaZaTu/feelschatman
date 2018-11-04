import { PrivmsgEvent } from "./lib/twitch/data";

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

export interface ChatMessageData {
  msgItems: (string | EmoteInfo)[]
  displayName: string
  highlight: boolean
  isAction: boolean
  id: string
  color: string
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
