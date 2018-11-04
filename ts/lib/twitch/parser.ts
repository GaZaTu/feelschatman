import { map } from "rxjs/operators";
import { Tags, PrivmsgTags, PrivmsgEvent, IrcEvent, UnknownEvent, PingEvent, ReconnectEvent } from "./data";

function parseTags(line: string): [string, Tags] {
  const tags = {} as Tags

  if (line.startsWith("@")) {
    let key = ""
    let lastI = 1

    for (let i = lastI; i < line.length - 1; i++) {
      switch (line[i]) {
        case "=":
          key = line.slice(lastI, i)
          lastI = i + 1
          break

        case ";":
          tags[key] = line.slice(lastI, i)
          lastI = i + 1
          break
        
        case " ":
          tags[key] = line.slice(lastI, i)
          lastI = i + 1
          
          return [line.slice(lastI), tags]
      }
    }
  }

  return [line, tags]
}

type ParserFn = (line: string, tags: Tags) => IrcEvent | null

const parsers: ParserFn[] = [
  (line: string, tags: PrivmsgTags) => {
    const regex = /:(\w+)!\w+@\S+ PRIVMSG #(\w+) :/
    const match = regex.exec(line)

    if (match) {
      return new PrivmsgEvent(
        match[1],
        match[2],
        line.slice(match[0].length, -2),
        tags,
      )
    } else {
      return null
    }
  },
  (line: string) => {
    const regex = /PING :(.*)/
    const match = regex.exec(line)

    if (match) {
      return new PingEvent(match[1])
    } else {
      return null
    }
  },
  (line: string) => {
    if (line.includes("RECONNECT")) {
      return new ReconnectEvent()
    } else {
      return null
    }
  },
]

export const mapLineToIrcEvent = map<string, IrcEvent>(line_ => {
  const [line, tags] = parseTags(line_)

  for (const parser of parsers) {
    const result = parser(line, tags)

    if (result) {
      return result
    }
  }

  return new UnknownEvent(line, tags)
})
