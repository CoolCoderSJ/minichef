// Import the libraries needed
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import {
  KeyboardAvoidingView, ScrollView,
  View, Platform
} from "react-native";
import {
  Button, Layout, Section, SectionContent, TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";
import Toast from 'react-native-toast-message';
import { Client, Databases, Query, Permission, Role } from "react-native-appwrite";

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);

// Initialize the database functions
const set = async (key, value) => { try { await AsyncStorage.setItem(key, value) } catch (e) { console.log(e) } }
const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }

// Initialize the variables
let filterAllowed = []
let userId
get("login").then(res => userId = res)
    
export default function Ingredients () {
    console.log(userId)
    
  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const navigation = useNavigation();
  const { isDarkmode, setTheme } = useTheme();
  const [fields, setFields] = React.useState([]);

  React.useEffect(() => {
    Toast.show({
      type: 'info',
      text1: 'Loading...'
    })
    db.listDocuments("data", "ingredients", [Query.equal("uid", [userId])]).then(function (result) {
    console.log("RESULT", result)

     if (!result.total == 0) {

      let ing = result.documents[0].items;
      let fieldsToSet = []

      for (let i = 0; i < ing.length; i++) {
        fieldsToSet.push(ing[i]);
        filterAllowed.push(i);
      }
      setFields(fieldsToSet);
      Toast.hide()
    }
    });
  }, []);

  function handleChange(i, value) {
    console.log(i, value)

    // Update the state
    const values = [...fields];
    values[i] = value;
    setFields(values);

    console.log("updated field")
  }

  function handleAdd() {
    const values = [...fields];
    values.push(null);
    setFields(values);
    let idx = fields.length - 1;
    if (idx < 0) idx = 0
    filterAllowed.push(idx);
    forceUpdate();
  }

  function handleRemove(i) {
    const values = [...fields];
    values.splice(i, 1);
    setFields(values);
  }

  async function save() {
    Toast.show({
      type: 'info',
      text1: 'Saving...',
    });

    const docs = await db.listDocuments("data", "ingredients", [Query.equal("uid", [userId])]);
    if (docs.total == 0) {
      await db.createDocument("data", "ingredients", userId, {uid: userId, items: [...fields]}, [
        Permission.read(Role.user(userId)),
        Permission.write(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]);
      Toast.show({
        type: 'success',
      text1: 'Saved successfully!',
      });
    } 

    else {
      await db.updateDocument("data", "ingredients", userId, {items: [...fields]})
      Toast.show({
        type: 'success',
        text1: 'Saved successfully!',
      });
    }
  }


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >

      <Layout>
        <TopNav
          leftContent={
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDarkmode ? themeColor.white : themeColor.black}
            />
          }
          leftAction={() => navigation.goBack()}
          middleContent="Ingredients"
        />
        <ScrollView>
          <View
            style={{
              marginHorizontal: 20,
              marginVertical: 20,
            }}
          >
            <TextInput
              placeholder="Search..."
              leftContent={
                <Ionicons
                  name="search-circle"
                  size={20}
                  color={themeColor.gray300}
                />
              }
              onChangeText={e => {
                let values = [...fields];
                let allowed = []
                for (let i = 0; i < values.length; i++) {
                  console.log(i, values[i])
                  if (values[i].toLowerCase().includes(e.toLowerCase())) {
                    allowed.push(i);
                  }
                }

                filterAllowed = allowed;
                forceUpdate();
              }}
            />
          </View>

          {
            fields.map((field, idx) => {
              return (
                <View>
                  {filterAllowed.includes(idx) &&

                    <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
                      <SectionContent>
                        <View style={{ marginBottom: 20 }}>
                          <TextInput
                            placeholder="Ingredient name"
                            onChangeText={e => handleChange(idx, e)}
                            defaultValue={field}
                          />
                        </View>

                        <View>
                          <Button
                            style={{ marginTop: 10 }}
                            leftContent={
                              <Ionicons name="trash-outline" size={20} color={themeColor.white} />
                            }
                            text="Remove"
                            status="danger"
                            type="TouchableOpacity"
                            onPress={() => { handleRemove(idx) }}
                          />
                        </View>
                      </SectionContent>
                    </Section>
                  }
                </View>
              )
            })
          }
          <Button
            style={{ marginVertical: 10, marginHorizontal: 20 }}
            leftContent={
              <Ionicons name="add-circle-outline" size={20} color={themeColor.white} />
            }
            text="Add New Ingredient"
            status="primary"
            type="TouchableOpacity"
            onPress={handleAdd}
          />
          <Button
            style={{ marginVertical: 10, marginHorizontal: 20 }}
            leftContent={
              <Ionicons name="save-outline" size={20} color={themeColor.white} />
            }
            text="Save"
            color="#0b4276"
            type="TouchableOpacity"
            onPress={save}
          />
        </ScrollView>
      </Layout>

      <Toast />
    </KeyboardAvoidingView>
  );
}