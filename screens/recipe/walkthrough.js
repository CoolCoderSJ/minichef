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

import { Fraction } from "fractional";
import { SwipeablePanel } from 'rn-swipeable-panel';
import RNJsxParser from 'react-native-jsx-parser';
import Swiper from 'react-native-deck-swiper';

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
let currentIndex = 0;
let jsxText = "";
let cardIndex = 0;

let userId
get("login").then(res => userId = res)



export default function Walkthrough ({ navigation, route }) {
  const { isDarkmode, setTheme } = useTheme();

  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [servings, setServings] = React.useState(null);
  const [ingList, setIngList] = React.useState([]);

  const swipeRef = React.useRef(null);

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

  recipeId = route.params.idx;

  React.useEffect(() => {
    currentIndex = 0;
    const fetchData = async () => {
      const continueWithoutAccount = await AsyncStorage.getItem('continueWithoutAccount');
      if (continueWithoutAccount) {
        const recipeData = await AsyncStorage.getItem('recipeData');
        if (recipeData) {
          let r = JSON.parse(recipeData);
          recipes = []
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
              recipeId: r[i]['$id']
            })
          }
        }
      } else {
        const result = await db.listDocuments("data", "recipes", [Query.equal("uid", [userId])]);
        if (result.total > 0) {
          for (let i = 0; i < result.documents.length; i++) {
            let ing = [];
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
            });
          }
        }
      }
      currentRecipe = _.cloneDeep(recipes[recipeId]);
      setServings(route.params.servings);

      for (let i = 0; i < recipes[recipeId]['ing'].length; i++) {
        currentRecipe['ing'][i]['serving_amt'] = Number(recipes[recipeId]['ing'][i]['serving_amt']) / Number(recipes[recipeId]['serving']) * Number(route.params.servings);
      }

      let ingl = [];
      for (let i = 0; i < currentRecipe['ing'].length; i++) {
        ingl.push(currentRecipe['ing'][i]['ing']);
      }
      setIngList(ingl);
    };

    fetchData();
  }, []);


  const arrayOfNums = (num) => {
    let arr = [];
    for (let i=0; i < num; i++) {
      arr.push(i)
    }
    return arr;
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
          middleContent="Recipe Walkthrough"

          rightContent={currentIndex > 0 &&
            <Ionicons
                name="nutrition"
                size={20}
                color={isDarkmode ? themeColor.white : themeColor.black}
            />
          }
          rightAction={() => openPanel() }
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

            <View style={{ flex: 1 }}>
              <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
                <SectionContent>
                  <View style={{ marginBottom: 20 }}>
                    <Text fontWeight="bold" style={{ fontSize: 35, marginVertical: 15, marginBottom: 20, textAlign: "center" }}>{recipes[recipeId] ? recipes[recipeId]['name'] : ""}</Text>
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
                    {currentRecipe ? currentRecipe['ing'].map((ing, idx) => {
                      return (
                        <View style={{ marginHorizontal: 20, marginTop: 10 }}>
                          <Text style={{ fontSize: 17 }}>{ing.serving_amt > 0 && <Text style={{ color: themeColor.primary200 }}>{(new Fraction(ing.serving_amt)).toString()} {ing.serving_unit}</Text>} {ing.ing}</Text>
                        </View>
                      )
                    }) : ""}
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
                    onPress={() => navigation.goBack() }
                  />

                  <Button
                    style={{ marginVertical: 5, marginHorizontal: 20, flex: 1, width: "auto" }}
                    rightContent={
                      <Ionicons name="chevron-forward" size={20} color={themeColor.white} />
                    }
                    text="Next"
                    status="primary"
                    type="TouchableOpacity"
                    onPress={() => { currentIndex += 1; forceUpdate() }}
                  />
                </View>
              </>
              }

              {currentIndex > 0 &&
              <View style={{ height: "100%" }}>
                <View style={{ flex: 1, paddingTop: 0, marginTop: 0, marginBottom: 20 }}>
                <Swiper
                    cards={arrayOfNums(currentRecipe.steps.length)}
                    renderCard={(card) => {
                      let step = currentRecipe.steps[card];
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

                        return (
                          <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 0, height: 300 }}>
                          <SectionContent>
                            <View style={{ marginBottom: 0 }}>
                              <Text style={{ fontSize: 25, marginVertical: 7, fontWeight: "bold", textAlign: "center" }}>Step {card + 1}</Text>
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
                        )
                    }}
                    onSwiped={(cardIndex) => {console.log(cardIndex)}}
                    cardIndex={cardIndex}
                    backgroundColor={'transparent'}
                    verticalSwipe={false}
                    goBackToPreviousCardOnSwipeRight={true}
                    showSecondCard={false}
                    stackSize={2}
                    swipeBackCard={true}
                    onSwipedLeft={(cI) => {cardIndex = cI + 1; console.log(cardIndex); forceUpdate()}}
                    onSwipedRight={(cI) => {cardIndex = cI - 1; console.log(cardIndex); forceUpdate()}}
                    ref={swipeRef}
                    >
                </Swiper>
                </View>
                
                <View style={{ gap: 4, flexDirection: "row", marginVertical: 20, height: "auto" }}>
                  <Button
                    style={{ marginVertical: 5, marginHorizontal: 20, flex: 1, width: "auto" }}
                    leftContent={
                      <Ionicons name="chevron-back" size={20} color={themeColor.white} />
                    }
                    text="Back"
                    color="black100"
                    type="TouchableOpacity"
                    onPress={() => { swipeRef.current.swipeRight(); forceUpdate() }}
                  />

                  {(cardIndex < currentRecipe.steps.length - 1 && cardIndex >= 0) &&
                  <Button
                    style={{ marginVertical: 5, marginHorizontal: 20, flex: 1, width: "auto" }}
                    rightContent={
                      <Ionicons name="chevron-forward" size={20} color={themeColor.white} />
                    }
                    text="Next"
                    status="primary"
                    type="TouchableOpacity"
                    onPress={() => { swipeRef.current.swipeLeft(); forceUpdate() }}
                  />
                  }
                </View>

                <View style={{ flex: 1 }}></View>

                <SwipeablePanel {...ingPanelProps} isActive={isPanelActive} style={{ backgroundColor: "#262834", paddingBottom: 20, flex: 1, flexGrow: 1, minHeight: screenHeight + 300, marginBottom: 50 }} scrollViewProps={{ flex: 1, flexGrow: 1 }} closeOnTouchOutside={true} noBar={true}>
                  <ScrollView contentContainerStyle={{ flexGrow: 1, minHeight: screenHeight }}>
                    <Text style={{ fontSize: 25, fontWeight: "bold", marginHorizontal: 30, marginTop: 40, marginBottom: 5, textAlign: "center" }}>Ingredients</Text>

                    {currentRecipe ? currentRecipe['ing'].map((ing, idx) => {
                      return (
                          <Text style={{ fontSize: 18.5, marginHorizontal: 20, marginTop: 18 }}>{ing.serving_amt > 0 && <Text style={{ color: themeColor.primary200, fontSize: 18.5 }}>{(new Fraction(ing.serving_amt)).toString()} {ing.serving_unit}</Text>} {ing.ing}</Text>
                      )
                    }) : ""}
                  </ScrollView>
                </SwipeablePanel>

              </View>
              }
            </View>

        </ScrollView>
      </Layout>
      <Toast />
    </KeyboardAvoidingView>

  );
}
