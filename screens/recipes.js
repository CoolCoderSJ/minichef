import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, Platform, Dimensions, BackHandler } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  Button, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";
import Toast from 'react-native-toast-message';
import { Client, Databases, Query, Permission, Role, ID, Functions, ExecutionMethod } from "react-native-appwrite";
import _ from 'lodash';

import Autocomplete from '../components/autocomplete';
import Dialog from "react-native-dialog";

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);
const functions = new Functions(client);

const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }


let recipeId = NaN;
let currentRecipe = null;
let recipes = [];
let filterAllowed = []
let mealDB = []
let currentIndex = 0;
let AIUrl = null;

console.log(Permission.read(Role.user(userId)),
Permission.write(Role.user(userId)))

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
            recipeId: result.documents[i]['$id']
          })
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
  const [steps, setSteps] = React.useState([{}]);
  const [filterList, setFilterList] = React.useState([{}]);
  const [servings, setServings] = React.useState(null);

  const [showMealEditor, setShowMealEditor] = React.useState(false);
  const [showRecipePage, setshowRecipePage] = React.useState(false);
  const [showWalkthrough, setShowWalkthrough] = React.useState(false);

  const [deleteVisible, setDeleteVisible] = React.useState(false);
  const [recipeIDToDel, setRIDTD] = React.useState(null)


  const fetchMeals = () => {
    if (recipeId > recipes.length - 1) {
      recipes.push({
        name: "",
        serving: "",
        ing: [],
        steps: [],
        recipeId: ID.unique()
      })
    }

    if (recipes[recipeId]) {
      setFields(recipes[recipeId]['ing']);
      setSteps(recipes[recipeId]['steps']);
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

  function handleAddIng() {
    const values = [...fields];
    values.push({ ing: null });
    setFields(values);
    recipes[recipeId]['ing'] = values;
  }

  function handleRemoveIng(i) {
    const values = [...fields];
    values.splice(i, 1);
    setFields(values);
    recipes[recipeId]['ing'] = values;
  }

  function handleChangeStep(i, value) {

    if (value == null || value == undefined) {
      return
    }

    const values = [...steps];
    values[i] = value;
    setSteps(values);

    recipes[recipeId]['steps'] = values;
  }

  function handleAddStep() {
    const values = [...steps];
    values.push(null);
    setSteps(values);
    recipes[recipeId]['steps'] = values;
  }

  function handleRemoveStep(i) {
    const values = [...steps];
    values.splice(i, 1);
    setSteps(values);
    recipes[recipeId]['steps'] = values;
  }

  function handleCancel () {
    setDeleteVisible(false);
  }


  const updateData = () => {
    let ing = [];
    let carbFood = [];

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
          recipeId: result.documents[i]['$id']
        })
        filterAllowed.push(i);
      };
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

  Toast.hide()
})
.then (() => {
  console.log(filterList)
  forceUpdate()
  })
  };

  React.useEffect(() => {
    Toast.show({
        type: 'info',
        text1: 'Loading...',
    })

    const refreshData = navigation.addListener('focus', () => {
      updateData();
      setShowMealEditor(false);
    })
    return refreshData;
  }, [navigation]);


  async function save () {
    Toast.show({
      type: 'info',
      text1: 'Saving...',
    });

    for (let i = 0; i < recipes.length; i++) {
      if (recipes[i]['name'] == "") {
        recipes.splice(i, 1);
      }

      let ingredients = []
      let serving_amt = []
      let serving_units = []

      for (let j = 0; j < recipes[i].ing.length; j++) {
        ingredients.push(recipes[i].ing[j].ing)
        serving_amt.push(Number(recipes[i].ing[j].serving_amt))
        serving_units.push(recipes[i].ing[j].serving_unit)
      }

      try {
        await db.createDocument("data", "recipes", recipes[i].recipeId, {
          uid: userId,
          ingredients: ingredients,
          serving_units: serving_units,
          serving_amt: serving_amt,
          steps: recipes[i].steps,
          name: recipes[i].name,
          servings: Number(recipes[i].serving)
        }, [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]);

        Toast.show({
          type: 'success',
          text1: 'Saved!',
        });
      }

      catch {
        await db.updateDocument("data", "recipes", recipes[i].recipeId, {
          uid: userId,
          ingredients: ingredients,
          steps: recipes[i].steps,
          name: recipes[i].name,
          servings: recipes[i].serving
        }, [
          Permission.read(Role.user(userId)),
          Permission.write(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]);

        Toast.show({
          type: 'success',
          text1: 'Saved!',
        });
      }
    }
  }


  BackHandler.addEventListener('hardwareBackPress', function () {
    if (!showMealEditor && !showRecipePage && !showWalkthrough) {
      navigation.goBack();
      return true;
    }
    if (showMealEditor) {
      setShowMealEditor(false)
      return true;
    }
    if (showRecipePage) {
      setshowRecipePage(false)
      return true;
    }
    if (showWalkthrough) {
      setShowWalkthrough(false)
      return true;
    }
    return false;
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
          middleContent="Recipes"
        />

        <ScrollView 
          nestedScrollEnabled
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          >
          {!showMealEditor && !showRecipePage && !showWalkthrough &&
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
                        <TouchableOpacity onPress={() => { recipeId = idx; setRIDTD(idx); currentRecipe = _.cloneDeep(recipes[recipeId]); setServings(currentRecipe.serving); setshowRecipePage(true) }}>
                          <View style={styles.listItem}>
                            <Text fontWeight="medium">{recipe.name}</Text>
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={isDarkmode ? themeColor.white : themeColor.black}
                            />
                          </View>
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
                onPress={() => {
                  recipeId = recipes.length;
                  fetchMeals();
                }}
              />

                <View style={{ marginHorizontal: 20, marginVertical: 10, marginTop: 25 }}>
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
                style={{ marginVertical: 10, marginHorizontal: 20 }}
                leftContent={
                  <Ionicons name="arrow-down-circle-outline" size={20} color={themeColor.white} />
                }
                text="Import using AI"
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
          }



          {!showMealEditor && showRecipePage && !showWalkthrough &&
            <View>
              <Dialog.Container visible={deleteVisible}>
                <Dialog.Title>Delete Recipe</Dialog.Title>
                <Dialog.Description>
                  Are you sure you wnat to delete this recipe? You cannot undo this action.
                </Dialog.Description>
                <Dialog.Button label="Cancel" onPress={handleCancel} />
                <Dialog.Button label="Delete" onPress={() => {
                  setDeleteVisible(false)
                  Toast.show({
                    type: "info",
                    text1: "Deleting..."
                  })
                   db.deleteDocument("data", "recipes", recipes[recipeIDToDel].recipeId).then(() => {
                    recipes.splice(recipeIDToDel, 1)
                   setshowRecipePage(false)
                   setShowMealEditor(false)
                   forceUpdate()
                   updateData()
                   Toast.show({
                    type: "success",
                    text1: "Deleted!"
                   })
                   })
                }} />
              </Dialog.Container>

              <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ marginBottom: 20 }}>
                    <Text fontWeight="bold" style={{ fontSize: 35, marginVertical: 15, marginBottom: 20, textAlign: "center" }}>{recipes[recipeId]['name']}</Text>
                    <View style={{
                      display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 20,
                      width: 150, gap: 8, marginHorizontal: "auto"
                    }}>
                    <Text style={{ fontSize: 22, textAlign: "center" }}>Servings: </Text>
                    <TextInput
                      onChangeText={(value) => {
                        
                        setServings(value)

                        for (let i=0; i < recipes[recipeId]['ing'].length; i++) {
                          currentRecipe['ing'][i]['serving_amt'] = Number(recipes[recipeId]['ing'][i]['serving_amt']) / Number(recipes[recipeId]['serving']) * Number(value)
                        }
                        forceUpdate()
                      }}
                      defaultValue={String(recipes[recipeId]['serving'])}
                      placeholder="Servings"
                      keyboardType='numeric'
                      style={{
                        width: 100
                      }}
                    />
                    </View>
                  </View>
                </SectionContent>
              </Section>

              <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 25, marginVertical: 7, fontWeight: "bold" }}>Ingredients</Text>
                    {currentRecipe['ing'].map((ing, idx) => {
                      return (
                        <View style={{ marginHorizontal: 20, marginTop: 18 }}>
                          <Text style={{ fontSize: 17 }}>{ing.serving_amt > 0 && <Text style={{ color: themeColor.primary200 }}>{ing.serving_amt} {ing.serving_unit}</Text>} {ing.ing}</Text>
                        </View>
                      )
                    })}
                  </View>
                </SectionContent>
              </Section>

              <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20, marginBottom: 20 }}>
                <SectionContent>
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 25, marginVertical: 7, fontWeight: "bold" }}>Steps</Text>
                      {recipes[recipeId]['steps'].map((step, idx) => {
                        return (
                          <View style={{ marginHorizontal: 20, marginTop: 15 }}>
                            <Text style={{ fontSize: 17 }}>{idx + 1}. {step}</Text>
                          </View>
                        )
                      })}
                    </View>
                </SectionContent>
              </Section>

              <Button
                style={{ marginVertical: 5, marginHorizontal: 20 }}
                leftContent={
                  <Ionicons name="chevron-back" size={20} color={themeColor.white} />
                }
                text="Back"
                status="primary"
                type="TouchableOpacity"
                onPress={() => { setshowRecipePage(false) }}
              />

              <Button
                style={{ marginVertical: 5, marginHorizontal: 20 }}
                leftContent={
                  <Ionicons name="newspaper-outline" size={20} color={themeColor.white} />
                }
                text="Start Step-by-Step Instructions"
                status="primary"
                type="TouchableOpacity"
                onPress={() => { currentIndex = 0; setshowRecipePage(false); setShowMealEditor(false); setShowWalkthrough(true) }}
              />

              <Button
                style={{ marginVertical: 5, marginHorizontal: 20 }}
                leftContent={
                  <Ionicons name="pencil-outline" size={20} color={themeColor.white} />
                }
                text="Edit"
                status="primary"
                type="TouchableOpacity"
                onPress={() => { setshowRecipePage(false); fetchMeals(); setShowMealEditor(true) }}
              />

              <Button
                style={{ marginTop: 5, marginHorizontal: 20, marginBottom: 20 }}
                leftContent={
                  <Ionicons name="trash-outline" size={20} color={themeColor.white} />
                }
                text="Delete Recipe"
                status="danger"
                type="TouchableOpacity"
                onPress={() => { setDeleteVisible(true) }}
              />
            </View>
          }



          {!showMealEditor && !showRecipePage && showWalkthrough &&
            <View>
              <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ marginBottom: 20 }}>
                    <Text fontWeight="bold" style={{ fontSize: 35, marginVertical: 15, marginBottom: 20, textAlign: "center" }}>{recipes[recipeId]['name']}</Text>
                    <View style={{
                      display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 20,
                      width: 150, gap: 8, marginHorizontal: "auto"
                    }}>
                    <Text style={{ fontSize: 22, textAlign: "center" }}>Servings: {servings}</Text>
                    </View>
                  </View>
                </SectionContent>
              </Section>
                    
              {currentIndex == 0 &&
              <>
                <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 25, marginVertical: 7, fontWeight: "bold", textAlign: "center" }}>Prepare Ingredients</Text>
                    {currentRecipe['ing'].map((ing, idx) => {
                      return (
                        <View style={{ marginHorizontal: 20, marginTop: 10 }}>
                          <Text style={{ fontSize: 17 }}>{ing.serving_amt > 0 && <Text style={{ color: themeColor.primary200 }}>{ing.serving_amt} {ing.serving_unit}</Text>} {ing.ing}</Text>
                        </View>
                      )
                    })}
                  </View>
                </SectionContent>
              </Section>

              <Button
                  style={{ marginVertical: 5, marginHorizontal: 20 }}
                  leftContent={
                    <Ionicons name="chevron-back" size={20} color={themeColor.white} />
                  }
                  text="Back"
                  color="black100"
                  type="TouchableOpacity"
                  onPress={() => { setShowWalkthrough(false); setshowRecipePage(true); setShowMealEditor(false) }}
                />

                <Button
                  style={{ marginVertical: 5, marginHorizontal: 20 }}
                  rightContent={
                    <Ionicons name="chevron-forward" size={20} color={themeColor.white} />
                  }
                  text="Next"
                  status="primary"
                  type="TouchableOpacity"
                  onPress={() => { currentIndex += 1; forceUpdate() }}
                />
              </>
              }

              {currentIndex > 0 &&
              <>
                <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ marginBottom: 0 }}>
                    <Text style={{ fontSize: 25, marginVertical: 7, fontWeight: "bold", textAlign: "center" }}>Step {currentIndex}</Text>
                      <View style={{ marginHorizontal: 20, marginTop: 10 }}>
                        <Text style={{ fontSize: 20, marginBottom: 10 }}>{currentRecipe.steps[currentIndex - 1]}</Text>
                      </View>
                  </View>
                </SectionContent>
                </Section>

                <Button
                  style={{ marginTop: 20, marginVertical: 5, marginHorizontal: 20 }}
                  leftContent={
                    <Ionicons name="chevron-back" size={20} color={themeColor.white} />
                  }
                  text="Back"
                  color="black100"
                  type="TouchableOpacity"
                  onPress={() => { currentIndex -= 1; forceUpdate() }}
                />

                {currentIndex < currentRecipe.steps.length &&
                <Button
                  style={{ marginVertical: 5, marginHorizontal: 20 }}
                  rightContent={
                    <Ionicons name="chevron-forward" size={20} color={themeColor.white} />
                  }
                  text="Next"
                  status="primary"
                  type="TouchableOpacity"
                  onPress={() => { currentIndex += 1; forceUpdate() }}
                />
                }
              </>
              }
            </View>
          }


          {showMealEditor && !showRecipePage && !showWalkthrough &&
            <View>

              <View style={{ paddingBottom: 20 }}>
                <Button style={{ marginHorizontal: 20, marginVertical: 10 }} status="primary" text="All Recipes" onPress={() => {
                  updateData()
                  for (let i = 0; i < recipes.length; i++) {
                    if (recipes[i]['name'] == "") {
                      console.log(i, recipes[i])
                      recipes.splice(i, 1);
                    }
                  }

                  setShowMealEditor(false)
                }} />

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
                      defaultValue={String(recipes[recipeId]['serving'])}
                      placeholder="Servings"
                      keyboardType='numeric'
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
                      defaultValue={field.ing}
                      onSelect={(item) => {
                        if (item) {

                          let mealObj = undefined;

                          for (let i = 0; i < mealsList.length; i++) {
                            if (mealsList[i] === item) {
                              mealObj = mealsList[i]
                              let fieldset = fields

                              fieldset[idx]['serving_amt'] = "1"
                              setFields(fieldset)
                            }
                          }

                          if (!mealObj) {
                            return
                          }

                          handleChange(idx, "ing", item);
                        }
                      }}

                      onChangeText={e => {
                        handleChange(idx, "ing", e)
                      }}
                      />
                      </View>

                      <View style={{ marginVertical: 20 }}>
                        <TextInput
                          placeholder="Amount"
                          onChangeText={e => {
                            handleChange(idx, "serving_amt", Number(e))
                          }}
                          defaultValue={String(field.serving_amt)}
                          keyboardType='numeric'
                        />
                      </View>

                      <View style={{ marginBottom: 20 }}>
                        <TextInput
                          placeholder="Unit (i.e. cups, tbsp, etc)"
                          onChangeText={e => {
                            handleChange(idx, "serving_unit", e)
                          }}
                          defaultValue={field.serving_unit}
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
                          onPress={() => { handleRemoveIng(idx) }}
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
                onPress={handleAddIng}
              />


              {steps.map((step, idx) => {
                return (
                  <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
                    <SectionContent>
                      <View style={{ marginVertical: 20 }}>
                        <TextInput
                          placeholder="Enter a step.."
                          onChangeText={e => {
                            handleChangeStep(idx, e)
                          }}
                          defaultValue={step}
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
                          onPress={() => { handleRemoveStep(idx) }}
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
                text="Add New Step"
                status="primary"
                type="TouchableOpacity"
                onPress={handleAddStep}
              />

            </View>
          }

        </ScrollView>
      </Layout>
      <Toast />
    </KeyboardAvoidingView>

  );
}