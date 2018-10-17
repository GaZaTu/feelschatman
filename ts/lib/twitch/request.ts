import * as intf from "./interfaces"
import { IrcClient } from "./irc"

export class MsgRequest {
  bot: IrcClient
  usr: string
  chn: string
  msg: string
  tags: intf.MessageTags
  match!: RegExpExecArray

  constructor(bot: IrcClient, usr: string, chn: string, msg: string, tags: intf.Tags) {
    this.bot = bot
    this.usr = usr
    this.chn = chn
    this.msg = msg
    this.tags = tags as any
  }

  send(msg: string) {
    return this.bot.send(this.chn, msg)
  }

  sendInsecure(msg: string) {
    return this.bot.sendInsecure(this.chn, msg)
  }

  respond(msg: string) {
    return this.send(`@${this.usr} ${msg}`)
  }

  whisper(msg: string) {
    return this.send(`/w ${msg}`)
  }

  validate() {
    return this.bot.validateMessage(this.chn, this.msg)
  }

  createMatch(regexp: RegExp) {
    const match = regexp.exec(this.msg)

    if (match) {
      this.match = match
      return true
    } else {
      return false
    }
  }
}
