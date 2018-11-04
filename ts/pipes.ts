import { ChatMessageData, EmoteInfo, EmoteIndexInfo, FFZEmote, BTTVEmote } from "./interfaces";
import { map } from "rxjs/operators";
import { PrivmsgEvent } from "./lib/twitch/data";

function handleIsAction(event: PrivmsgEvent, data: ChatMessageData) {
  data.isAction = event.msg.startsWith("\x01ACTION")

  if (data.isAction) {
    event.msg = event.msg.substr("\x01ACTION".length)
  }
}

function populateMsgItemMap(event: PrivmsgEvent, msgItemMap: Map<number, string | EmoteInfo>) {
  let lastIdx = 0

  for (let i = 0; i < event.msg.length - 1; i++) {
    if (event.msg[i] === " ") {
      msgItemMap.set(lastIdx, event.msg.substring(lastIdx, i))
      lastIdx = i + 1
    }
  }

  msgItemMap.set(lastIdx, event.msg.substring(lastIdx))
}

function setTwitchEmotesInMsgItemMap(event: PrivmsgEvent, msgItemMap: Map<number, string | EmoteInfo>) {
  if (!event.tags.emotes) {
    return
  }

  const emoteInfos = [] as EmoteInfo[]
  const emoteIndexes = [] as EmoteIndexInfo[]
  const emoteIdParts = event.tags.emotes.split(/\//g)

  for (const emoteIdPart of emoteIdParts) {
    const colonIdx = emoteIdPart.indexOf(":")
    const emoteId = emoteIdPart.substr(0, colonIdx)
    const positions = emoteIdPart.substr(colonIdx + 1).split(/\,/g)
    const emote: EmoteInfo = {
      id: emoteId,
      kind: "twitch",
      indexes: [],
      uri: `http://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/1.0`,
      base64: "",
      width: 20,
      height: 20,
    }

    for (const position of positions) {
      const indexes = position.split(/\-/g).map(idx => Number(idx))

      emote.indexes.push(indexes as any)
      emoteIndexes.push({
        start: indexes[0],
        end: indexes[1],
        data: emote,
      })
    }

    emoteInfos.push(emote)
  }

  emoteIndexes.sort((a, b) => {
    if (a.start < b.start) {
      return -1
    } else if (a.start > b.start) {
      return 1
    } else {
      return 0
    }
  })

  for (const emote of emoteIndexes) {
    msgItemMap.set(emote.start, emote.data)
  }
}

function handleTwitchEmotes(event: PrivmsgEvent, data: ChatMessageData) {
  const msgItemMap = new Map<number, string | EmoteInfo>()

  populateMsgItemMap(event, msgItemMap)
  setTwitchEmotesInMsgItemMap(event, msgItemMap)

  for (const pair of msgItemMap) {
    data.msgItems.push(pair[1])
  }
}

export const mapPrivmsgEventToChatMessageData = map<PrivmsgEvent, ChatMessageData>(event => {
  const data: ChatMessageData = {
    msgItems: [],
    displayName: event.tags["display-name"],
    highlight: false,
    isAction: false,
    id: event.tags.id,
    color: event.tags.color || "#ffffff",
  }

  handleIsAction(event, data)
  handleTwitchEmotes(event, data)

  return data
})

export function setFfzEmotesInChatMessageData(ffzEmotes: Map<string, FFZEmote>) {
  return (data: ChatMessageData) => {
    for (const index in data.msgItems) {
      const msgItem = data.msgItems[index]

      if (typeof msgItem === "string") {
        const emote = ffzEmotes.get(msgItem)

        if (emote) {
          data.msgItems[index] = {
            id: String(emote.id),
            kind: "ffz",
            indexes: [],
            uri: `https:${emote.urls["1"]}`,
            base64: "",
            width: emote.width,
            height: emote.height,
          }
        }
      }
    }
  }
}

export function setBttvEmotesInChatMessageData(bttvEmotes: Map<string, BTTVEmote>) {
  return (data: ChatMessageData) => {
    for (const index in data.msgItems) {
      const msgItem = data.msgItems[index]

      if (typeof msgItem === "string") {
        const emote = bttvEmotes.get(msgItem)

        if (emote) {
          data.msgItems[index] = {
            id: emote.id,
            kind: "bttv",
            indexes: [],
            uri: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
            base64: "",
            width: 20,
            height: 20,
          }
        }
      }
    }
  }
}

export function reduceNeededReactElementsInChatMessageData(data: ChatMessageData) {
  const newMsgItems = [] as (string | EmoteInfo)[]

  for (const item of data.msgItems) {
    if (typeof item === "string" && newMsgItems.length > 0 && typeof newMsgItems[newMsgItems.length - 1] === "string") {
      newMsgItems[newMsgItems.length - 1] += " " + item
    } else {
      newMsgItems.push(item)
    }
  }

  data.msgItems = newMsgItems
  data.displayName = data.isAction ? data.displayName : data.displayName + ":"
}
