import * as intf from "./interfaces"
import { MsgRequest } from "./request"
import { IrcClient } from "./irc"

const tagParserRegex = /^@(.*?) :/
const privmsgRegex = /@(\w+).tmi.twitch.tv PRIVMSG #(\w+) :(.*)/
const clearchatRegex = /CLEARCHAT #(\w+) :(\w+)/
const usernoticeRegex = /USERNOTICE #(\w+)(?: :(.*)|)/
const userstateRegex = /USERSTATE #(\w+)/
const roomstateRegex = /ROOMSTATE #(\w+)/
const pingRegex = /PING :(.*)/
const reconnectRegex = /RECONNECT/
const namesRegex = /:(\w+).tmi.twitch.tv 353 (\w+) = #(\w+) :(.*)/
const joinRegex = /@(\w+).tmi.twitch.tv JOIN #(\w+)/
const partRegex = /@(\w+).tmi.twitch.tv PART #(\w+)/

function parseTags(line: string) {
  const tags = {} as intf.Tags
  const match = tagParserRegex.exec(line)

  if (match) {
    const rawTags = match[1].split(";")

    for (const rawTag of rawTags) {
      const keyval = rawTag.split("=")
      const key = keyval[0]
      const val = keyval[1]
      const valAsNumber = Number(val)

      if (isNaN(valAsNumber)) {
        tags[key] = val.replace(/\\s/g, " ")
      } else {
        tags[key] = valAsNumber
      }
    }

    return {
      tags: tags,
      line: line.substr(tagParserRegex.lastIndex),
    }
  } else {
    return {
      tags: tags,
      line: line,
    }
  }
}

interface Parser {
  regex: RegExp
  emit(bot: IrcClient, line: string, tags: intf.Tags, match: RegExpExecArray): void
}

const parsers: Parser[] = [
  {
    regex: clearchatRegex,
    emit: (bot, _1, tags, match) => bot.emit("clearchat", [match[1], match[2], tags as any]),
  },
  {
    regex: joinRegex,
    emit: (bot, _1, _2, match) => bot.emit("join", [match[2], match[1]]),
  },
  {
    regex: partRegex,
    emit: (bot, _1, _2, match) => bot.emit("part", [match[2], match[1]]),
  },
  {
    regex: usernoticeRegex,
    emit: (bot, _1, tags, match) => bot.emit("usernotice", [match[1], match[2], tags as any]),
  },
  {
    regex: userstateRegex,
    emit: (bot, _1, tags, match) => bot.emit("userstate", [match[1], tags as any]),
  },
  {
    regex: roomstateRegex,
    emit: (bot, _1, tags, match) => bot.emit("roomstate", [match[1], tags as any]),
  },
  {
    regex: pingRegex,
    emit: (bot, _1, _2, match) => bot.emit("ping", match[1]),
  },
  {
    regex: reconnectRegex,
    emit: (bot, _1, _2, _3) => bot.emit("reconnect", undefined),
  },
  {
    regex: namesRegex,
    emit: (bot, _1, _2, match) => bot.emit("names", [match[3], match[4].split(" ")]),
  },
]

export async function handleLine(bot: IrcClient, line: string) {
  bot.emit("log", `<<< ${line}`)

  const parsed = parseTags(line)
  let match = privmsgRegex.exec(parsed.line)

  if (match) {
    const req = new MsgRequest(bot, match[1], match[2], match[3], parsed.tags)

    bot.emit("message", req)

    return
  }

  bot.emit("log2", `<<< ${line}`)

  for (const parser of parsers) {
    const match = parser.regex.exec(parsed.line)

    if (match) {
      parser.emit(bot, parsed.line, parsed.tags, match)

      return
    }
  }

  bot.emit("unknown", line)
}
