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
import Autocomplete from '../../components/autocomplete';

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);

const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
console.disableYellowBox = true;


let recipe = {};
let recipes = [];

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
            };
          }
    })
})

export default function EditRecipe ({ navigation, route }) {
  const { isDarkmode, setTheme } = useTheme();

  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [fields, setFields] = React.useState([{}]);
  const [steps, setSteps] = React.useState([{}]);
  const [filterList, setFilterList] = React.useState([{}]);

  React.useEffect(() => {
    db.listDocuments("data", "ingredients", [Query.equal("uid", [userId])]).then(function (result) {
        console.log("ingredients", result)
        let mealDB = []
        if (result.total > 0) {
            mealDB = result.documents[0].items;
        }

        let filter = [];
        for (let i = 0; i < mealDB.length; i++) {
            filter.push(mealDB[i]);
        }
        setFilterList(filter);
      })
    
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
            };
          }
    })
    .then(() => {
        console.log("IDX", route.params.idx)
        recipe = recipes[route.params.idx]
        setFields(recipe['ing']);
        setSteps(recipe['steps']);
    })

  }, [])


  function handleChange(i, type, value) {

    if (value == null || value == undefined) {
      return
    }

    const values = [...fields];
    values[i][type] = value;
    setFields(values);

    recipe['ing'] = values;
  }

  function handleAddIng() {
    const values = [...fields];
    values.push({ ing: null });
    setFields(values);
    recipe['ing'] = values;
  }

  function handleRemoveIng(i) {
    const values = [...fields];
    values.splice(i, 1);
    setFields(values);
    recipe['ing'] = values;
  }

  function handleChangeStep(i, value) {

    if (value == null || value == undefined) {
      return
    }

    const values = [...steps];
    values[i] = value;
    setSteps(values);

    recipe['steps'] = values;
  }

  function handleAddStep() {
    const values = [...steps];
    values.push(null);
    setSteps(values);
    recipe['steps'] = values;
  }

  function handleRemoveStep(i) {
    const values = [...steps];
    values.splice(i, 1);
    setSteps(values);
    recipe['steps'] = values;
  }


  const updateIngredients = async () => {
    let allIng = [];
    for (let j = 0; j < recipe.ing.length; j++) {
        allIng.push(recipe.ing[j].ing.toLowerCase())
    }

    let result = await db.listDocuments("data", "ingredients", [Query.equal("uid", [userId])])
    if (result.total > 0) {
      let dbing = result.documents[0].items;
        for (let i = 0; i < dbing.length; i++) {
            allIng.push(dbing[i].toLowerCase())
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


  async function save () {
    Toast.show({
      type: 'info',
      text1: 'Saving...',
    });

    updateIngredients()

    if (recipe['name'] == "") {
        return
    }

    let ingredients = []
    let serving_amt = []
    let serving_units = []

    for (let j = 0; j < recipe.ing.length; j++) {
    ingredients.push(recipe.ing[j].ing)
    serving_amt.push(Number(recipe.ing[j].serving_amt))
    serving_units.push(recipe.ing[j].serving_unit)
    }

    try {
    await db.createDocument("data", "recipes", recipe.recipeId, {
        uid: userId,
        ingredients: ingredients,
        serving_units: serving_units,
        serving_amt: serving_amt,
        steps: recipe.steps,
        name: recipe.name,
        servings: Number(recipe.serving)
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
    await db.updateDocument("data", "recipes", recipe.recipeId, {
        uid: userId,
        ingredients: ingredients,
        serving_units: serving_units,
        serving_amt: serving_amt,
        steps: recipe.steps,
        name: recipe.name,
        servings: Number(recipe.serving)
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
          middleContent="Edit Recipe"
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

                {recipe && 
                    <View style={{ paddingBottom: 20 }}>
                        <Button
                        style={{ marginVertical: 10, marginHorizontal: 20 }}
                        leftContent={
                            <Ionicons name="save-outline" size={20} color={themeColor.white} />
                        }
                        text="Save"
                        status='primary'
                        type="TouchableOpacity"
                        onPress={save}
                        />
                    </View>
                }

                <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                    <View style={{ marginBottom: 20 }}>
                    <TextInput
                        onChangeText={(value) => {
                        recipe['name'] = value;
                        }}
                        defaultValue={recipe['name']}
                        placeholder="Recipe Name"
                    />
                    </View>

                    <View style={{ marginBottom: 20 }}>
                    <TextInput
                        onChangeText={(value) => {
                        recipe['serving'] = value;
                        }}
                        defaultValue={String(recipe['serving'])}
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
                        <View style={{
                        flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "space-between" 
                        }}>
                        <View style={{ width: "85%" }}>

                            <View>
                            <Autocomplete 
                            data={filterList} 
                            placeholder="Start typing to search ingredients..." 
                            defaultValue={field.ing}
                            onSelect={(item) => {
                            if (item) {
                                let fieldset = fields
                                fieldset[idx]['serving_amt'] = "1"
                                fieldset[idx]['ing'] = item
                                setFields(fieldset)

                                handleChange(idx, "ing", item);
                            }
                            }}

                            onChangeText={e => {
                            handleChange(idx, "ing", e)
                            }}
                            />
                            </View>

                            <View style={{ flexDirection: "row", gap: 8 }}> 

                            <View style={{ marginVertical: 20, flex: 1 }}>
                                <TextInput
                                placeholder="Amount"
                                onChangeText={e => {
                                    handleChange(idx, "serving_amt", Number(e))
                                }}
                                defaultValue={String(field.serving_amt).replace("undefined", "")}
                                keyboardType='numeric'
                                />
                            </View>

                            <View style={{ marginVertical: 20, flex: 3 }}>
                            <Autocomplete 
                                data={["cups", "tbsp", "tsp", "g", "kg", "ml", "l", "oz", "lb", "pt", "qt", "gal", "fl oz", "pinch"]} 
                                placeholder="Unit (i.e. cups, tbsp, etc.)" 
                                defaultValue={field.serving_unit}
                                onSelect={(item) => {
                                handleChange(idx, "serving_unit", item);
                                }}

                                onChangeText={e => {
                                handleChange(idx, "serving_unit", e)
                                }}
                                />
                            </View>
                            </View>
                            </View>

                            <View style={{ marginBottom: 20 }}>
                            <Button
                                text={<Ionicons name="trash-outline" size={20} color={themeColor.white} />}
                                outline={true}
                                status="danger"
                                type="TouchableOpacity"
                                onPress={() => { handleRemoveIng(idx) }}
                            />
                            </View>
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

                        <View style={{
                        flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "space-between" 
                        }}>

                        <View style={{ marginVertical: 10, width: "85%" }}>
                        <TextInput
                            placeholder="Enter a step.."
                            onChangeText={e => {
                            handleChangeStep(idx, e)
                            }}
                            defaultValue={step}
                        />
                        </View>

                        <View style={{ marginVertical: 10 }}>
                        <Button
                            text={<Ionicons name="trash-outline" size={20} color={themeColor.white} />}
                            status="danger"
                            type="TouchableOpacity"
                            onPress={() => { handleRemoveStep(idx) }}
                            outline={true}
                        />
                        </View>
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

        </ScrollView>
      </Layout>
      <Toast />
    </KeyboardAvoidingView>

  );
}