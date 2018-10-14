import * as React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle, Image, FlatList, TextInput, KeyboardAvoidingView } from "react-native";
import { IrcClient } from "./lib/twitch/irc";
import { websocketConnectorFactory } from "./lib/twitch/ws";
import { ChatMsgRequest, FFZEmote, BTTVEmote, FFZRoomResponse, BTTVRoomResponse, EmoteInfo } from "./interfaces";
import { handleActionMsg, createMsgItemMap, handleTwitchEmotes, setTwitchEmotesInMsgItemsMap, createMsgItems, createFfzEmotes, createBttvEmotes, reduceNeededReactElements } from "./pipes";
import { filter, tap } from "rxjs/operators";
import { Watch } from "./utils";

function loadImageAsBase64(uri: string) {
  return fetch(uri)
    .then(res => res.blob())
    .then(blob => {
      return new Promise<string>(resolve => {
        const reader = new FileReader()

        reader.readAsDataURL(blob)
        reader.onloadend = () => resolve(reader.result as any)
      })
    })
}

const imageCache = new Map<string, string>()

function loadImageWithCache(uri: string) {
  const image = imageCache.get(uri)

  if (image) {
    return Promise.resolve(image)
  } else {
    return loadImageAsBase64(uri).then(base64 => {
      imageCache.set(uri, base64)

      return base64
    })
  }
}

function loadBase64DataOfEmotes(req: ChatMsgRequest) {
  return Promise.all(
    req.msgItems!
      .filter(item => typeof item === "object" && item.base64.length === 0)
      .map(item => loadImageWithCache((item as EmoteInfo).uri))
  )
}

interface Props { }

interface State {
  messages: ChatMsgRequest[]
  messageToSend: string
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#19171c",
  } as ViewStyle,
  message: {
    flexDirection: "row",
    flexWrap: "wrap",
  } as TextStyle,
  messageItem: {
    color: "#ffffff",
  } as TextStyle,
})

export default class App extends React.Component<Props, State> {
  irc = new IrcClient(websocketConnectorFactory)
  ffzEmotes = new Map<string, FFZEmote>()
  bttvEmotes = new Map<string, BTTVEmote>()

  constructor(props: Props) {
    super(props)

    this.state = {
      messages: [],
      messageToSend: "",
    }
  }

  componentDidMount() {
    this.irc.reconnect()
  }

  componentWillUnmount() {
    this.irc.close()
  }

  render() {
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <FlatList
          inverted
          style={{ width: "95%" }}
          data={this.state.messages}
          keyExtractor={msg => msg.tags.id}
          renderItem={itemInfo => (<Message msg={itemInfo.item} />)} />
        
        <TextInput
          style={{ width: "95%", color: "#ffffff" }}
          value={this.state.messageToSend}
          onChangeText={messageToSend => this.setState({ messageToSend })}
          onSubmitEditing={() => this.sendMessage()} />
      </KeyboardAvoidingView>
    )
  }

  async join(channel: string) {
    await this.irc.join(channel)

    this.ffzEmotes.clear()
    this.bttvEmotes.clear()

    await fetch(`https://api.frankerfacez.com/v1/room/${channel}`)
      .then(res => res.json() as Promise<FFZRoomResponse>)
      .then(json => {
        for (const emote of json.sets[Object.keys(json.sets)[0]].emoticons) {
          this.ffzEmotes.set(emote.name, emote)
        }
      })

    await fetch(`https://api.betterttv.net/2/channels/${channel}`)
      .then(res => res.json() as Promise<BTTVRoomResponse>)
      .then(json => {
        for (const emote of json.emotes) {
          this.bttvEmotes.set(emote.code, emote)
        }
      })

    await fetch(`https://api.betterttv.net/2/emotes`)
      .then(res => res.json() as Promise<BTTVRoomResponse>)
      .then(json => {
        for (const emote of json.emotes) {
          this.bttvEmotes.set(emote.code, emote)
        }
      })
  }

  @Watch((self: App) => self.irc.on("reconnect"))
  async onReconnect() {
    await this.irc.connect()
    await this.irc.loginAnon()

    await this.irc.reqCap("tags")
    await this.irc.reqCap("commands")
    await this.irc.reqCap("membership")

    await this.join("nymn")
  }

  @Watch((self: App) => self.irc.on("message")
    .pipe(
      filter((_req): _req is ChatMsgRequest => true),
      tap(handleActionMsg),
      tap(createMsgItemMap),
      tap(handleTwitchEmotes),
      tap(setTwitchEmotesInMsgItemsMap),
      tap(createMsgItems),
      tap(createFfzEmotes(self.ffzEmotes)),
      tap(createBttvEmotes(self.bttvEmotes)),
      tap(reduceNeededReactElements),
    ))
  async onMessage(req: ChatMsgRequest) {
    try {
      await loadBase64DataOfEmotes(req)
    } catch (err) {
      console.log("failed to load image", err)
    }

    // req.emoteInfos = undefined
    // req.emotes = undefined
    // req.msgItemMap = undefined

    // req.msgItems = [req.msg]

    // req.pinged = req.msg.includes("")

    req.tags.color = req.tags.color || "#ffffff"

    this.setState({
      messages: [req, ...this.state.messages.slice(0, 100)],
    })
  }

  sendMessage() {
    this.irc.send("forsen", this.state.messageToSend)

    this.setState({
      messageToSend: "",
    })
  }
}

const Message = (props: { msg: ChatMsgRequest }) => (
  <View style={props.msg.pinged ? [{ backgroundColor: "#cc2123" }, styles.message] : styles.message}>
    <Text style={{ marginRight: 3, color: props.msg.tags.color as any }}>{props.msg.displayNameWithColon}</Text>
    {/* {!props.msg.isAction && <Text style={{ color: "#ffffff" }}>:</Text>} */}
    {props.msg.msgItems.map((item, i) =>
      typeof item === "string" ?
        <Text key={i} style={props.msg.isAction ? [styles.messageItem, { color: props.msg.tags.color as any }] : styles.messageItem}>{item}</Text> :
        <Image key={i} style={{ width: item.width, height: item.height, marginLeft: 3, marginRight: 3 }} source={{ uri: item.uri }} />
      // <View key={i} style={{ flexDirection: "row", flexWrap: "wrap" }}>
      //   <Text> </Text>
      //   {typeof item === "string" ?
      //     <Text style={props.msg.isAction ? [styles.messageItem, { color: props.msg.tags.color as any }] : styles.messageItem}>{item}</Text> :
      //     <Image style={{ width: item.width, height: item.height }} source={{ uri: item.uri }} />
      //   }
      // </View>
    )}
  </View>
)
