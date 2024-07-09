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
import _, { set, update } from 'lodash';

import Autocomplete from '../components/autocomplete';
import Dialog from "react-native-dialog";
import { MenuView } from '@react-native-menu/menu';

import { Fraction } from "fractional";
import { SwipeablePanel } from 'rn-swipeable-panel';
import RNJsxParser from 'react-native-jsx-parser';

import { createStackNavigator } from '@react-navigation/stack';

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);
const functions = new Functions(client);

const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
console.disableYellowBox = true;


let recipeId = NaN;
let currentRecipe = null;
let recipes = [];
let filterAllowed = []
let mealDB = []
let currentIndex = 0;
let AIUrl = null;
let jsxText = "";
let newFromHome = false;

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


function Recipes() {
  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [mealsList, setMealsList] = React.useState([]);
  const [fields, setFields] = React.useState([{}]);
  const [steps, setSteps] = React.useState([{}]);
  const [filterList, setFilterList] = React.useState([{}]);
  const [servings, setServings] = React.useState(null);
  const [ingList, setIngList] = React.useState([]);

  const [showMealEditor, setShowMealEditor] = React.useState(false);
  const [showRecipePage, setshowRecipePage] = React.useState(false);
  const [showWalkthrough, setShowWalkthrough] = React.useState(false);

  const [deleteVisible, setDeleteVisible] = React.useState(false);
  const [recipeIDToDel, setRIDTD] = React.useState(null)
  const { height: screenHeight } = Dimensions.get('window');

  const [ingPanelProps, setIngPanelProps] = React.useState({
    fullWidth: true,
    openLarge: true,
    showCloseButton: true,
    onClose: () => closePanel(),
    onPressCloseButton: () => closePanel(),
  });
  const [isPanelActive, setIsPanelActive] = React.useState(false);

  const openPanel = () => {
    setIsPanelActive(true);
  };

  const closePanel = () => {
    setIsPanelActive(false);
  };


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


  const updateJSX = (index) => {
    let step = currentRecipe.steps[index];
    let wordArr = step.split(' ');
    let text = [];
    wordArr.forEach(function(el) {
      for (let i=0; i < ingList.length; i++) {
        if (ingList[i].toLowerCase().includes(el.toLowerCase()) && !["a", "the", "of", "in", "cook", "to", "drain", "for", "all", "chop", "dice", "and", "I", "at", "an"].includes(el.toLowerCase())) {
          el = `<Text style={{ color: "#adc8ff", fontSize: 20 }} onPress={() => handlePress('${(new Fraction(currentRecipe.ing[i].serving_amt)).toString()} ${currentRecipe.ing[i].serving_unit} ${currentRecipe.ing[i].ing}')}>${el}</Text>`;
          el = el
        } 
      }
      text.push(el);
    });
    text = "<Text style={{ fontSize: 20, marginBottom: 10 }}>" + text.join('&nbsp;') + "</Text>";

    jsxText = text;
  }

  const updateIngredients = async () => {
    let allIng = [];
    for (let i = 0; i < recipes.length; i++) {
      for (let j = 0; j < recipes[i].ing.length; j++) {
        allIng.push(recipes[i].ing[j].ing.toLowerCase())
      }
    }
    
    allIng = [...new Set(allIng)]

    try {
      await db.createDocument("data", "ingredients", userId, {uid: userId, items: allIng}, [
        Permission.read(Role.user(userId)),
        Permission.write(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]);
    } 

    catch {
      await db.updateDocument("data", "ingredients", userId, {items: allIng})
    }
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

    updateIngredients()

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
    }
  }

  function handleBack () {
    if (!showMealEditor && !showRecipePage && !showWalkthrough) {
      navigation.goBack();
      return true;
    }
    if (showMealEditor && !newFromHome) {
      setShowMealEditor(false)
      setshowRecipePage(true)
      return true;
    }
    if (showMealEditor && newFromHome) {
      setShowMealEditor(false)
      setshowRecipePage(false)
      return true;
    }
    if (showRecipePage) {
      setshowRecipePage(false)
      return true;
    }
    if (showWalkthrough) {
      setShowWalkthrough(false)
      setshowRecipePage(true)
      return true;
    }
    return false;
  }

  BackHandler.addEventListener('hardwareBackPress', handleBack);


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
          leftAction={handleBack}
          middleContent="Recipes"
        />

        <ScrollView 
          nestedScrollEnabled
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            minHeight: isPanelActive ? screenHeight + 500 : screenHeight,
            flexGrow: 1
          }}
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
                        <TouchableOpacity onPress={() => navigation.navigate("View Recipe", { idx })}>
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
          }

          {!showMealEditor && !showRecipePage && showWalkthrough &&
            <View style={{ flex: 1 }}>
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
                          <Text style={{ fontSize: 17 }}>{ing.serving_amt > 0 && <Text style={{ color: themeColor.primary200 }}>{(new Fraction(ing.serving_amt)).toString()} {ing.serving_unit}</Text>} {ing.ing}</Text>
                        </View>
                      )
                    })}
                  </View>
                </SectionContent>
              </Section>

              <View style={{ gap: 4, flexDirection: "row", marginVertical: 20, height: "auto" }}>
                <Button
                    style={{ marginVertical: 5, marginHorizontal: 20, flex: 1, width: "auto" }}
                    leftContent={
                      <Ionicons name="chevron-back" size={20} color={themeColor.white} />
                    }
                    text="Back"
                    color="black100"
                    type="TouchableOpacity"
                    onPress={() => { setShowWalkthrough(false); setshowRecipePage(true); setShowMealEditor(false) }}
                  />

                  <Button
                    style={{ marginVertical: 5, marginHorizontal: 20, flex: 1, width: "auto" }}
                    rightContent={
                      <Ionicons name="chevron-forward" size={20} color={themeColor.white} />
                    }
                    text="Next"
                    status="primary"
                    type="TouchableOpacity"
                    onPress={() => { currentIndex += 1; updateJSX(currentIndex - 1); forceUpdate() }}
                  />
                </View>
              </>
              }

              {currentIndex > 0 &&
              <View style={{ height: "100%" }}>
                <View style={{ marginVertical: 25, marginHorizontal: 20 }}>
                  <Button
                    text={<Ionicons name="nutrition" size={20} color={themeColor.white} />}
                    status='primary'
                    outline={true}
                    type="TouchableOpacity"
                    onPress={openPanel}
                  />
                </View>

                <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ marginBottom: 0 }}>
                    <Text style={{ fontSize: 25, marginVertical: 7, fontWeight: "bold", textAlign: "center" }}>Step {currentIndex}</Text>
                      <View style={{ marginHorizontal: 20, marginTop: 10 }}>
                        <RNJsxParser bindings={{ 
                          handlePress: (textToRender) => {
                            Toast.show({
                              type: 'info',
                              text1: textToRender,
                            })
                          } 
                          }} 
                          blacklistedAttrs={[]} 
                          showWarnings={true} 
                          components={{ Text }} 
                          jsx={jsxText} />
                      </View>
                  </View>
                </SectionContent>
                </Section>
                
                <View style={{ gap: 4, flexDirection: "row", marginVertical: 20, height: "auto" }}>
                  <Button
                    style={{ marginVertical: 5, marginHorizontal: 20, flex: 1, width: "auto" }}
                    leftContent={
                      <Ionicons name="chevron-back" size={20} color={themeColor.white} />
                    }
                    text="Back"
                    color="black100"
                    type="TouchableOpacity"
                    onPress={() => { currentIndex -= 1; if (currentIndex > 0) updateJSX(currentIndex - 1); forceUpdate() }}
                  />

                  {currentIndex < currentRecipe.steps.length &&
                  <Button
                    style={{ marginVertical: 5, marginHorizontal: 20, flex: 1, width: "auto" }}
                    rightContent={
                      <Ionicons name="chevron-forward" size={20} color={themeColor.white} />
                    }
                    text="Next"
                    status="primary"
                    type="TouchableOpacity"
                    onPress={() => { currentIndex += 1; updateJSX(currentIndex - 1); forceUpdate() }}
                  />
                  }
                </View>

                <SwipeablePanel {...ingPanelProps} isActive={isPanelActive} style={{ backgroundColor: "#262834", paddingBottom: 20, flex: 1, flexGrow: 1, minHeight: screenHeight + 300, marginBottom: 50 }} scrollViewProps={{ flex: 1, flexGrow: 1 }} closeOnTouchOutside={true} noBar={true}>
                  <ScrollView contentContainerStyle={{ flexGrow: 1, minHeight: screenHeight }}>
                    <Text style={{ fontSize: 25, fontWeight: "bold", marginHorizontal: 30, marginTop: 40, marginBottom: 5, textAlign: "center" }}>Ingredients</Text>

                    {currentRecipe['ing'].map((ing, idx) => {
                      return (
                          <Text style={{ fontSize: 18.5, marginHorizontal: 20, marginTop: 18 }}>{ing.serving_amt > 0 && <Text style={{ color: themeColor.primary200, fontSize: 18.5 }}>{(new Fraction(ing.serving_amt)).toString()} {ing.serving_unit}</Text>} {ing.ing}</Text>
                      )
                    })}
                  </ScrollView>
                </SwipeablePanel>

              </View>
              }
            </View>
          }

        </ScrollView>
      </Layout>
      <Toast />
    </KeyboardAvoidingView>

  );
}

const RecipeStack = createStackNavigator();

import CreateRecipe from './recipe/create';
import ViewRecipe from './recipe/view';

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

    </RecipeStack.Navigator>
  );
}