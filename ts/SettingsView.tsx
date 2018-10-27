import * as React from "react";
import { StyleSheet, View, Text } from "react-native";
import { NavigationScreenProps, NavigationScreenOptions } from "react-navigation";

type Props = NavigationScreenProps

interface State { }

const styles = StyleSheet.create({})

export default class SettingsView extends React.PureComponent<Props, State> {
  static navigationOptions: NavigationScreenOptions = {
    title: "Settings",
  }

  constructor(props: Props) {
    super(props)

    this.state = {}
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Text>SETTINGS</Text>
      </View>
    )
  }
}
