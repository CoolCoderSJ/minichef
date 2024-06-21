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

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);


const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
const delkey = async (key, value) => { try { await AsyncStorage.removeItem(key) } catch (e) { console.log(e) } }
const getAll = async () => { try { const keys = await AsyncStorage.getAllKeys(); return keys } catch (error) { console.error(error) } }

let userId, mealDB = [], ing = [], carbFood = []
get("login").then(res => userId = res)

export default function CreateGrocery ({ navigation, route }) {

  const { isDarkmode, setTheme } = useTheme();
  const [form, setForm] = React.useState({ name: "", items: [] });
  const [filterList, setFilterList] = React.useState([]);
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
    const refreshData = navigation.addListener('focus', () => {
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
      })
      return refreshData;
  }, [navigation])

  const updateField = (id, field, value) => {
    let fieldset = form.items
    fieldset[id][field] = value
    setForm({...form, items: fieldset})
  }

    const updateFood = (idx, id, value, field) => {
        let fieldset = form.items
        fieldset[idx].items[id][field] = value
        setForm({...form, items: fieldset})
    }

    const handleAddIng = (idx) => {
        let fieldset = form.items[idx].items
        fieldset.push({name: "", amount: "", unit: ""})
        setForm({...form, items: fieldset})
    }

    const handleRemoveIng = (idx, id) => {
        let fieldset = form.items[idx, id].items
        fieldset.splice(id, 1)
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
                <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                    <SectionContent>
                        <View style={{ marginBottom: 20 }}>
                        <TextInput
                            onChangeText={(value) => {
                            updateField(idx, "src", value);
                            }}
                            placeholder="Category Name"
                        />
                        </View>
                    </SectionContent>
                </Section>

                {form.items[idx].items.map((item, id) => {
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
                            onSelect={(item) => {
                            updateFood(idx, id, item, "name");
                            }}
    
                            onChangeText={e => {
                            updateFood(idx, id, e, "name")
                            }}
                            />
                            </View>
    
                            <View style={{ flexDirection: "row", gap: 8 }}> 
    
                            <View style={{ marginVertical: 20, flex: 1 }}>
                                <TextInput
                                placeholder="Amount"
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
                                onSelect={(item) => {
                                updateFood(idx, id, item, "unit");
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

            <Button
            style={{ marginVertical: 10, marginHorizontal: 20 }}
            leftContent={
                <Ionicons name="add-circle-outline" size={20} color={themeColor.white} />
            }
            text="Add New Food Item"
            status="primary"
            type="TouchableOpacity"
            onPress={() => handleAddIng(idx)}
            />
            <Button 
            style={{ marginVertical: 10, marginHorizontal: 20 }}
            leftContent={
                <Ionicons name="trash-outline" size={20} color={themeColor.white} />
            }
            text="Remove Category"
            status="danger"
            type="TouchableOpacity"
            onPress={handleRemoveCat}
            />

                </>
            );
            })}

            <Button
            style={{ marginVertical: 10, marginHorizontal: 20 }}
            leftContent={
                <Ionicons name="add-circle-outline" size={20} color={themeColor.white} />
            }
            text="Add New Category"
            status="primary"
            type="TouchableOpacity"
            onPress={handleAddCat}
            />

            </View>
        </ScrollView>

        <Toast />
      </Layout>
  );
}