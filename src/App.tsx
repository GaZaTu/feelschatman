import * as React from "react";
import { StyleSheet, View, Text, TextInput, ViewStyle, KeyboardAvoidingView, Button } from "react-native";
import DialogInput from "react-native-dialog-input";
import ChatView from "./ChatView";
import { NavigationRouteConfigMap, createBottomTabNavigator, createMaterialTopTabNavigator } from "react-navigation";

interface Props { }

interface State { }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#19171c",
  } as ViewStyle,
})

export default class App extends React.Component<Props, State> {
  newChannelName = ""
  chatViews = new Map<string, () => React.ReactElement<ChatView>>()

  constructor(props: Props) {
    super(props)

    this.state = {}
  }

  onNewChannelNameChange = (newChannelName: string) => {
    this.newChannelName = newChannelName
  }

  onJoinNewChannelPress = () => {
    this.join(this.newChannelName)
  }

  componentDidMount() {
    this.join("forsen")
  }

  render() {
    const TabNavigator = this.createTabNavigator()

    return (
      <TabNavigator />
    )
  }
  
  createTabNavigator() {
    const navigationConfig: NavigationRouteConfigMap = {}

    for (const entry of this.chatViews) {
      navigationConfig[entry[0]] = entry[1]
    }

    navigationConfig["+"] = () => {
      return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
          <TextInput style={{ width: "95%", color: "#ffffff" }} onChangeText={this.onNewChannelNameChange} />
          <Button title="Join" onPress={this.onJoinNewChannelPress} />
        </KeyboardAvoidingView>
      )
    }

    return createMaterialTopTabNavigator(navigationConfig)
  }

  join(channel: string) {
    this.chatViews.set(channel, () => (<ChatView channel={channel} />))

    this.forceUpdate()
  }
}
