import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import {
  Button, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";
import { Client, Account, Functions, Databases, Query } from 'react-native-appwrite';
import Dialog from "react-native-dialog";
import Toast from 'react-native-toast-message';
import { TouchableOpacity } from "react-native-gesture-handler";

console.disableYellowBox = true;

let client;
let account;

client = new Client();
client
  .setEndpoint('https://appwrite.shuchir.dev/v1')
  .setProject('minichef')
  .setPlatform('com.shuchir.minichef');

account = new Account(client);
const functions = new Functions(client);
const db = new Databases(client);

const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
const delkey = async (key, value) => { try { await AsyncStorage.removeItem(key) } catch (e) { console.log(e) } }

let continueWithoutAccount;
get('continueWithoutAccount').then(res => {continueWithoutAccount = res})


export default Settings = () => {

  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize state
  const [formData, setData] = React.useState({});
  const [error, setError] = React.useState('');
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [deleteVisible, setDeleteVisible] = React.useState(false);  
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

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

  const closeDialog = () => {
    setDialogVisible(false)
  }

  const closeDelete = () => {
    setDeleteVisible(false)
  }

  const initiateDelete = () => {
    setDeleteVisible(true)
  }

  const deleteAccount = async () => {
    const continueWithoutAccount = await AsyncStorage.getItem('continueWithoutAccount');
    if (continueWithoutAccount) {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
      Toast.show({
        type: 'success',
        text1: 'Local data cleared successfully!'
      });
      navigation.navigate('login');
    } else {
      get("login").then(res => {
        Toast.show({
            type: 'info',
            text1: 'Deleting data...'
        })
        let userId = res
        db.listDocuments("data", "recipes", [Query.equal("uid", [userId])]).then(function (result) {
            result.documents.forEach(doc => {
                db.deleteDocument("data", "recipes", doc["$id"])
            })
        })

        db.listDocuments("data", "ingredients", [Query.equal("uid", [userId])]).then(function (result) {
            result.documents.forEach(doc => {
                db.deleteDocument("data", "ingredients", doc["$id"])
            })
        })

        Toast.show({
            type: 'info',
            text1: 'Deleting account...'
        })

        functions.createExecution(
            'deleteUser',
            userId,
            true
        ).then(function (result) {
            delkey("login").then(() => {
                Toast.hide()
                navigation.navigate('login')
                Toast.show({
                    type: 'success',
                    text1: 'Account deleted successfully!'
                })
            })
        })
      })
    }
  }


  async function changePassw () {
    try {
        Toast.show({
            type: 'info',
            text1: 'Changing password...'
        })
        await account.updatePassword(
            formData.newPass,
            formData.oldPass
        );
        Toast.hide()
        Toast.show({
            type: 'success',
            text1: 'Password changed successfully!'
        })
    }
    catch (err) {
        setError(err.message)
        setDialogVisible(true)
    }
  }

  return (
    <Layout>
      <Dialog.Container visible={dialogVisible}>
        <Dialog.Title>Error</Dialog.Title>
        <Dialog.Description>
          {error}
        </Dialog.Description>
        <Dialog.Button label="OK" onPress={closeDialog} />
    </Dialog.Container>

    <Dialog.Container visible={deleteVisible}>
        <Dialog.Title>{continueWithoutAccount ? 'Clear Data' : 'Delete Account'}</Dialog.Title>
        <Dialog.Description>
          {continueWithoutAccount ? 'Are you sure you want to clear your local data? This action is irreversible.' : 'Are you sure you want to delete your account? This action is irreversible.'}
        </Dialog.Description>
        <Dialog.Button label="Cancel" onPress={closeDelete} />
        <Dialog.Button label={continueWithoutAccount ? 'Clear Data' : 'Delete Account'} onPress={deleteAccount} />
    </Dialog.Container>

      <TopNav
        leftContent={
            <Ionicons
            name="chevron-back"
            size={20}
            color={isDarkmode ? themeColor.white : themeColor.black}
            />
        }
        leftAction={() => navigation.goBack()}
        middleContent="Settings"
      />
      <ScrollView>
        {!continueWithoutAccount && 
        <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
          <SectionContent>
            <View>
                <Text size="h3" style={{ marginBottom: 40, marginTop: 10, textAlign: "center" }}>Change Your Password</Text>
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 10 }}>Old Password</Text>

              <TextInput
                placeholder="Enter your old password"
                onChangeText={(value) => setData({ ...formData, oldPass: value })}
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
              <Text style={{ marginBottom: 10 }}>
                New Password
              </Text>

              <TextInput
                placeholder="Enter a new password"
                onChangeText={(value) => setData({ ...formData, newPass: value })}
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
                text="Change"
                status="primary"
                type="TouchableOpacity"
                onPress={changePassw}
              />
            </View>
          </SectionContent>
        </Section>
        }

        <Button
            style={{ marginTop: 20, marginHorizontal: 20 }}
            text={continueWithoutAccount ? 'Clear Data and Logout' : 'Delete Account'}
            status="danger"
            type="TouchableOpacity"
            onPress={initiateDelete}
            />

          {!continueWithoutAccount &&
          <TouchableOpacity style={{ marginTop: 50 }} onPress={() => {
            // Delete the login information, then go back to login
            delkey("login").then(() => { navigation.navigate("Welcome"); forceUpdate() })
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
        }
          
      </ScrollView>

      <Toast />
    </Layout>
  );
}