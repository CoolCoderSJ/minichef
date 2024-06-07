import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, Platform, Dimensions } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  Button, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";
import Toast from 'react-native-toast-message';
import { Client, Databases, Query, Permission, Role } from "react-native-appwrite";

import Autocomplete from '../components/autocomplete';

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);

const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }


let recipeId = NaN;
let recipes = [];
let filterAllowed = []
let mealDB = []
let recipeDB = []

let userId
get("login").then(res => userId = res)
.then(() => {
db.listDocuments("data", "recipes", [Query.equal("uid", [userId])]).then(function (result) {
    if (result.total > 0) {
        recipes = result.documents;
        for (let i = 0; i < recipes.length; i++) {
          filterAllowed.push(i);
        };
      }
})
})


export default function Recipes() {
  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [mealsList, setMealsList] = React.useState([]);
  const [fields, setFields] = React.useState([{}]);
  const [filterList, setFilterList] = React.useState([{}]);

  const [servingSizes, setServingSizes] = React.useState({});

  const [showMealEditor, setShowMealEditor] = React.useState(false);


  const fetchMeals = () => {
    if (recipeId > recipes.length - 1) {
      recipes.push({
        name: "",
        ing: []
      })
    }

    if (recipes[recipeId]) {
      setFields(recipes[recipeId]['ing']);
    }

    setShowMealEditor(true)
    forceUpdate()

  }

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


  function handleChange(i, type, value) {

    if (value == null || value == undefined) {
      return
    }

    const values = [...fields];
    values[i][type] = value;
    setFields(values);

    recipes[recipeId]['ing'] = values;
  }

  function handleAdd() {
    const values = [...fields];
    values.push({ ing: null });
    setFields(values);
    recipes[recipeId]['ing'] = values;
    filterAllowed.push(values.length - 1);
  }

  function handleRemove(i) {
    const values = [...fields];
    values.splice(i, 1);
    setFields(values);
    recipes[recipeId]['ing'] = values;
  }

  React.useEffect(() => {
    Toast.show({
        type: 'info',
        text1: 'Loading...',
    })

    const setDropDownList = () => {
      let ing = [];
      let carbFood = [];

      console.log("start")

      db.listDocuments("data", "recipes", [Query.equal("uid", [userId])]).then(function (result) {
        console.log("recipes", result)
        if (result.total > 0) {
            recipes = result.documents;
            recipeDB = recipes;
            for (let i = 0; i < recipes.length; i++) {
              filterAllowed.push(i);
            };
          }
    })

    console.log("recipes", recipes)

    db.listDocuments("data", "ingredients", [Query.equal("uid", [userId])]).then(function (result) {
      console.log("ingredients", result)
        if (result.total > 0) {
            mealDB = result.documents[0].items;
          }
    })
    .then(() => {

    for (let i = 0; i < mealDB.length; i++) {
        ing.push({ id: String(i + 1), title: mealDB[i] });
        carbFood.push(mealDB[i]);
    }

    console.log("ing", ing)
    console.log("carbFood", carbFood)
  })
  .then (() => {
    let filter = []
    for (let i = 0; i < carbFood.length; i++) {
      filter.push(carbFood[i]);
    }
    setFilterList(filter);
    setMealsList(carbFood);
  })
  .then (() => {
    console.log(filterList)
    forceUpdate()
    })
    };

    const refreshData = navigation.addListener('focus', () => {
      setDropDownList();
      setShowMealEditor(false);
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
          >
          {!showMealEditor &&
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
                        <TouchableOpacity onPress={() => { recipeId = idx; fetchMeals() }}>
                          <View style={styles.listItem}>
                            <Text fontWeight="medium">{recipe.name}</Text>
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={isDarkmode ? themeColor.white : themeColor.black}
                            />
                          </View>
                        </TouchableOpacity>
                        <Button
                          style={{ marginTop: 10, marginHorizontal: 20, marginBottom: 20 }}
                          leftContent={
                            <Ionicons name="trash-outline" size={20} color={themeColor.white} />
                          }
                          text="Remove this recipe"
                          status="danger"
                          type="TouchableOpacity"
                          onPress={() => { recipes.splice(idx, 1); forceUpdate() }}
                        />
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
                onPress={() => {
                  recipeId = recipes.length;
                  fetchMeals();
                }}
              />
            </View>
          }


          {showMealEditor &&
            <View>

              <View style={{ paddingBottom: 20 }}>
                <Button style={{ marginHorizontal: 20, marginVertical: 10 }} status="primary" text="All Recipes" onPress={() => {
                  for (let i = 0; i < recipes.length; i++) {
                    if (recipes[i]['name'] == "") {
                      recipes.splice(i, 1);
                    }
                  }

                  setShowMealEditor(false)
                }} />
              </View>

              <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ marginBottom: 20 }}>
                    <TextInput
                      onChangeText={(value) => {
                        recipes[recipeId]['name'] = value;
                      }}
                      defaultValue={recipes[recipeId]['name']}
                      placeholder="Recipe Name"
                    />
                  </View>

                  <View style={{ marginBottom: 20 }}>
                    <TextInput
                      onChangeText={(value) => {
                        recipes[recipeId]['serving'] = value;
                      }}
                      defaultValue={recipes[recipeId]['serving']}
                      placeholder="Servings"
                    />
                  </View>
                </SectionContent>
              </Section>

              {fields.map((field, idx) => {
                return (
                  <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
                    <SectionContent>
                      <View>
                      <Autocomplete 
                      data={filterList} 
                      placeholder="Start typing to search ingredients..." 
                      value={field.ing}
                      onSelect={(item) => {
                        if (item) {

                          let mealObj = undefined;

                          for (let i = 0; i < mealsList.length; i++) {
                            if (mealsList[i] === item) {
                              mealObj = mealsList[i]
                              let fieldset = fields

                              fieldset[idx]['serving'] = "1"
                              setFields(fieldset)
                            }
                          }

                          if (!mealObj) {
                            return
                          }

                          handleChange(idx, "ing", item);
                        }
                      }}
                      />
                      </View>

                      <View style={{ marginVertical: 20 }}>
                        <TextInput
                          placeholder="Serving Size"
                          onChangeText={e => {
                            handleChange(idx, "serving", e)
                          }}
                          defaultValue={field.serving}
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={{ marginBottom: 20 }}>
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
                );
              })}

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
            </View>
          }

        </ScrollView>
      </Layout>
    </KeyboardAvoidingView>

  );
}