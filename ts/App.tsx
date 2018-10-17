import * as React from "react";
import { StyleSheet } from "react-native";
import ChatView from "./ChatView";

interface Props { }

interface State { }

const styles = StyleSheet.create({})

export default class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {}
  }

  render() {
    return (
      <ChatView channel="forsen" />
    )
  }
}
