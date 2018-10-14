import { ChatMsgRequest, EmoteInfo, EmoteIndexInfo, FFZEmote, BTTVEmote } from "./interfaces";

export function handleActionMsg(req: ChatMsgRequest) {
  req.isAction = req.msg.startsWith("\x01ACTION")

  if (req.isAction) {
    req.msg = req.msg.substr("\x01ACTION".length)
  }
}

export function createMsgItemMap(req: ChatMsgRequest) {
  req.msgItemMap = new Map()
  let lastIdx = 0

  for (let i = 0; i < req.msg.length - 1; i++) {
    if (req.msg[i] === " ") {
      req.msgItemMap.set(lastIdx, req.msg.substring(lastIdx, i))
      lastIdx = i + 1
    }
  }

  req.msgItemMap.set(lastIdx, req.msg.substring(lastIdx))
}

export function handleTwitchEmotes(req: ChatMsgRequest) {
  if (!req.tags.emotes) {
    return
  }

  const emoteInfos = [] as EmoteInfo[]
  const emoteIndexes = [] as EmoteIndexInfo[]
  const emoteIdParts = req.tags.emotes.split(/\//g)

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

  req.emoteInfos = emoteInfos
  req.emotes = emoteIndexes
  req.emotes.sort((a, b) => {
    if (a.start < b.start) {
      return -1
    } else if (a.start > b.start) {
      return 1
    } else {
      return 0
    }
  })
}

export function setTwitchEmotesInMsgItemsMap(req: ChatMsgRequest) {
  if (req.emotes && req.msgItemMap) {
    for (const emote of req.emotes) {
      req.msgItemMap.set(emote.start, emote.data)
    }
  }
}

export function createMsgItems(req: ChatMsgRequest) {
  req.msgItems = Array.from(req.msgItemMap!.values())
}

export function createFfzEmotes(ffzEmotes: Map<string, FFZEmote>) {
  return (req: ChatMsgRequest) => {
    for (const index in req.msgItems!) {
      const msgItem = req.msgItems![index]

      if (typeof msgItem === "string") {
        const emote = ffzEmotes.get(msgItem)

        if (emote) {
          req.msgItems![index] = {
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

export function createBttvEmotes(bttvEmotes: Map<string, BTTVEmote>) {
  return (req: ChatMsgRequest) => {
    for (const index in req.msgItems!) {
      const msgItem = req.msgItems![index]

      if (typeof msgItem === "string") {
        const emote = bttvEmotes.get(msgItem)

        if (emote) {
          req.msgItems![index] = {
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

export function reduceNeededReactElements(req: ChatMsgRequest) {
  const newMsgItems = [] as typeof req.msgItems

  for (const item of req.msgItems) {
    if (typeof item === "string" && newMsgItems.length > 0 && typeof newMsgItems[newMsgItems.length - 1] === "string") {
      newMsgItems[newMsgItems.length - 1] += " " + item
    } else {
      newMsgItems.push(item)
    }
  }

  req.msgItems = newMsgItems
  req.displayNameWithColon = req.isAction ? req.usr : req.usr + ":"
}
