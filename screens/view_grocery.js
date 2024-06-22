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
  themeColor, TopNav, useTheme,
  Section, SectionContent
} from "react-native-rapi-ui";
import { Client, Databases, Query, Permission, Role, ID, Functions, ExecutionMethod } from "react-native-appwrite";
import Toast from 'react-native-toast-message';

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);


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
            doc.$id = result.documents[i].$id
            let arr = new Date(doc.createdAt).toDateString().split(" ")
            doc.createdAt = `${arr[1]} ${arr[2]} ${arr[3]}`
            lists.push(doc)
        };
    }
})
})

export default function ViewGrocery ({ navigation, route }) {

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
                    doc.$id = result.documents[i].$id
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

  const delGrocery = () => {
    Alert.alert(
      "Delete Grocery List",
      "Are you sure you want to delete this grocery list?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { text: "Delete", onPress: () => {
          if (!lists[route.params.idx]) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Lists still loading. Try again later.'
            })
            return
          }

          db.deleteDocument("data", "grocery", lists[route.params.idx].$id).then(() => {
            Toast.show({
              type: 'success',
              text1: 'Deleted',
              text2: 'Grocery list has been deleted'
            })
            navigation.goBack()
          })
        } }
      ],
      { cancelable: false }
    );
  }

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
            middleContent={lists[route.params.idx] ? lists[route.params.idx].name : "Loading list..."}
        />
        <ScrollView>

          <View style={{ paddingBottom: 20 }}>
              <Button
              style={{ marginVertical: 10, marginHorizontal: 20 }}
              leftContent={
                  <Ionicons name="trash-outline" size={20} color={themeColor.danger} />
              }
              text="Delete List"
              status='danger'
              type="TouchableOpacity"
              outline={true}
              onPress={delGrocery}
              />
          </View>
    

          {lists[route.params.idx] ? lists[route.params.idx].items.map((grp, idx) => {
            return (
                <>
                <Text style={{ fontSize: 25, fontWeight: "bold", marginHorizontal: 30, marginTop: 40, marginBottom: 5, textAlign: "center" }}>{grp.src}</Text>

                <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                    <View style={{ marginBottom: 20 }}>
                    {grp.items.map((item, idx) => {
                        return (
                        <View style={{ marginHorizontal: 20, marginTop: 15 }}>
                            <Text style={{ fontSize: 18.5 }}>{item}</Text>
                        </View>
                        )
                    })}
                    </View>
                </SectionContent>
                </Section>
                </>
            )
          }) : ""}
        </ScrollView>

        <Toast />
      </Layout>
  );
}