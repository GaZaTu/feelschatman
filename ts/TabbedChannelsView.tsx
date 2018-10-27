import * as React from "react";
import { StyleSheet, View, Button } from "react-native";
import ChatView from "./ChatView";
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
      channels: ["forsen", "pajlada"],
      newChannel: "",
      Navigation: null,
    }
  }

  createNavigator() {
    const config = {} as NavigationRouteConfigMap

    for (const channel of this.state.channels) {
      config[channel] = () => (<ChatView key={channel} channel={channel} />)
    }

    // config["+"] = () => (
    //   <View>
    //     <TextInput value={this.state.newChannel} onChangeText={this.onNewChannelChange} />
    //     <Button title="Join channel" onPress={() => this.joinChannel()} />
    //   </View>
    // )

    this.setState({
      Navigation: createMaterialTopTabNavigator(config),
    })
  }

  componentDidMount() {
    this.createNavigator()
  }

  // onNewChannelChange = (newChannel: string) => {
  //   this.setState({ newChannel })
  // }

  render() {
    const config = {} as NavigationRouteConfigMap

    for (const channel of this.state.channels) {
      config[channel] = () => (<ChatView key={channel} channel={channel} />)
    }

    // config["+"] = () => (
    //   <View>
    //     <TextInput value={this.state.newChannel} onChangeText={this.onNewChannelChange} />
    //     <Button title="Join channel" onPress={() => this.joinChannel()} />
    //   </View>
    // )

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

  // joinChannel() {
  //   this.setState({
  //     channels: [...this.state.channels, this.state.newChannel],
  //   })
  // }
}
