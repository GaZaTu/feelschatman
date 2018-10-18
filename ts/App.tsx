import * as React from "react";
import { StyleSheet, View, Button, Text, TextInput } from "react-native";
import ChatView from "./ChatView";
import { createMaterialTopTabNavigator, NavigationRouteConfigMap } from "react-navigation";

interface Props { }

interface State {
  channels: string[]
}

const styles = StyleSheet.create({})

export default class App extends React.Component<Props, State> {
  newChannel = ""

  constructor(props: Props) {
    super(props)

    this.state = {
      channels: ["forsen", "pajlada"],
    }
  }

  onNewChannelChange = (newChannel: string) => {
    this.newChannel = newChannel
  }

  render() {
    const config = {} as NavigationRouteConfigMap

    for (const channel of this.state.channels) {
      config[channel] = () => (<ChatView key={channel} channel={channel} />)
    }
  
    config["+"] = () => (
      <View>
        <TextInput onChangeText={this.onNewChannelChange} />
        <Text onPress={() => this.joinChannel()}>Join channel</Text>
        {/* <Button title="Join channel" onPress={() => console.log("join channel")} /> */}
      </View>
    )

    const BaseNavigator = createMaterialTopTabNavigator(config)

    return (
      <View style={{ flex: 1 }}>
        <BaseNavigator />
      </View>
    )
  }

  joinChannel() {
    this.setState({
      channels: [...this.state.channels, this.newChannel],
    })
  }
}
