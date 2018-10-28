import * as React from "react";
import { StyleSheet, View, Text, TextInput, AsyncStorage, FlatList } from "react-native";
import { NavigationScreenProps, NavigationScreenOptions, StackActions, NavigationActions } from "react-navigation";
import * as Keychain from "react-native-keychain";

type Props = NavigationScreenProps

interface State {
  nick: string
  oauth: string
  channels: string[]
  newChannel: string
}

const styles = StyleSheet.create({})

export default class SettingsView extends React.PureComponent<Props, State> {
  static navigationOptions: NavigationScreenOptions = {
    title: "Settings",
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      nick: "",
      oauth: "",
      channels: [],
      newChannel: "",
    }
  }

  componentDidMount() {
    this.load()
  }

  componentWillUnmount() {
    this.save()

    const resetAction = StackActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: "Channels" })],
    })

    this.props.navigation.dispatch(resetAction);
  }

  onNickChange = (nick: string) => {
    this.setState({ nick })
  }

  onOauthChange = (oauth: string) => {
    this.setState({ oauth })
  }

  onNewChannelChange = (newChannel: string) => {
    this.setState({ newChannel })
  }

  onSubmitNewChannel = () => {
    this.setState({
      channels: [...this.state.channels, this.state.newChannel],
      newChannel: "",
    })
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Text>NICK</Text>
        <TextInput value={this.state.nick} onChangeText={this.onNickChange} textContentType="nickname" />
        <Text>OAUTH</Text>
        <TextInput value={this.state.oauth} onChangeText={this.onOauthChange} textContentType="password" />
        <Text>NEW CHANNEL</Text>
        <TextInput value={this.state.newChannel} onChangeText={this.onNewChannelChange} onSubmitEditing={this.onSubmitNewChannel} />
        <Text>CHANNELS</Text>
        <FlatList 
          data={this.state.channels}
          keyExtractor={channel => channel}
          renderItem={channel => (<Text>{channel.item}</Text>)} />
      </View>
    )
  }

  async load() {
    await Promise.all([
      this.loadAuth(),
      this.loadChannels(),
    ])
  }

  async loadAuth() {
    const auth = await Keychain.getGenericPassword()

    if (typeof auth === "object") {
      this.setState({
        nick: auth.username,
        oauth: auth.password,
      })
    }
  }

  async loadChannels() {
    const channels = await AsyncStorage.getItem("settings.channels")

    if (channels) {
      this.setState({
        channels: JSON.parse(channels),
      })
    }
  }

  async save() {
    await Promise.all([
      this.saveAuth(),
      this.saveChannels(),
    ])
  }

  async saveAuth() {
    if (this.state.nick !== "" && this.state.oauth !== "") {
      await Keychain.setGenericPassword(this.state.nick, this.state.oauth)
    }
  }

  async saveChannels() {
    const channels = JSON.stringify(this.state.channels)

    await AsyncStorage.setItem("settings.channels", channels)
  }
}
