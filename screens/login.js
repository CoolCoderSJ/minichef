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
import Dialog from "react-native-dialog";

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
const setPlain = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
const delkey = async (key, value) => { try { await AsyncStorage.removeItem(key) } catch (e) { console.log(e) } }
const getAll = async () => { try { const keys = await AsyncStorage.getAllKeys(); return keys } catch (error) { console.error(error) } }


// Create the login screen function
export default Login = () => {

  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize state
  const [formData, setData] = React.useState({});
  const [error, setError] = React.useState('');
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [isLoading, setLoading] = React.useState(false);

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
      await account.deleteSessions();
    }
    catch {}

    try { 
      await account.createEmailPasswordSession(email, password);
      let details = await account.get();
      console.log("DETAILS", details)
      setPlain("login", details['$id'])
      setLoading(false)
      navigation.navigate('app')
    }
    catch (err) {
      setLoading(false)
      setError(String(err))
      setDialogVisible(true)
    }
  }

  const validate = async () => {
    if (formData.username === undefined || formData.password === undefined) {
      setLoading(false)
      setError('Both fields are required')
      setDialogVisible(true)
      return false;
    }

    return "ok"
  }

  const onLogin = () => {
    setLoading(true);
    validate()
      .then(function (check) {
        if (check) {
          register(formData.username, formData.password)
        }
        else {
          setLoading(false)
          return false
        }
      })
  };

  const closeDialog = () => {
    setDialogVisible(false)
  }

  return (
    <Layout>
    {isLoading &&
      <View flex={1} px="3" style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}>
        <Text color={isDarkmode ? themeColor.white100 : themeColor.dark} size="h2">
          Loading...
        </Text>
      </View>
    }

    {!isLoading &&
    <Layout>
      <Dialog.Container visible={dialogVisible}>
        <Dialog.Title>Error</Dialog.Title>
        <Dialog.Description>
          {error}
        </Dialog.Description>
        <Dialog.Button label="OK" onPress={closeDialog} />
    </Dialog.Container>

      <TopNav
        leftAction={() => navigation.goBack()}
        middleContent="Login"
      />
      <ScrollView>
        <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
          <SectionContent>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 10 }}>Enter an email</Text>

              <TextInput
                placeholder="Enter an email address"
                onChangeText={(value) => setData({ ...formData, username: value })}
              />
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 10 }}>
                Enter a password
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
    }
    </Layout>
  );
}