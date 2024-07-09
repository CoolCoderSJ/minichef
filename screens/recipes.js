import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, Platform, Dimensions, Image } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  Button, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";
import Toast from 'react-native-toast-message';
import { Client, Databases, Query, Storage } from "react-native-appwrite";
import _, { set, update } from 'lodash';

import { createStackNavigator } from '@react-navigation/stack';

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);
const storage = new Storage(client);

const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
console.disableYellowBox = true;


let recipes = [];
let filterAllowed = []
let AIUrl = null;

let userId
get("login").then(res => userId = res)
.then(() => {
db.listDocuments("data", "recipes", [Query.equal("uid", [userId])]).then(function (result) {
    if (result.total > 0) {
        for (let i = 0; i < result.documents.length; i++) {
          let ing = []
          for (let j = 0; j < result.documents[i].ingredients.length; j++) {
            ing.push({
              ing: result.documents[i].ingredients[j],
              serving_amt: result.documents[i].serving_amt[j],
              serving_unit: result.documents[i].serving_units[j]
            });
          }
          recipes.push({
            name: result.documents[i].name,
            ing: ing,
            steps: result.documents[i].steps,
            serving: result.documents[i].servings,
            recipeId: result.documents[i]['$id'],
            imageId: result.documents[i].imageId
          })
          filterAllowed.push(i);
        };
      }
})
})


