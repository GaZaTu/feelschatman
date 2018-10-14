import { Observable, Subscription } from "rxjs";

type ProtoOf<T> = Pick<T, keyof T> & { constructor: Function }

interface WatchIntf extends React.Component { }

export function Watch<TSelf extends WatchIntf, TArg = any>(getObservable: (self: TSelf) => Observable<TArg>) {
  return <T extends TSelf, K extends keyof T>
    (proto: ProtoOf<T>, _key: K, descriptor: TypedPropertyDescriptor<(...args: any[]) => any>) => {
    const componentWillMount = proto.componentWillMount
    const componentWillUnmount = proto.componentWillUnmount

    const data = {
      subscription: null as Subscription | null,
    }

    proto.componentWillMount = function (this: T, ...args: any[]) {
      if (componentWillMount) {
        componentWillMount.apply(this, args)
      }

      data.subscription = getObservable(this).subscribe(value => {
        descriptor.value!.apply(this, [value])
      })
    }

    proto.componentWillUnmount = function (this: T, ...args: any[]) {
      data.subscription!.unsubscribe()

      if (componentWillUnmount) {
        componentWillUnmount.apply(this, args)
      }
    }
  }
}
