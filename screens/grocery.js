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
import { createStackNavigator } from "@react-navigation/stack";
import { Client, Databases, Query, Permission, Role, ID, Functions, ExecutionMethod } from "react-native-appwrite";
import Toast from 'react-native-toast-message';

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);
console.disableYellowBox = true;


const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
const delkey = async (key, value) => { try { await AsyncStorage.removeItem(key) } catch (e) { console.log(e) } }
const getAll = async () => { try { const keys = await AsyncStorage.getAllKeys(); return keys } catch (error) { console.error(error) } }

let lists = []


let userId
get("login").then(res => userId = res)
.then(() => {
db.listDocuments("data", "grocery", [Query.equal("uid", [userId])]).then(function (result) {
    if (result.total > 0) {
        for (let i = 0; i < result.documents.length; i++) {
            let doc = JSON.parse(result.documents[i].items)
            doc.createdAt = result.documents[i].$createdAt
            let arr = new Date(doc.createdAt).toDateString().split(" ")
            doc.createdAt = `${arr[1]} ${arr[2]} ${arr[3]}`
            lists.push(doc)
        };
    }
})
})

function Grocery () {

  const navigation = useNavigation();
  const { isDarkmode, setTheme } = useTheme();
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


  React.useEffect(() => {
    Toast.show({
        type: 'info',
        text1: 'Loading...',
    })

    const updateData = async () => {
        lists = []
        let result = await db.listDocuments("data", "grocery", [Query.equal("uid", [userId])])
        if (result.total > 0) {
            for (let i = 0; i < result.documents.length; i++) {
                console.log(result.documents[i].items)
                let doc = JSON.parse(result.documents[i].items)
                doc.createdAt = result.documents[i].$createdAt
                let arr = new Date(doc.createdAt).toDateString().split(" ")
                doc.createdAt = `${arr[1]} ${arr[2]} ${arr[3]}`
                lists.push(doc)
            };
        }
    }

    const refreshData = navigation.addListener('focus', () => {
      updateData().then(() => {Toast.hide(); forceUpdate()});
    })
    return refreshData;
  }, [navigation]);

  return (
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
            middleContent="Grocery Lists"
        />
        <ScrollView>
        
        <Button
            text="Create New List"
            status="primary"
            style={{ margin: 20 }}
            onPress={() => navigation.navigate("Create Grocery List")}
        />

          {lists.map((list, idx) => {
            return (
                <TouchableOpacity key={idx} onPress={() => navigation.navigate("Grocery List", {idx})}>
                    <View style={styles.listItem}>
                    <Text fontWeight="medium">{list.name}</Text>
                    <View style={{ flexDirection: "row", gap: 4 }}>
                        <Text italic={true}>{list.createdAt}</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={isDarkmode ? themeColor.white : themeColor.black}
                        />
                    </View>
                    </View>
                </TouchableOpacity>
            )
          })}
        </ScrollView>

        <Toast />
      </Layout>
  );
}


const GroceryStack = createStackNavigator();

import ViewGrocery from './view_grocery';
import CreateGrocery from './create_grocery';

export default function GMain() {
    return (
      <GroceryStack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerShown: false,
        }}
      >
        <GroceryStack.Screen name="Main" component={Grocery} />
        <GroceryStack.Screen name="Grocery List" component={ViewGrocery} />
        <GroceryStack.Screen name="Create Grocery List" component={CreateGrocery} />

      </GroceryStack.Navigator>
    );
  }