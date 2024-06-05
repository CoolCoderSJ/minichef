// Import the necessary libraries
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import { ScrollView, View } from "react-native";
import {
  Button, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";
import { Client, Account, ID } from 'react-native-appwrite';

// Disable warnings that aren't important
console.disableYellowBox = true;


let client;
let account;

client = new Client();
client
  .setEndpoint('https://appwrite.shuchir.dev/v1')
  .setProject('minichef')
  .setPlatform('dev.shuchir.minichef');

account = new Account(client);

// Initialize database methods
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }


// Create the login screen function
export default Login = () => {

  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize state
  const [formData, setData] = React.useState({});
  const [errors, setErrors] = React.useState({});

  get("login").then(result => {
    if (result) {
      navigation.navigate('app')
    }
  })

  async function register(email, password) {
    try {
      await account.create(ID.unique(), email, password);
    }
    catch {}

    try { 
      await account.createEmailPasswordSession(email, password);
      await login(email, password);
      let details = await account.get();
      setObj("login", {id: details['$id']})
      navigation.navigate('app')
    }
    catch (err) {
      setErorrs({
        ...errors,
        name: err
      })
    }
  }


  const validate = async () => {
    if (formData.username === undefined || formData.password === undefined) {
      setErrors({
        ...errors,
        name: 'Both fields are required',
      });
      return false;
    }

    return "ok"
  }

  // When the user submits the form, validate the credentials
  const onLogin = () => {
    validate()
      .then(function (check) {
        if (check) {
          register(username, password)
        }
        else {
          return false
        }
      })
  };


  return (
    <Layout>
      <TopNav
        leftAction={() => navigation.goBack()}
        middleContent="Login"
      />
      <ScrollView>
        <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
          <SectionContent>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 10 }}>{errors.name ? errors['name'] : "Enter an email"}</Text>

              <TextInput
                placeholder="Enter an email address"
                onChangeText={(value) => setData({ ...formData, username: value })}
              />
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 10 }}>
                {errors.name ? errors['name'] : "Enter your password"}
              </Text>

              <TextInput
                placeholder="Enter your password"
                onChangeText={(value) => setData({ ...formData, password: value })}
                leftContent={
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color={themeColor.gray300}
                  />
                }
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Button
                style={{ marginTop: 10 }}
                text="Login"
                status="primary"
                type="TouchableOpacity"
                onPress={onLogin}
              />
            </View>
          </SectionContent>
        </Section>
      </ScrollView>
    </Layout>
  );
}