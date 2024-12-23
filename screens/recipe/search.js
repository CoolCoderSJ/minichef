import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, Platform, Dimensions, Image, Linking } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  Button, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";
import Toast from 'react-native-toast-message';
import { Client, Databases, Functions, Storage, Permission, Role, ID } from "react-native-appwrite";
import _, { set, update } from 'lodash';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);
const functions = new Functions(client);
const storage = new Storage(client);

const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
console.disableYellowBox = true;


let recipes = [];
let searchText = "";

let userId
get("login").then(res => userId = res)

export default function SearchRecipes () {
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
          middleContent="Search Recipes"
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
                  placeholder="Enter meal to search..."
                  leftContent={
                    <Ionicons
                      name="search-circle"
                      size={20}
                      color={themeColor.gray300}
                    />
                  }
                  onChangeText={e => {
                    searchText = e;
                    forceUpdate();
                  }}
                />

                <Button
                    text="Search"
                    status="primary"
                    leftContent={
                        <Ionicons
                        name="search"
                        size={20}
                        color={themeColor.white}
                        />
                    }
                    type="TouchableOpacity"
                    style={{ marginVertical: 20 }}
                    onPress={async () => {
                        Toast.show({
                        type: 'info',
                        text1: 'Loading...',
                        })
    
                        let result = await functions.createExecution(
                        'search',
                        searchText,
                        false
                        )

                        recipes = JSON.parse(result.responseBody).hits
                        // console.log(recipes) 
                        forceUpdate()
                    }}
                />
              </View>

                {recipes.map((recipe, idx) => {
                    return (
                        <View>
                        <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                          <SectionContent>
                          {recipe &&
                            <>
                              <Image source={{
                                uri: recipe.recipe.image
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
                              <Text fontWeight="medium" style={{ fontSize: 35, marginVertical: 12, textAlign: "center", textTransform: "capitalize" }}>{recipe.recipe.label}</Text>
                                <Text style={{ fontSize: 20, textAlign: "center", color: themeColor.white400 }}>{recipe.recipe.source}</Text>
                            </View>

                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Button
                                    text="View Recipe"
                                    status="primary"
                                    onPress={() => Linking.openURL(recipe.recipe.url)}
                                />
                                <Button
                                    text="Save Recipe"
                                    status="primary"
                                    onPress={async () => {
                                        Toast.show({
                                            type: 'info',
                                            text1: 'Saving...',
                                            autoHide: false
                                        })

                                        let ingredients = []
                                        let serving_amt = []
                                        let serving_units = []

                                        for (let j = 0; j < recipe.recipe.ingredients.length; j++) {
                                        ingredients.push(recipe.recipe.ingredients[j].food)
                                        serving_amt.push(Number(recipe.recipe.ingredients[j].quantity))
                                        serving_units.push(recipe.recipe.ingredients[j].measure)
                                        }

                                        const exec = await functions.createExecution(
                                            'upload-from-url',
                                            JSON.stringify({url: recipe.recipe.image, userId: userId}),
                                            false
                                        )
                                        let fileId = exec.responseBody
                                        // console.log(fileId)

                                        const continueWithoutAccount = await AsyncStorage.getItem('continueWithoutAccount');
                                        if (continueWithoutAccount) {
                                            let localRecipes = await AsyncStorage.getItem('recipeData');
                                            localRecipes = localRecipes ? JSON.parse(localRecipes) : [];
                                            console.log("LOCAL", localRecipes)
                                            localRecipes.push({
                                                ingredients: ingredients,
                                                serving_units: serving_units,
                                                serving_amt: serving_amt,
                                                steps: ["This recipe was imported from a website. Please view the original recipe for instructions."],
                                                name: recipe.recipe.label,
                                                servings: Number(recipe.recipe.yield),
                                                link: recipe.recipe.url,
                                                image: recipe.recipe.image,
                                                stepImages: [],
                                                recipeId: uuidv4() // Generate a unique ID
                                            });
                                            await AsyncStorage.setItem('recipeData', JSON.stringify(localRecipes));
                                            Toast.show({
                                                type: 'success',
                                                text1: 'Recipe saved locally!',
                                            });
                                            navigation.navigate("AllRecipes");
                                        } else {
                                            let data = {
                                                uid: userId,
                                                ingredients: ingredients,
                                                serving_units: serving_units,
                                                serving_amt: serving_amt,
                                                steps: ["This recipe was imported from a website. Please view the original recipe for instructions."],
                                                name: recipe.recipe.label,
                                                servings: Number(recipe.recipe.yield),
                                                link: recipe.recipe.url,
                                                imageId: fileId,
                                                stepImages: []
                                            }

                                            // console.log(data)

                                            await db.createDocument("data", "recipes", ID.unique(), data, [
                                                Permission.read(Role.user(userId)),
                                                Permission.write(Role.user(userId)),
                                                Permission.update(Role.user(userId)),
                                                Permission.delete(Role.user(userId)),
                                            ])
                                            Toast.show({
                                                type: 'success',
                                                text1: 'Recipe saved!',
                                            })
                                            navigation.navigate("AllRecipes")
                                        }
                                    }}
                                />
                            </View>
                          </SectionContent>
                        </Section>
                      </View>
                    )
                })}

            </View>

        </ScrollView>
      </Layout>
      <Toast />
    </KeyboardAvoidingView>

  );
}
