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

declare module "react-native-dialog-input" {
  import { StyleProp } from "react-native";

  interface Props {
    isDialogVisible: boolean
    title?: string
    message?: string
    hintInput?: string
    textInputProps?: any
    modalStyle?: StyleProp
    dialogStyle?: StyleProp
    cancelText?: string
    submitText?: string
    submitInput?: (result: string) => any
    closeDialog?: () => any
  }

  export default class DialogInput extends React.Component<Props> { }
}
