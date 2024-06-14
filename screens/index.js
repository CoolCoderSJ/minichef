// Import the libraries required
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import {
  ScrollView, StyleSheet, View, Alert
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  Layout, Text, Button,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';



// Initialize the database functions
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
const delkey = async (key, value) => { try { await AsyncStorage.removeItem(key) } catch (e) { console.log(e) } }
const getAll = async () => { try { const keys = await AsyncStorage.getAllKeys(); return keys } catch (error) { console.error(error) } }


function Index () {

  const navigation = useNavigation();
  // Set the state of the app
  const { isDarkmode, setTheme } = useTheme();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  // Define styles for the screen selection options
  const styles = StyleSheet.create({
    listItem: {
      marginHorizontal: 20,
      marginTop: 20,
      padding: 20,
      backgroundColor: isDarkmode ? "#262834" : "white",
      borderRadius: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  });

  return (
      <Layout>
        <TopNav
          middleContent="Mini Chef"
        />
        <ScrollView>

          <TouchableOpacity onPress={() => navigation.navigate("Recipes")}>
            <View style={styles.listItem}>
              <Text fontWeight="medium">{"Recipes"}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDarkmode ? themeColor.white : themeColor.black}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Ingredients")}>
            <View style={styles.listItem}>
              <Text fontWeight="medium">{"Ingredients"}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDarkmode ? themeColor.white : themeColor.black}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Unit Conversion")}>
            <View style={styles.listItem}>
              <Text fontWeight="medium">{"Unit Conversion"}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDarkmode ? themeColor.white : themeColor.black}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <View style={styles.listItem}>
              <Text fontWeight="medium">{"Settings"}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDarkmode ? themeColor.white : themeColor.black}
              />
            </View>
          </TouchableOpacity>


          <TouchableOpacity style={{ marginTop: 50 }} onPress={() => {
            // Delete the login information, then go back to login
            delkey("login").then(() => { navigation.navigate("login"); forceUpdate() })
          }}>
            <View style={styles.listItem}>
              <Text fontWeight="medium">Logout</Text>
              <Ionicons
                name="log-out-outline"
                size={20}
                color={isDarkmode ? themeColor.white : themeColor.black}
              />
            </View>
          </TouchableOpacity>

        </ScrollView>
      </Layout>
  );
}

import Recipes from './recipes';
import Ingredients from './ingredients';
import UnitConversion from "./unitconversion";
import Settings from "./settings";

const Tab = createBottomTabNavigator();

export default App = () => {
  return (
      <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Recipes') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Ingredients') iconName = focused ? 'nutrition' : 'nutrition-outline';
          else if (route.name === 'Unit Conversion') iconName = focused ? 'calculator' : 'calculator-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
          marginBottom: 7
        },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          padding: 5,
          height: 60,
          backgroundColor: "#1a1820",
          border: "none",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        },
        tabBarActiveTintColor: themeColor.primary300,
        tabBarInactiveTintColor: themeColor.gray300,
      })}
      >
        
        <Tab.Screen name="Home" component={Index} />
        <Tab.Screen name="Recipes" component={Recipes} />
        <Tab.Screen name="Ingredients" component={Ingredients} />
        <Tab.Screen name="Unit Conversion" component={UnitConversion} />
        <Tab.Screen name="Settings" component={Settings} />

      </Tab.Navigator>
  );
}