import * as React from "react"
import { ThemeProvider } from "react-native-rapi-ui";
import Navigator from "./navigation/main";
import { enableScreens } from "react-native-screens";

console.disableYellowBox = true;

export default () => {
  enableScreens();

  return (
    <ThemeProvider theme="dark">
      <Navigator />
    </ThemeProvider>
  )
}