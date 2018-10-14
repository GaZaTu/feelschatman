import * as React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle, Image, FlatList, TextInput, KeyboardAvoidingView } from "react-native";
import { IrcClient } from "./lib/twitch/irc";
import { websocketConnectorFactory } from "./lib/twitch/ws";
import { ChatMsgRequest, FFZEmote, BTTVEmote, FFZRoomResponse, BTTVRoomResponse } from "./interfaces";
import { handleActionMsg, createMsgItemMap, handleTwitchEmotes, setTwitchEmotesInMsgItemsMap, createMsgItems, createFfzEmotes, createBttvEmotes } from "./pipes";
import { filter, tap } from "rxjs/operators";

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
  messageItem: {
    color: "#ffffff",
  } as TextStyle,
})

export default class App extends React.Component<Props, State> {
  bot = new IrcClient(websocketConnectorFactory)
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
    this.bot.on("reconnect").subscribe(() => this.connect())
    this.bot.on("message")
      .pipe(
        filter((_req): _req is ChatMsgRequest => true),
        tap(handleActionMsg),
        tap(createMsgItemMap),
        tap(handleTwitchEmotes),
        tap(setTwitchEmotesInMsgItemsMap),
        tap(createMsgItems),
        tap(createFfzEmotes(this.ffzEmotes)),
        tap(createBttvEmotes(this.bttvEmotes)),
      )
      .subscribe(req => {
        req.emoteInfos = undefined
        req.emotes = undefined
        req.msgItemMap = undefined

        req.tags.color = req.tags.color || "#ffffff"

        this.setState({
          messages: [req, ...this.state.messages.slice(0, 300)],
        })
      })

    this.bot.reconnect()
  }

  componentWillUnmount() {
    this.bot.close()
  }

  render() {
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <FlatList data={this.state.messages} renderItem={(message) =>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }} onTouchEnd={() => console.log(message.item)}>
            <Text style={{ color: message.item.tags.color as any }}>{message.item.tags["display-name"]}</Text>
            {!message.item.isAction && <Text style={{ color: "#ffffff" }}>:</Text>}
            {message.item.msgItems.map((item, i) =>
              <View key={i} style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <Text> </Text>
                {typeof item === "string" ?
                  <Text style={message.item.isAction ? [styles.messageItem, { color: message.item.tags.color as any }] : styles.messageItem}>{item}</Text> :
                  <Image style={{ width: item.width, height: item.height }} source={{ uri: item.uri }} />
                }
              </View>
            )}
          </View>
        } keyExtractor={(item) => item.tags.id} inverted style={{ width: "95%" }} />
        <TextInput style={{ width: "95%", color: "#ffffff" }} onChangeText={messageToSend => this.setState({ messageToSend })} value={this.state.messageToSend} onSubmitEditing={() => this.sendMessage()} />
      </KeyboardAvoidingView>
    )
  }

  async connect() {
    await this.bot.connect()
    await this.bot.loginAnon()

    await this.bot.reqCap("tags")
    await this.bot.reqCap("commands")
    await this.bot.reqCap("membership")

    await this.bot.join("forsen")

    this.ffzEmotes.clear()
    this.bttvEmotes.clear()

    await fetch("https://api.frankerfacez.com/v1/room/forsen")
      .then(res => res.json() as Promise<FFZRoomResponse>)
      .then(json => {
        for (const emote of json.sets[Object.keys(json.sets)[0]].emoticons) {
          this.ffzEmotes.set(emote.name, emote)
        }
      })
    
    await fetch("https://api.betterttv.net/2/channels/forsen")
      .then(res => res.json() as Promise<BTTVRoomResponse>)
      .then(json => {
        for (const emote of json.emotes) {
          this.bttvEmotes.set(emote.code, emote)
        }
      })
    
    await fetch("https://api.betterttv.net/2/emotes")
      .then(res => res.json() as Promise<BTTVRoomResponse>)
      .then(json => {
        for (const emote of json.emotes) {
          this.bttvEmotes.set(emote.code, emote)
        }
      })
  }

  sendMessage() {
    this.bot.send("forsen", this.state.messageToSend)

    this.setState({
      messageToSend: "",
    })
  }
}
