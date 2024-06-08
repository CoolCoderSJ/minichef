// Import necessary libraries
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

// Import all of the screens

import App from "../../screens/index";
import Login from "../../screens/login";

import Recipes from '../../screens/recipes';
import Ingredients from '../../screens/ingredients';
import UnitConversion from "../../screens/unitconversion";
import Settings from "../../screens/settings";

// Create the navigation stack
const MainStack = createStackNavigator();

const Main = () => {
  return (
    <NavigationContainer>
      <MainStack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <MainStack.Screen name="login" component={Login} />
        <MainStack.Screen name="app" component={App} />

        <MainStack.Screen name="Recipes" component={Recipes} />
        <MainStack.Screen name="Ingredients" component={Ingredients} />
        <MainStack.Screen name="Unit Conversion" component={UnitConversion} />
        <MainStack.Screen name="Settings" component={Settings} />

      </MainStack.Navigator>
    </NavigationContainer>
  );
};

export default Main;