import { createStackNavigator } from "react-navigation";
import TabbedChannelsView from "./TabbedChannelsView";
import SettingsView from "./SettingsView";

const App = createStackNavigator({
  Channels: { screen: TabbedChannelsView },
  Settings: { screen: SettingsView },
})

export default App
