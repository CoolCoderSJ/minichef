// Import the necessary libraries
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import { ScrollView, View, Image } from "react-native";
import {
  Button, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";

console.disableYellowBox = true;


const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }

export default Welcome = () => {

  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize state
  const [formData, setData] = React.useState({});

  get("login").then(result => {
    if (result) {
      navigation.navigate('app')
    }
  })

  return (
    <Layout>
      <ScrollView> 
        <Text fontWeight="bold" style={{ fontSize: 30, textAlign: "center", marginTop: 100 }}>Welcome to Mini Chef</Text>
        <Text style={{ fontSize: 20, textAlign: "center", marginTop: 10 }}>The best recipe app there is!</Text>
        <View style={{ alignItems: "center", marginTop: 50 }}>
            <Image source={require("../assets/illustration.png")} style={{ width: 350, height: 350 }} />
        </View>
        <Button
          text="Get Started"
          onPress={() => navigation.navigate('login')}
          style={{ margin: 20, marginTop: 40 }}
        />
      </ScrollView>
    </Layout>
  );
}