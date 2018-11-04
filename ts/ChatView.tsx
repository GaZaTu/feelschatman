import * as React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle, FlatList, TextInput, KeyboardAvoidingView, ListRenderItemInfo } from "react-native";
import FastImage from "react-native-fast-image";
import { IrcClient } from "./lib/twitch/irc";
import { ChatMessageData, FFZEmote, BTTVEmote, FFZRoomResponse, BTTVRoomResponse } from "./interfaces";
import { Subscription } from "rxjs";
import { mapPrivmsgEventToChatMessageData, setFfzEmotesInChatMessageData, setBttvEmotesInChatMessageData, reduceNeededReactElementsInChatMessageData } from "./pipes";
import { tap, filter } from "rxjs/operators";

interface ChatViewData {
  ffzEmotes: Map<string, FFZEmote>
  bttvEmotes: Map<string, BTTVEmote>
  state: State
}

export const chatViewGlobal = {
  irc: new IrcClient(),
  connected: false,
  channels: new Map<string, ChatViewData>(),

  async connectIrc() {
    this.connected = true
    setTimeout(() => this.irc.connect(), 1000) // TODO: fix this
  },

  async disconnectIrc() {
    this.connected = false
    this.irc.disconnect()
  }
}

chatViewGlobal.irc.on("connect").subscribe(() => {
  chatViewGlobal.irc.loginAnon()

  chatViewGlobal.irc.reqCap("tags")
  chatViewGlobal.irc.reqCap("commands")
  chatViewGlobal.irc.reqCap("membership")
})

interface Props {
  channel: string
}

interface State {
  messages: ChatMessageData[]
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
  data: ChatViewData

  constructor(props: Props) {
    super(props)

    const existingData = chatViewGlobal.channels.get(this.props.channel)

    if (existingData) {
      this.data = existingData
      this.state = this.data.state
    } else {
      this.state = {
        messages: [],
        messageToSend: "",
      }

      this.data = {
        bttvEmotes: new Map(),
        ffzEmotes: new Map(),
        state: this.state,
      }

      chatViewGlobal.channels.set(this.props.channel, this.data)
    }

    if (!chatViewGlobal.connected) {
      chatViewGlobal.connectIrc()
    }
  }

  subscriptions = [] as Subscription[]

  componentDidMount() {
    this.setState(this.state)

    this.subscriptions.push(
      chatViewGlobal.irc.on("privmsg")
        .pipe(
          filter(event => event.chn === this.props.channel),
          mapPrivmsgEventToChatMessageData,
          tap(setFfzEmotesInChatMessageData(this.data.ffzEmotes)),
          tap(setBttvEmotesInChatMessageData(this.data.bttvEmotes)),
          tap(reduceNeededReactElementsInChatMessageData),
        )
        .subscribe(ev => this.onMessage(ev))
    )

    this.subscriptions.push(
      chatViewGlobal.irc.on("connect").subscribe(() => {
        this.onConnect()
      })
    )
  }

  componentWillUnmount() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe()
    }

    this.subscriptions = []
    this.data.state = this.state
  }

  keyExtractor = (msg: ChatMessageData) => {
    return msg.id
  }

  renderItem = (itemInfo: ListRenderItemInfo<ChatMessageData>) => {
    return (<Message msg={itemInfo.item} />)
  }

  // getItemLayout = (data: ChatMessageData[] | null, index: number) => {
  //   return {
  //     length: 100,
  //     offset: 100,
  //     index,
  //   }
  // }

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
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          // getItemLayout={this.getItemLayout}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={25} />

        <TextInput
          style={styles.input}
          value={this.state.messageToSend}
          onChangeText={this.onMessageChange}
          onSubmitEditing={this.onMessageSubmit} />
      </KeyboardAvoidingView>
    )
  }

  join(channel: string) {
    chatViewGlobal.irc.join(channel)

    this.data.ffzEmotes.clear()
    this.data.bttvEmotes.clear()

    fetch(`https://api.frankerfacez.com/v1/room/${channel}`)
      .then(res => res.json() as Promise<FFZRoomResponse>)
      .then(json => {
        for (const emote of json.sets[Object.keys(json.sets)[0]].emoticons) {
          this.data.ffzEmotes.set(emote.name, emote)
        }
      })

    fetch(`https://api.betterttv.net/2/channels/${channel}`)
      .then(res => res.json() as Promise<BTTVRoomResponse>)
      .then(json => {
        for (const emote of json.emotes) {
          this.data.bttvEmotes.set(emote.code, emote)
        }
      })

    fetch(`https://api.betterttv.net/2/emotes`)
      .then(res => res.json() as Promise<BTTVRoomResponse>)
      .then(json => {
        for (const emote of json.emotes) {
          this.data.bttvEmotes.set(emote.code, emote)
        }
      })
  }

  onConnect() {
    this.join(this.props.channel)
  }

  onMessage(msg: ChatMessageData) {
    this.setState({
      messages: [msg, ...this.state.messages.slice(0, 100)],
    })
  }

  sendMessage() {
    chatViewGlobal.irc.send(this.props.channel, this.state.messageToSend)

    this.setState({
      messageToSend: "",
    })
  }
}

class Message extends React.Component<{ msg: ChatMessageData }> {
  shouldComponentUpdate() {
    return false
  }

  render() {
    const { msg } = this.props

    return (
      <View style={msg.highlight ? [{ backgroundColor: "#cc2123" }, styles.message] : styles.message}>
        <Text style={{ marginRight: 3, color: msg.color }}>{msg.displayName}</Text>
        {msg.msgItems!.map((item, i) =>
          typeof item === "string" ?
            <Text key={i} style={msg.isAction ? [styles.messageItem, { color: msg.color }] : styles.messageItem}>{item}</Text> :
            <FastImage key={i} style={{ width: item.width, height: item.height, marginLeft: 3, marginRight: 3 }} source={{ uri: item.uri }} />
        )}
      </View>
    )
  }
}
