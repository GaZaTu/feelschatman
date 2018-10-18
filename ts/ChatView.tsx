import * as React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle, FlatList, TextInput, KeyboardAvoidingView, ListRenderItemInfo } from "react-native";
import FastImage from "react-native-fast-image";
import { IrcClient } from "./lib/twitch/irc";
import { websocketConnectorFactory } from "./lib/twitch/ws";
import { ChatMsgRequest, FFZEmote, BTTVEmote, FFZRoomResponse, BTTVRoomResponse } from "./interfaces";
import { handleActionMsg, createMsgItemMap, handleTwitchEmotes, setTwitchEmotesInMsgItemsMap, createMsgItems, createFfzEmotes, createBttvEmotes, reduceNeededReactElements } from "./pipes";
import { filter, tap } from "rxjs/operators";
import { Watch } from "./utils";

interface Props {
  channel: string
}

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
  list: {
    width: "95%",
  },
  input: {
    width: "95%",
    color: "#ffffff",
  },
})

export default class ChatView extends React.PureComponent<Props, State> {
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

  extractMessageKey = (msg: ChatMsgRequest) => {
    return msg.tags.id
  }

  renderMessage = (itemInfo: ListRenderItemInfo<ChatMsgRequest>) => {
    return (<Message msg={itemInfo.item} />)
  }

  onMessageChange = (messageToSend: string) => {
    this.setState({ messageToSend })
  }

  onMessageSubmit = () => {
    this.sendMessage()
  }

  render() {
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <FlatList
          inverted
          style={styles.list}
          data={this.state.messages}
          keyExtractor={this.extractMessageKey}
          renderItem={this.renderMessage} />

        <TextInput
          style={styles.input}
          value={this.state.messageToSend}
          onChangeText={this.onMessageChange}
          onSubmitEditing={this.onMessageSubmit} />
      </KeyboardAvoidingView>
    )
  }

  async join(channel: string) {
    await this.irc.join(channel)

    this.ffzEmotes.clear()
    this.bttvEmotes.clear()

    fetch(`https://api.frankerfacez.com/v1/room/${channel}`)
      .then(res => res.json() as Promise<FFZRoomResponse>)
      .then(json => {
        for (const emote of json.sets[Object.keys(json.sets)[0]].emoticons) {
          this.ffzEmotes.set(emote.name, emote)
        }
      })

    fetch(`https://api.betterttv.net/2/channels/${channel}`)
      .then(res => res.json() as Promise<BTTVRoomResponse>)
      .then(json => {
        for (const emote of json.emotes) {
          this.bttvEmotes.set(emote.code, emote)
        }
      })

    fetch(`https://api.betterttv.net/2/emotes`)
      .then(res => res.json() as Promise<BTTVRoomResponse>)
      .then(json => {
        for (const emote of json.emotes) {
          this.bttvEmotes.set(emote.code, emote)
        }
      })
  }

  @Watch((self: ChatView) => self.irc.on("reconnect"))
  async onReconnect() {
    await this.irc.connect()
    await this.irc.loginAnon()

    await this.irc.reqCap("tags")
    await this.irc.reqCap("commands")
    await this.irc.reqCap("membership")

    await this.join(this.props.channel)
  }

  @Watch((self: ChatView) => self.irc.on("message")
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
    req.emoteInfos = undefined
    req.emotes = undefined
    req.msgItemMap = undefined

    // req.pinged = req.msg.includes("")

    req.tags.color = req.tags.color || "#ffffff"

    this.setState({
      messages: [req, ...this.state.messages.slice(0, 100)],
    })
  }

  sendMessage() {
    this.irc.send(this.props.channel, this.state.messageToSend)

    this.setState({
      messageToSend: "",
    })
  }
}

class Message extends React.Component<{ msg: ChatMsgRequest }> {
  shouldComponentUpdate() {
    return false
  }

  render() {
    const { msg } = this.props

    return (
      <View style={msg.pinged ? [{ backgroundColor: "#cc2123" }, styles.message] : styles.message}>
        <Text style={{ marginRight: 3, color: msg.tags.color as any }}>{msg.displayNameWithColon}</Text>
        {msg.msgItems!.map((item, i) =>
          typeof item === "string" ?
            <Text key={i} style={msg.isAction ? [styles.messageItem, { color: msg.tags.color as any }] : styles.messageItem}>{item}</Text> :
            <FastImage key={i} style={{ width: item.width, height: item.height, marginLeft: 3, marginRight: 3 }} source={{ uri: item.uri }} />
        )}
      </View>
    )
  }
}
