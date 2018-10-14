import { IrcClient } from "./irc"
import { MsgRequest } from "./request"
import { filter } from "rxjs/operators"

interface ValidationEvent {
  chn: string
  msg: string
}

type ValidatorFn = (ev: ValidationEvent) => boolean | Promise<boolean>

interface Controller {
  regexp: RegExp
  run: (req: MsgRequest) => any
}

export class TwitchBot extends IrcClient {
  private _validators = [] as ValidatorFn[]
  
  async validateMessage(chn: string, msg: string) {
    for (const validator of this._validators) {
      if (!await validator({ chn, msg })) {
        return false
      }
    }

    return true
  }

  command(regexp: RegExp) {
    return this.messages.pipe(filter(req => req.createMatch(regexp)))
  }

  controller<TConstructor extends { new(): Controller }>(ctrl: Controller | TConstructor) {
    const controller = (typeof ctrl === "function") ? new ctrl() : ctrl

    return this.command(controller.regexp)
      .subscribe(req => controller.run(req))
  }

  get validators() {
    return this._validators
  }
}
