import { SocketConnector } from "./interfaces";

export function websocketConnectorFactory() {
  const socket = new WebSocket("ws://irc-ws.chat.twitch.tv/")
  const connector: SocketConnector = {
    connect: () => {
      socket.addEventListener("message", msg => connector.onLine!(`${msg.data}`))

      return new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          socket.removeEventListener("open", onOpen)
          socket.removeEventListener("error", onError)
        }

        const onOpen = () => {
          cleanup()
          resolve()
        }

        const onError = () => {
          cleanup()
          reject()
        }

        socket.addEventListener("open", onOpen)
        socket.addEventListener("error", onError)
      })
    },
    close: () => socket.close(),
    writeLine: line => socket.send(line),
  }

  return connector
}