function Recipes() {
  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);


  const styles = StyleSheet.create({
    input: {
      height: 40,
      borderWidth: 1,
      padding: 10,
      borderRadius: 5,
      marginBottom: 5,
    },
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


  const updateData = async () => {
    console.log("start")

    db.listDocuments("data", "recipes", [Query.equal("uid", [userId])]).then(function (result) {
      console.log("recipes", result)
      recipes = []
      for (let i = 0; i < result.documents.length; i++) {
        let ing = []
        for (let j = 0; j < result.documents[i].ingredients.length; j++) {
          ing.push({
            ing: result.documents[i].ingredients[j],
            serving_amt: result.documents[i].serving_amt[j],
            serving_unit: result.documents[i].serving_units[j]
          });
        }
        recipes.push({
          name: result.documents[i].name,
          ing: ing,
          steps: result.documents[i].steps,
          serving: result.documents[i].servings,
          recipeId: result.documents[i]['$id'],
          imageId: result.documents[i].imageId
        })
      };
  }).then(() => {
    forceUpdate()
  })

  console.log("recipes", recipes)

  forceUpdate()
  };

  React.useEffect(() => {
    updateData();
  }, [])

  React.useEffect(() => {
    Toast.show({
        type: 'info',
        text1: 'Loading...',
    })

    const refreshData = navigation.addListener('focus', () => {
      console.log("REFRESHING")
      updateData().then(() => {
        Toast.hide()
        forceUpdate()
      })
    })
    return refreshData;
  }, [navigation]);


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
          middleContent="Recipes"
        />

        <ScrollView 
          nestedScrollEnabled
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            flexGrow: 1
          }}
          >
            <View>
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
                    let values = recipes;
                    let allowed = []
                    for (let i = 0; i < values.length; i++) {
                      if (values[i].name.toLowerCase().includes(e.toLowerCase())) {
                        allowed.push(i);
                      }
                    }
                    filterAllowed = allowed;
                    forceUpdate();
                  }}
                />
              </View>

              {recipes.map((recipe, idx) => {
                return (
                  <View>
                    {filterAllowed.includes(idx) &&
                      <View>
                        <TouchableOpacity onPress={() => navigation.navigate("View Recipe", { idx })}>
                        <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                          <SectionContent>
                          {recipe &&
                            <>
                              <Image source={{
                                uri: recipe.imageId ? storage.getFileView("images", recipe.imageId).toString() : "https://sharex.shuchir.dev/u/YIQCWq.png"
                              }}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                              }}
                              />

                              <View style={{
                                backgroundColor: "rgba(0,0,0,0.3)",
                                position: "absolute",
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0
                              }}></View>
                            </>
                            }
                            
                            <View style={{ marginBottom: 20 }}>
                              <Text fontWeight="medium" style={{ fontSize: 35, marginVertical: 12, textAlign: "center", textTransform: "capitalize" }}>{recipe.name}</Text>
                            </View>
                          </SectionContent>
                        </Section>
                        </TouchableOpacity>
                      </View>
                    }
                  </View>
                )
              }
              )}
              <Button
                style={{ marginVertical: 10, marginHorizontal: 20 }}
                leftContent={
                  <Ionicons name="add-circle-outline" size={20} color={themeColor.white} />
                }
                text="Add New Recipe"
                status="primary"
                type="TouchableOpacity"
                onPress={() => navigation.navigate("Create Recipe")}
              />

                <View style={{ flexDirection: "row", height: "fit-content", marginTop: 25, gap: 24 }}>
                <View style={{ marginLeft: 20, marginVertical: 10, flex: 10, width: "100%" }}>
                  <TextInput
                    placeholder="Import from URL..."
                    onChangeText={e => {
                      console.log("CHANGED", e)
                      AIUrl = e
                      console.log(AIUrl)
                    }}
                  />
                </View>
                <Button
                style={{ marginVertical: 10, marginRight: 20, flex: 1, width: "fit-content" }}
                text={
                  <Ionicons name="arrow-down-circle-outline" size={20} color={themeColor.white} />
                }
                status="primary"
                type="TouchableOpacity"
                onPress={() => {
                  Toast.show({
                    type: 'info',
                    text1: 'Importing... (this may take a while)',
                    autoHide: false
                  })
                
                  functions.createExecution(
                    'import',
                    `{
                      "url": "${AIUrl}",
                      "userId": "${userId}"
                    }`,
                    true
                  ).then(result => {
                    let completed = false
                    console.log("initial", result)
                    setInterval(() => {
                      if (!completed) {
                      functions.getExecution("import", result.$id).then(res => {
                        console.log(res)
                        if (res.status == "completed") {
                          completed = true
                          console.log("COMPLETED", res)
                          res = res.responseBody
                          Toast.hide()
                          updateData()
                          updateIngredients()
                          forceUpdate()
                          Toast.show({
                            type: "success",
                            text1: "Imported!",
                            text2: "Successfully imported recipe."
                          })
                        }
                        else if (res.status == "failed") {
                          completed = true
                          console.log("FAILED", res)
                          Toast.hide()
                          Toast.show({
                            type: "error",
                            text1: "Error importing recipe. Please try again or try a different recipe."
                          })
                        }
                      })
                    }
                    }, 500)
                  })
                  .catch(err => {
                    console.error(err)
                    Toast.hide()
                    Toast.show({
                      type: "error",
                      text1: "Error processing result. Please try again or try a different recipe."
                    })
                  })

                }}
              />
              </View>

            </View>

        </ScrollView>
      </Layout>
      <Toast />
    </KeyboardAvoidingView>

  );
}

const RecipeStack = createStackNavigator();

import CreateRecipe from './recipe/create';
import ViewRecipe from './recipe/view';
import EditRecipe from './recipe/edit';
import Walkthrough from './recipe/walkthrough';

export default function RMain() {
  return (
    <RecipeStack.Navigator
      initialRouteName="AllRecipes"
      screenOptions={{
        headerShown: false,
      }}
    >
      <RecipeStack.Screen name="AllRecipes" component={Recipes} />
      <RecipeStack.Screen name="Create Recipe" component={CreateRecipe} />
      <RecipeStack.Screen name="View Recipe" component={ViewRecipe} />
      <RecipeStack.Screen name="Edit Recipe" component={EditRecipe} />
      <RecipeStack.Screen name="Walkthrough" component={Walkthrough} />

    </RecipeStack.Navigator>
  );
}