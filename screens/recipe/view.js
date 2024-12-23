import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, Platform, Dimensions, BackHandler, Image, Linking } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  Button, Layout, Section, SectionContent, Text,
  TextInput,
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";
import Toast from 'react-native-toast-message';
import { Client, Databases, Query, Storage } from "react-native-appwrite";
import _, { filter, set, update } from 'lodash';

import Dialog from "react-native-dialog";
import { MenuView } from '@react-native-menu/menu';
import Autocomplete from '../../components/autocomplete';

import { Fraction } from "fractional";
import RNJsxParser from 'react-native-jsx-parser';


const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);
const storage = new Storage(client);

const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
console.disableYellowBox = true;


let recipeId = NaN;
let currentRecipe = null;
let recipes = [];
let filterAllowed = []
let mealDB = []

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
            imageId: result.documents[i].imageId,
            stepImages: result.documents[i].stepImages,
            link: result.documents[i].link
          })
          filterAllowed.push(i);
        };
      }
})
})


export default function ViewRecipe ({ navigation, route }) {
  const { isDarkmode, setTheme } = useTheme();

  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [ingList, setIngList] = React.useState([]);
  const [servings, setServings] = React.useState(0);

  const [deleteVisible, setDeleteVisible] = React.useState(false);
  const [recipeIDToDel, setRIDTD] = React.useState(null)


    recipeId = route.params.idx; 

    const getData = async () => {
      const continueWithoutAccount = await AsyncStorage.getItem('continueWithoutAccount');
      if (continueWithoutAccount) {
        const recipeData = await AsyncStorage.getItem('recipeData');
        if (recipeData) {
          let r = JSON.parse(recipeData);
          recipes = []; filterAllowed = [];
          for (let i = 0; i < r.length; i++) {
            let ing = []
            for (let j = 0; j < r[i].ingredients.length; j++) {
              ing.push({
                ing: r[i].ingredients[j],
                serving_amt: r[i].serving_amt[j],
                serving_unit: r[i].serving_units[j]
              });
            }
            recipes.push({
              name: r[i].name,
              ing: ing,
              steps: r[i].steps,
              serving: r[i].servings,
              recipeId: r[i].recipeId, // Reference the unique ID
              stepImages: r[i].stepImages,
              link: r[i].link
            })
            filterAllowed.push(i);
          };

          currentRecipe = _.cloneDeep(recipes[recipeId]);
          let ingl = [];
          for (let i = 0; i < currentRecipe['ing'].length; i++) {
            ingl.push(currentRecipe['ing'][i]['ing']);
          }
          setIngList(ingl);
          setServings(currentRecipe['serving']);
          forceUpdate();
        }
      } else {
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
                  imageId: result.documents[i].imageId,
                  stepImages: result.documents[i].stepImages,
                  link: result.documents[i].link
                })
                filterAllowed.push(i);
              };
            }
      }).then(() => {
          currentRecipe = _.cloneDeep(recipes[recipeId])
          let ingl = []
          for (let i=0; i < currentRecipe['ing'].length; i++) {
          ingl.push(currentRecipe['ing'][i]['ing'])
          }
          setIngList(ingl)
  
          if (currentRecipe.imageId) {
            console.log(currentRecipe.imageId)
            const file = storage.getFileView("images", currentRecipe.imageId)
            currentRecipe.imageUrl = file
            forceUpdate()
          }
      })
      }
    }

  function handleCancel () {
    setDeleteVisible(false);
  }

  const updateData = async () => {
    let ing = [];
    let carbFood = [];

    console.log("start")

    const continueWithoutAccount = await AsyncStorage.getItem('continueWithoutAccount');
    if (continueWithoutAccount) {
      const recipeData = await AsyncStorage.getItem('recipeData');
      if (recipeData) {
        let r = JSON.parse(recipeData);
        recipes = []
        filterAllowed = []
        for (let i = 0; i < r.length; i++) {
          let ing = []
          for (let j = 0; j < r[i].ingredients.length; j++) {
            ing.push({
              ing: r[i].ingredients[j],
              serving_amt: r[i].serving_amt[j],
              serving_unit: r[i].serving_units[j]
            });
          }
          recipes.push({
            name: r[i].name,
            ing: ing,
            steps: r[i].steps,
            serving: r[i].servings,
            recipeId: r[i]['$id'],
            stepImages: r[i].stepImages,
            link: r[i].link
          })
          filterAllowed.push(i);
        };
      }
    } else {
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
            imageId: result.documents[i].imageId,
            stepImages: result.documents[i].stepImages,
            link: result.documents[i].link
          })
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
    forceUpdate()
  })
  };
}

  React.useEffect(() => {
    Toast.show({
        type: 'info',
        text1: 'Loading...',
    })

    const refreshData = navigation.addListener('focus', () => {
        updateData();
        getData().then(() => {
          forceUpdate()
          recipeId = route.params.idx; 
        setRIDTD(route.params.idx); 
        currentRecipe = _.cloneDeep(recipes[recipeId]); 
        console.log("currentRecipe", recipes)
        let ingl = []
        for (let i=0; i < currentRecipe['ing'].length; i++) {
        ingl.push(currentRecipe['ing'][i]['ing'])
        }
        setIngList(ingl)
        setServings(currentRecipe['serving'])
        })
    })

    Toast.hide()
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
          middleContent="View Recipe"
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
              <Dialog.Container visible={deleteVisible}>
                <Dialog.Title>Delete Recipe</Dialog.Title>
                <Dialog.Description>
                  Are you sure you wnat to delete this recipe? You cannot undo this action.
                </Dialog.Description>
                <Dialog.Button label="Cancel" onPress={handleCancel} />
                <Dialog.Button label="Delete" onPress={async () => {
                  setDeleteVisible(false)
                  Toast.show({
                    type: "info",
                    text1: "Deleting..."
                  })
                  const continueWithoutAccount = await AsyncStorage.getItem('continueWithoutAccount');
                  if (continueWithoutAccount) {
                    let localRecipes = await AsyncStorage.getItem('recipeData');
                    if (localRecipes) {
                      localRecipes = JSON.parse(localRecipes);
                      localRecipes = localRecipes.filter(r => r.recipeId !== recipes[recipeIDToDel].recipeId);
                      await AsyncStorage.setItem('recipeData', JSON.stringify(localRecipes));
                      Toast.show({
                        type: 'success',
                        text1: 'Recipe deleted successfully',
                      });
                      navigation.goBack();
                    }
                  } else {
                    db.deleteDocument("data", "recipes", recipes[recipeIDToDel].recipeId).then(() => {
                      navigation.goBack()
                      Toast.show({
                        type: "success",
                        text1: "Deleted!"
                      })
                    })
                  }
                }} />
              </Dialog.Container>

              <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                {currentRecipe &&
                  <>
                    <Image source={{
                      uri: currentRecipe.imageUrl ? currentRecipe.imageUrl.toString() : "https://sharex.shuchir.dev/u/YIQCWq.png"
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
                    <Text fontWeight="medium" style={{ fontSize: 35, marginVertical: 15, marginBottom: 30, textAlign: "center", textTransform: "capitalize" }}>{recipes[recipeId] ? recipes[recipeId]['name'] : "Loading..."}</Text>
                  </View>
                </SectionContent>
              </Section>

              <View style={{
                marginHorizontal: 20, marginTop: 20,
                display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 0
              }}>

                <View style={{
                  display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 20,
                  width: 75, gap: 8, alignSelf: "flex-start", marginLeft: 40
                }}>
                <Text style={{ fontSize: 22, textAlign: "center", marginRight: 15 }}><Ionicons name="people-outline" size={40} color={themeColor.white} /></Text>
                <Autocomplete
                  data={[]}
                  onChangeText={(value) => {

                    setServings(value)
                    
                    for (let i=0; i < recipes[recipeId]['ing'].length; i++) {
                      currentRecipe['ing'][i]['serving_amt'] = Number(recipes[recipeId]['ing'][i]['serving_amt']) / Number(recipes[recipeId]['serving']) * Number(value)
                    }
                    forceUpdate()
                  }}
                  defaultValue={recipes[recipeId] ? String(recipes[recipeId]['serving']) : ""}
                  placeholder="Servings"
                  keyboardType='numeric'
                  style={{
                    width: "auto"
                  }}
                />
                </View>


                <View style={{ marginBottom: 27, height: 50, marginLeft: 33 }}>
                  {currentRecipe && !currentRecipe.link &&
                  <Button
                    leftContent={
                      <Ionicons name="play-outline" size={20} color={themeColor.white} />
                    }
                    style={{ paddingHorizontal: 40 }}
                    text="Start"
                    status="primary"
                    type="TouchableOpacity"
                    onPress={() => { currentIndex = 0; navigation.navigate("Walkthrough", { idx: recipeId, servings: servings }) }}
                  />
                  }
                  {currentRecipe && currentRecipe.link &&
                  <Button
                    leftContent={
                      <Ionicons name="arrow-forward" size={20} color={themeColor.white} />
                    }
                    style={{ paddingHorizontal: 40 }}
                    text="Visit"
                    status="primary"
                    type="TouchableOpacity"
                    onPress={() => { Linking.openURL(currentRecipe.link) }}
                  />
                  }
                </View>


                <MenuView
                style={{ width: "auto", height: "auto", marginBottom: 30 }}
                  title="More Actions"
                  onPressAction={({ nativeEvent }) => {
                    if (nativeEvent.event == "edit") { navigation.navigate("Edit Recipe", { idx: recipeId }) } 
                    if (nativeEvent.event == "delete") setDeleteVisible(true)
                  }}
                  actions={[
                    {
                      id: 'edit',
                      title: 'Edit',
                      titleColor: themeColor.primary,
                      image: Platform.select({
                        ios: 'edit',
                        android: 'ic_menu_edit',
                      }),
                      imageColor: themeColor.primary,
                    },
                    {
                      id: 'delete',
                      title: 'Delete Recipe',
                      attributes: {
                        destructive: true,
                      },
                      image: Platform.select({
                        ios: 'trash',
                        android: 'ic_menu_delete',
                      }),
                    }, 
                  ]}
                  shouldOpenOnLongPress={false}
                >
                  <View style={{ padding: 5, backgroundColor: "#262834", borderRadius: 8, width: "auto" }}>
                    <Ionicons name="menu" size={40} color={themeColor.white} />
                  </View>
                </MenuView>
              </View>

              <Text style={{ fontSize: 25, fontWeight: "bold", marginHorizontal: 30, marginTop: 40, marginBottom: 5, textAlign: "center" }}>Ingredients</Text>

              <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ marginBottom: 20 }}>
                    {currentRecipe ? currentRecipe['ing'].map((ing, idx) => {
                      return (
                        <View style={{ marginHorizontal: 20, marginTop: 18 }}>
                          <Text style={{ fontSize: 18.5 }}>{ing.serving_amt > 0 && <Text style={{ color: themeColor.primary200, fontSize: 18.5 }}>{(new Fraction(ing.serving_amt)).toString()} {ing.serving_unit}</Text>} {ing.ing}</Text>
                        </View>
                      )
                    }) : ""}
                  </View>
                </SectionContent>
              </Section>

              <Text style={{ fontSize: 25, fontWeight: "bold", marginHorizontal: 30, marginTop: 40, marginBottom: 18, textAlign: "center" }}>Steps</Text>
              {recipes[recipeId] ? recipes[recipeId]['steps'].map((step, idx) => {
                let wordArr = step.split(' ');
                let text = [];
                wordArr.forEach(function(el) {
                  for (let i=0; i < ingList.length; i++) {
                    if (ingList[i].toLowerCase().includes(el.toLowerCase()) && !["a", "the", "of", "in", "cook", "to", "drain", "for", "all", "chop", "dice", "and", "I", "at", "an"].includes(el.toLowerCase())) {
                      el = `<Text style={{ color: "#adc8ff" }} onPress={() => handlePress('${(new Fraction(currentRecipe.ing[i].serving_amt)).toString()} ${currentRecipe.ing[i].serving_unit} ${currentRecipe.ing[i].ing}')}>${el}</Text>`;
                      el = el
                    } 
                  }
                  text.push(el);
                });
                text = "<Text>" + text.join('&nbsp;') + "</Text>";

                return (
                    <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginVertical: 7 }}>
                      <SectionContent>
                          <View style={{ marginBottom: 10 }}>
                              <Text style={{ fontSize: 17 }}>{idx + 1}.&nbsp;
                                  <RNJsxParser renderInWrapper={false} bindings={{ 
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
                                    jsx={text} />
                              </Text>
                              
                              {recipes[recipeId].stepImages[idx] &&
                              <Image source={{
                                uri: storage.getFileView("images", recipes[recipeId].stepImages[idx]).toString()
                              }}
                              resizeMode='cover'
                              style={{
                                width: Dimensions.get('window').width - 80,
                                height: 200,
                                borderRadius: 10,
                                marginTop: 10
                              }}
                              />
                              }
                          </View>
                      </SectionContent>
                    </Section>
                )
              }) : ""}
              <View style={{ marginBottom: 20, height: 20 }}></View>

            </View>

        </ScrollView>
      </Layout>
      <Toast />
    </KeyboardAvoidingView>

  );
}
