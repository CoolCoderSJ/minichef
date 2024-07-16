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
import { Client, Account, ID, Databases, Query, Permission, Role } from 'react-native-appwrite';
import Dialog from "react-native-dialog";
import RNRestart from 'react-native-restart';

// Disable warnings that aren't important
console.disableYellowBox = true;


let client;
let account;

client = new Client();
client
  .setEndpoint('https://appwrite.shuchir.dev/v1')
  .setProject('minichef')
  .setPlatform('dev.shuchir.minichef');

db = new Databases(client);
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
    let newSignup = false;

    try {
      await account.create(ID.unique(), email, password);
      newSignup = true;
    }
    catch {}

    try { 
      await account.deleteSessions();
    }
    catch {}

    try { 
      await account.createEmailPasswordSession(email, password);
      let details = await account.get();
      let userId = details['$id'];
      if (newSignup) {
        await db.createDocument("data", "recipes", ID.unique(), {
          uid: details['$id'],
          ingredients: ["Water", "Tea", "Milk"],
          serving_units: ["cups", "spoons", "(estimate by color)"],
          serving_amt: [0.5, 2, 0],
          steps: ['Add the water to a pan and bring it to a boil.', 'Add the tea leaves and let it steep for a few minutes.', 'Add the milk and bring it to a boil again.', 'Strain the tea into drinking cups. Enjoy!'],
          name: "Milk Tea",
          servings: 2
        }, [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]);
        
        let data = {
          name: "Sample List", 
          items: [
            {
              src: "Milk Tea",
              items: [
                "0.5 cups water",
                "2 spoons tea",
                "milk"
              ]
            },
            {
              src: "Other",
              items: [
                "5 apples",
                "1 cup sugar",
                "1 cup flour"
              ]
            }
          ]
        }
        await db.createDocument("data", "grocery", ID.unique(), {uid: userId, items: JSON.stringify(data)}, [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ])
      }
      console.log("DETAILS", details)
      setPlain("login", details['$id'])
      setLoading(false)
      RNRestart.restart();
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
    <View>
      <Dialog.Container visible={dialogVisible}>
        <Dialog.Title>Error</Dialog.Title>
        <Dialog.Description>
          {error}
        </Dialog.Description>
        <Dialog.Button label="OK" onPress={closeDialog} />
    </Dialog.Container>
      <ScrollView>

        <Section style={{ marginHorizontal: 20 }}>
          <SectionContent>
            <View>
              <Text>If you don't have an account, one will be made for you upon logging in.</Text>
            </View>
          </SectionContent>
        </Section>

        <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
          <SectionContent>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 10 }}>Enter an email</Text>

              <TextInput
                placeholder="Enter an email address"
                onChangeText={(value) => setData({ ...formData, username: value })}
                keyboardType="email-address"
                inputMode="email"
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 10 }}>
                Enter a password
              </Text>

              <TextInput
                placeholder="Enter your password"
                onChangeText={(value) => setData({ ...formData, password: value })}
                secureTextEntry={true}
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
    </View>
    }
    </Layout>
  );
}