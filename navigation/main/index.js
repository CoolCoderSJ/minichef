import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

import App from "../../screens/index";
import Login from "../../screens/login";
import Welcome from "../../screens/welcome";

const MainStack = createStackNavigator();

const Main = () => {
  return (
    <NavigationContainer theme={{ colors: { background: 'transparent' } }}>
      <MainStack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >
        <MainStack.Screen name="Welcome" component={Welcome} />
        <MainStack.Screen name="login" component={Login} />
        <MainStack.Screen name="app" component={App} />
      </MainStack.Navigator>
    </NavigationContainer>
  );
};

export default Main;