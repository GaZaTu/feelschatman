import * as React from "react";
import { StyleSheet, View, Button, AsyncStorage } from "react-native";
import ChatView, { chatViewGlobal } from "./ChatView";
import { createMaterialTopTabNavigator, NavigationRouteConfigMap, NavigationContainer, NavigationScreenProps, NavigationScreenOptions } from "react-navigation";

type Props = NavigationScreenProps

interface State {
  channels: string[]
  newChannel: string
  Navigation: NavigationContainer | null
}

const styles = StyleSheet.create({})

export default class TabbedChannelsView extends React.PureComponent<Props, State> {
  static navigationOptions: NavigationScreenOptions = {
    title: "Channels",
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      channels: [],
      newChannel: "",
      Navigation: null,
    }
  }

  componentDidMount() {
    this.load()

    chatViewGlobal.resetIrc()
  }

  render() {
    const config = {} as NavigationRouteConfigMap

    for (const channel of this.state.channels) {
      config[channel] = () => (<ChatView key={channel} channel={channel} />)
    }

    config["+"] = () => (
      <View>
        <Button title="Settings" onPress={() => this.props.navigation.navigate("Settings")} />
      </View>
    )

    const Navigation = createMaterialTopTabNavigator(config)

    return (
      <View style={{ flex: 1 }}>
        <Navigation />
      </View>
    )
  }

  async load() {
    await Promise.all([
      this.loadChannels(),
    ])
  }

  async loadChannels() {
    const channels = await AsyncStorage.getItem("settings.channels")

    if (channels) {
      this.setState({
        channels: JSON.parse(channels),
      })
    }
  }
}
