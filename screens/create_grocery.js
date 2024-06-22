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
  Section, SectionContent, TextInput
} from "react-native-rapi-ui";
import { Client, Databases, Query, Permission, Role, ID, Functions, ExecutionMethod } from "react-native-appwrite";
import Toast from 'react-native-toast-message';
import Autocomplete from '../components/autocomplete';
import Modal from "react-native-modal";

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);


const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
const delkey = async (key, value) => { try { await AsyncStorage.removeItem(key) } catch (e) { console.log(e) } }
const getAll = async () => { try { const keys = await AsyncStorage.getAllKeys(); return keys } catch (error) { console.error(error) } }

let userId, mealDB = [], ing = [], carbFood = [], recipes = [], ingredients = [], name = ""
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

export default function CreateGrocery ({ navigation, route }) {

  const { isDarkmode, setTheme } = useTheme();
  const [form, setForm] = React.useState({ name: "", items: [] });
  const [filterList, setFilterList] = React.useState([]);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [showRecipePicker, setShowRecipePicker] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);

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
    const refreshData = navigation.addListener('focus', () => {
        recipes = []
        db.listDocuments("data", "ingredients", [Query.equal("uid", [userId])]).then(function (result) {
            console.log("ingredients", result)
              if (result.total > 0) {
                  mealDB = result.documents[0].items;
                }
          })
          .then(() => {
            let filter = []
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
      })
      return refreshData;
  }, [navigation])

  const updateField = (id, field, value) => {
    let fieldset = form.items
    fieldset[id][field] = value
    setForm({...form, items: fieldset})
  }

    const updateFood = (idx, id, value, field) => {
        console.log("UPDATE", idx, id, value, field)
        let fieldset = form.items
        fieldset[idx].items[id][field] = value
        setForm({...form, items: fieldset})
    }

    const handleAddIng = (idx) => {
        let fieldset = form.items
        fieldset[idx].items.push({name: "", amount: "", unit: ""})
        setForm({...form, items: fieldset})
    }

    const handleRemoveIng = (idx, id) => {
        let fieldset = form.items
        fieldset[idx, id].items.splice(id, 1)
        setForm({...form, items: fieldset})
    }

    const handleAddCat = () => {
        let fieldset = form.items
        fieldset.push({src: "", items: []})
        setForm({...form, items: fieldset})
    }

    const handleRemoveCat = (id) => {
        let fieldset = form.items
        fieldset.splice(id, 1)
        setForm({...form, items: fieldset})
    }
    
    const save = async () => {
        Toast.show({
            text1: "Saving",
            text2: "Please wait...",
            type: "info",
        })

        if (form.name === "") {
            Toast.show({
                text1: "Error",
                text2: "List name cannot be empty",
                type: "error",
            });
            return;
        }

        for (let i = 0; i < form.items.length; i++) {
            if (form.items[i].src === "") {
                Toast.show({
                    text1: "Error",
                    text2: "Category name cannot be empty",
                    type: "error",
                });
                return;
            }
            for (let j = 0; j < form.items[i].items.length; j++) {
                if (form.items[i].items[j].name === "") {
                    Toast.show({
                        text1: "Error",
                        text2: "Food item name cannot be empty",
                        type: "error",
                    });
                    return;
                }
                if (form.items[i].items[j].amount === "") {
                    Toast.show({
                        text1: "Error",
                        text2: "Food item amount cannot be empty",
                        type: "error",
                    });
                    return;
                }
            }
        }

        let data = {
            name: form.name,
            items: []
        }

        for (let i = 0; i < form.items.length; i++) {
            let cat = {
                src: form.items[i].src,
                items: []
            }
            for (let j = 0; j < form.items[i].items.length; j++) {
                cat.items.push(`${form.items[i].items[j].amount} ${form.items[i].items[j].unit} ${form.items[i].items[j].name}`)
            }
            data.items.push(cat)
        }

        db.createDocument("data", "grocery", ID.unique(), {uid: userId, items: JSON.stringify(data)}, [
            Permission.read(Role.user(userId)),
            Permission.write(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]).then(function (result) {
            console.log(result)
            Toast.show({
                text1: "Success",
                text2: "Grocery list created successfully",
                type: "success",
            });
            navigation.goBack()
        }).catch(function (error) {
            console.log(error)
            Toast.show({
                text1: "Error",
                text2: "An error occurred",
                type: "error",
            });
        })
    }

    const fromRecipe = () => {
        
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
            middleContent="Create Grocery List"
        />
        <ScrollView>
    
        {!showRecipePicker &&
        <View>
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

            <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
            <SectionContent>
                <View style={{ marginBottom: 20 }}>
                <TextInput
                    onChangeText={(value) => {
                    setForm({ ...form, name: value });
                    }}
                    placeholder="List Name"
                />
                </View>
            </SectionContent>
            </Section>

            {form.items.map((field, idx) => {
            return (
                <>
                <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 40 }}>
                    <SectionContent>
                        <View style={{ marginBottom: 20 }}>
                        <TextInput
                            onChangeText={(value) => {
                            updateField(idx, "src", value);
                            }}
                            placeholder="Category Name"
                            defaultValue={field.src}
                        />
                        </View>
                    </SectionContent>
                </Section>
                {field.items.map((item, id) => {
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
                            placeholder="Start typing to search foods..." 
                            defaultValue={item.name}
                            onSelect={(e) => {
                            updateFood(idx, id, e, "name");
                            }}
    
                            onChangeText={e => {
                            updateFood(idx, id, e, "name")
                            }}
                            />
                            </View>
    
                            <View style={{ flexDirection: "row", gap: 8 }}> 
    
                            <View style={{ marginVertical: 20, flex: 1 }}>
                                <TextInput
                                placeholder="Amt"
                                defaultValue={String(item.amount).replace("undefined", "")}
                                onChangeText={e => {
                                    updateFood(idx, id, e, "amount");
                                }}
                                keyboardType='numeric'
                                />
                            </View>
    
                            <View style={{ marginVertical: 20, flex: 3 }}>
                            <Autocomplete 
                                data={["cups", "tbsp", "tsp", "g", "kg", "ml", "l", "oz", "lb", "pt", "qt", "gal", "fl oz", "pinch"]} 
                                placeholder="Unit (i.e. cups, tbsp, etc.)" 
                                defaultValue={item.unit}
                                onSelect={(e) => {
                                updateFood(idx, id, e, "unit");
                                }}
    
                                onChangeText={e => {
                                updateFood(idx, id, e, "unit")
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
                                onPress={() => { handleRemoveIng(idx, id) }}
                            />
                            </View>
                        </View>
                    </SectionContent>
                    </Section>
                    )
                })}

                <View style={{
                    flexDirection: "row", marginHorizontal: 20, justifyContent: "space-between", gap: 8
                }}>
                    <Button
                    style={{ marginVertical: 10, flex: 1 }}
                    leftContent={
                        <Ionicons name="add-circle-outline" size={20} color={themeColor.primary} />
                    }
                    text="New Food Item"
                    status="primary"
                    type="TouchableOpacity"
                    onPress={() => handleAddIng(idx)}
                    outline={true}
                    />

                    <Button 
                    style={{ marginVertical: 10, flex: 1 }}
                    leftContent={
                        <Ionicons name="trash-outline" size={20} color={themeColor.danger} />
                    }
                    text="Remove Category"
                    status="danger"
                    type="TouchableOpacity"
                    onPress={() => handleRemoveCat(idx)}
                    outline={true}
                    />
                </View>

                </>
            );
            })}
            
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20, gap: 8, marginTop: 40 }}>
            <Button
            style={{ marginVertical: 10, flex: 1 }}
            leftContent={
                <Ionicons name="add-circle-outline" size={20} color={themeColor.white} />
            }
            text="New Category"
            status="primary"
            type="TouchableOpacity"
            onPress={handleAddCat}
            />

            <Button
            style={{ marginVertical: 10, flex: 1 }}
            leftContent={
                <Ionicons name="add-circle-outline" size={20} color={themeColor.primary} />
            }
            text="From Recipe"
            status="primary"
            type="TouchableOpacity"
            outline={true}
            onPress={() => setShowRecipePicker(true)}
            />
            </View>

            </View>
            }

            {showRecipePicker &&
            <View>
                <View style={{ paddingBottom: 20 }}>
                    <Button
                    style={{ marginVertical: 10, marginHorizontal: 20 }}
                    leftContent={
                        <Ionicons name="backspace-outline" size={20} color={themeColor.white} />
                    }
                    text="Cancel"
                    status='primary'
                    type="TouchableOpacity"
                    onPress={() => setShowRecipePicker(false)}
                    />
                </View>

                {recipes.map((recipe, idx) => {
                    return (
                        <TouchableOpacity key={idx} onPress={() => {
                            ingredients = []
                            for (let i = 0; i < recipe.ing.length; i++) {
                                ingredients.push({
                                    name: recipe.ing[i].ing,
                                    amount: recipe.ing[i].serving_amt * recipe.serving,
                                    unit: recipe.ing[i].serving_unit
                                })
                            }
                            name = recipe.name
                            setShowImport(true)
                        }}>
                            <View style={styles.listItem}>
                                <Text fontWeight="medium">{recipe.name}</Text>
                                <View style={{ flexDirection: "row", gap: 4 }}>
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

                <Modal isVisible={showImport} style={{ paddingTop: 40, backgroundColor: "#262834", borderRadius: 12, height: "100%" }}>
                    <View style={{ flex: 1 }}>
                    {ingredients.map((ing, idx) => {
                        return (
                        <View style={{ marginHorizontal: 20, marginTop: 15 }}>
                            <Text style={{ fontSize: 18.5 }}>{ing.amount} {ing.unit} {ing.name}</Text>
                        </View>
                        )
                    })}
                    
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20, gap: 8, marginTop: 40 }}>
                        <Button
                        style={{ marginVertical: 10, flex: 1 }}
                        leftContent={
                            <Ionicons name="backspace-outline" size={20} color={themeColor.primary} />
                        }
                        text="Cancel"
                        status="primary"
                        outline={true}
                        type="TouchableOpacity"
                        onPress={() => setShowImport(false)}
                        />

                        <Button
                        style={{ marginVertical: 10, flex: 1 }}
                        leftContent={
                            <Ionicons name="add-circle-outline" size={20} color={themeColor.white} />
                        }
                        text="Add to List"
                        status="primary"
                        type="TouchableOpacity"
                        onPress={() => {
                            let fieldset = form.items
                            fieldset.push({src: name, items: ingredients})
                            setForm({...form, items: fieldset})
                            setShowImport(false)
                            setShowRecipePicker(false)
                        }}
                        />
                    </View>
                    </View>
                </Modal>

            </View>
            }


        </ScrollView>

        <Toast />
      </Layout>
  );
}