declare module "react-native-cacheable-image" {
  import { StyleProp, ImageStyle } from "react-native";

  interface Props {
    style: StyleProp<ImageStyle>
    source: {
      uri: string
    }
  }

  export default class CacheableImage extends React.Component<Props> { }
}
