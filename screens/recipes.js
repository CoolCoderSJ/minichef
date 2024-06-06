import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, Platform } from "react-native";
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  Button, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";
import Toast from 'react-native-toast-message';
import { Client, Databases, Query, Permission, Role } from "react-native-appwrite";

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);

const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }

let userId
get("login").then(res => userId = res)

let recipeId = NaN;
let recipes = [];
let filterAllowed = []
let mealDB = []
let recipeDB = []

db.listDocuments("data", "recipes", [Query.equal("uid", [userId])]).then(function (result) {
    if (result.total > 0) {
        recipes = result.documents;
        for (let i = 0; i < recipes.length; i++) {
          filterAllowed.push(i);
        };
      }
})


export default function Recipes() {
  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const [filterList, setFilterList] = React.useState([]);
  const [mealsList, setMealsList] = React.useState([]);
  const [fields, setFields] = React.useState([{}]);

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

      db.listDocuments("data", "recipes", [Query.equal("uid", [userId])]).then(function (result) {
        if (result.total > 0) {
            recipes = result.documents;
            recipeDB = recipes;
            for (let i = 0; i < recipes.length; i++) {
              filterAllowed.push(i);
            };
          }
    })

    db.listDocuments("data", "ingredients", [Query.equal("uid", [userId])]).then(function (result) {
        if (result.total > 0) {
            mealDB = result.documents[0].items;
          }
    })

    for (let i = 0; i < mealDB.length; i++) {
        ing.push({ id: i + 1, title: mealDB[i] });
        carbFood.push(mealDB[i]);
    }

    setFilterList(ing);
    setMealsList(carbFood);
    forceUpdate()

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

        <ScrollView>
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

              <Section style={{ paddingBottom: 20, marginHorizontal: 20, marginTop: 20 }}>
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
                      <React.Fragment style={{ marginBottom: 20 }}>
                        <AutocompleteDropdown
                          textInputProps={{
                            onChangeText: e => {
                              handleChange(idx, "ing", e);
                              let meals = [];

                              if (mealDB) {
                                for (let i = 0; i < mealDB.length; i++) {
                                  if (mealDB[i].includes(e)) {
                                    meals.push({ id: String(i + 2), title: mealDB[i] });
                                  }
                                }
                              }

                              setFilterList(meals);
                              forceUpdate()
                            },
                            value: field.ing,
                            placeholder: "Ingredient Name",
                            style: {
                              color: isDarkmode ? themeColor.white : themeColor.dark,
                              backgroundColor: isDarkmode ? "#262834" : themeColor.white,
                              borderColor: isDarkmode ? "#60647e" : "#d8d8d8",
                              borderWidth: 1,
                              borderRadius: 8,
                              flexDirection: "row",
                              paddingHorizontal: 20,
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontFamily: "Ubuntu_400Regular",
                            }
                          }}

                          rightButtonsContainerStyle={{
                            backgroundColor: isDarkmode ? "#262834" : themeColor.white,
                            borderColor: isDarkmode ? "#60647e" : "#d8d8d8",
                            borderWidth: 1,
                            borderRadius: 8,
                          }}
                          suggestionsListContainerStyle={{
                            backgroundColor: isDarkmode ? "#262834" : themeColor.white,
                            color: isDarkmode ? themeColor.white : themeColor.dark,
                          }}
                          renderItem={(item, text) => (
                            <Text style={{ color: isDarkmode ? themeColor.white : themeColor.dark, padding: 15 }}>{item.title}</Text>
                          )}
                          showClear={true}
                          clearOnFocus={false}
                          closeOnBlur={false}
                          closeOnSubmit={true}
                          dataSet={filterList}
                          onClear={() => handleRemove(idx)}
                          onSelectItem={(item) => {
                            if (item) {

                              let mealObj = undefined;

                              for (let i = 0; i < mealsList.length; i++) {
                                if (mealsList[i] === item.title) {
                                  mealObj = mealsList[i]
                                  let fieldset = fields

                                  fieldset[idx]['serving'] = "1"
                                  setFields(fieldset)
                                }
                              }

                              if (!mealObj) {
                                return
                              }

                              handleChange(idx, "ing", item.title);


                              let ing = [];

                              db.listDocuments("data", "ingredients", [Query.equal("uid", [userId])]).then(function (result) {
                                for (let i = 0; i < result.documents.length; i++) {
                                  ing.push({ id: String(i + 2), title: result.documents[i] });
                                }
                                setFilterList(ing);
                              })
                            }
                          }}
                        />
                      </React.Fragment>

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