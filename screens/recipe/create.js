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
import { Client, Databases, Query, Permission, Role, ID, Storage } from "react-native-appwrite";
import Autocomplete from '../../components/autocomplete';
import SlidePicker from "react-native-slidepicker";
import {launchImageLibrary} from 'react-native-image-picker';
import Dialog from "react-native-dialog";

const client = new Client()
    .setEndpoint('https://appwrite.shuchir.dev/v1') // Your API Endpoint
    .setProject('minichef'); // Your project ID

const db = new Databases(client);
const storage = new Storage(client);

const setObj = async (key, value) => { try { const jsonValue = JSON.stringify(value); await AsyncStorage.setItem(key, jsonValue) } catch (e) { console.log(e) } }
const get = async (key) => { try { const value = await AsyncStorage.getItem(key); if (value !== null) { try { return JSON.parse(value) } catch { return value } } } catch (e) { console.log(e) } }
console.disableYellowBox = true;
const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);


let recipe = {
    name: "",
    serving: "",
    image: "",
    ing: [],
    steps: [],
    stepImages: [""],
    recipeId: ID.unique()
};

let unitBeingEdited = null;
let customUnit = "";

let sliderData = [
    [
      {
        "label": "Tablespoon(s)",
        "value": "tbsp"
      },
      {
        "label": "Teaspoon(s)",
        "value": "tsp"
      },
      {
        "label": "Cups",
        "value": "cups"
      },
        {
            "label": "Gram(s)",
            "value": "g"
        },
        {
            "label": "Kilogram(s)",
            "value": "kg"
        },
        {
            "label": "Milliliter(s)",
            "value": "ml"
        },
        {
            "label": "Liter(s)",
            "value": "l"
        },
        {
            "label": "Ounce(s)",
            "value": "oz"
        },
        {
            "label": "Pound(s)",
            "value": "lb"
        },
        {
            "label": "Pint(s)",
            "value": "pt"
        },
        {
            "label": "Quart(s)",
            "value": "qt"
        },
        {
            "label": "Gallon(s)",
            "value": "gal"
        },
        {
            "label": "Fluid Ounce(s)",
            "value": "fl oz"
        },
        {
            "label": "Pinch",
            "value": "pinch"
        },
        {
            "label": "Custom Unit",
            "value": "custom"
        }
    ],
  ]
let stage = 1;
let userId
get("login").then(res => userId = res)


export default function CreateRecipe () {
  const { isDarkmode, setTheme } = useTheme();
  const navigation = useNavigation();

  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [mealsList, setMealsList] = React.useState([]);
  const [fields, setFields] = React.useState([{}]);
  const [steps, setSteps] = React.useState([{}]);
  const [filterList, setFilterList] = React.useState([{}]);
  const [sliderVisible, setSliderVisible] = React.useState(false);
  const [customVisible, setCustomVisible] = React.useState(false);
  const { height: screenHeight } = Dimensions.get('window');


  React.useEffect(() => {
    stage = 1;

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
    recipe['stepImages'].push("")
  }

  function handleRemoveStep(i) {
    const values = [...steps];
    values.splice(i, 1);
    setSteps(values);
    recipe['steps'] = values;
    recipe['stepImages'].splice(i, 1);
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
      autoHide: false
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

    let data = {
        uid: userId,
        ingredients: ingredients,
        serving_units: serving_units,
        serving_amt: serving_amt,
        steps: recipe.steps,
        name: recipe.name,
        servings: Number(recipe.serving),
        stepImages: []
    }

    if (recipe.image != "") {
        storage.createFile("images", ID.unique(), recipe.image, [
            Permission.read(Role.user(userId)),
            Permission.write(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
        ])
        .then(file => {
            data['imageId'] = file.$id
        })
        .catch(err => console.error(err))
    }
    
    for (let i=0; i<recipe.stepImages.length; i++) {
        data.stepImages.push("")
    }

    for (let i=0; i<recipe.stepImages.length; i++) {
        if (recipe.stepImages[i] != "") {
            storage.createFile("images", ID.unique(), recipe.stepImages[i], [
                Permission.read(Role.user(userId)),
                Permission.write(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ])
            .then(file => {
                data['stepImages'][i] = file.$id
            })
            .catch(err => console.error(err))
        }
    }

    while ((recipe.image != "" && data['imageId'] == undefined) || countOccurrences(data['stepImages'], "") > countOccurrences(recipe.stepImages, "")) {
        await new Promise(r => setTimeout(r, 500));
    }
    try {
    await db.createDocument("data", "recipes", recipe.recipeId, data, [
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

    catch (err) {
        console.warn(err)
        try {
            await db.updateDocument("data", "recipes", recipe.recipeId, data, [
                Permission.read(Role.user(userId)),
                Permission.write(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]);
        }
        catch (err) {
            console.error(err)
        }

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
          middleContent="Create Recipe"
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

                {stage == 1 &&
                <>

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

                <Button
                style={{ marginTop: 10, marginHorizontal: 20 }}
                leftContent={
                    <Ionicons name="image" size={20} color={themeColor.white} />
                }
                text="Upload Image"
                status="primary"
                type="TouchableOpacity"
                onPress={() => { 
                    launchImageLibrary({ mediaType: 'photo', includeBase64: true }, (response) => {
                        if (response.didCancel) {
                            console.log('User cancelled image picker');
                        } 
                        else if (response.errorMessage) {
                            console.log('ImagePicker Error: ', response.errorMessage);
                        } 
                        else {
                            recipe.image = response.assets[0]
                            recipe.image.size = recipe.image.fileSize
                            recipe.image.name = recipe.image.fileName
                            forceUpdate();
                        }
                    })
                 }}
                />

                <View style={{ flexDirection: "row", marginHorizontal: 20, marginTop: 15, alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ color: themeColor.primary300 }}>
                        {recipe.image.name ? recipe.image.name + " selected" : "No image selected"}
                    </Text>

                    {recipe.image != "" &&
                        <TouchableOpacity onPress={() => { recipe.image = ""; recipe.image.name = ""; forceUpdate() }}>
                            <Text style={{ color: themeColor.danger }}>Remove Image</Text>
                        </TouchableOpacity>
                    }
                </View>

                <Button
                style={{ marginTop: 50, marginHorizontal: 20 }}
                leftContent={
                    <Ionicons name="arrow-forward" size={20} color={themeColor.white} />
                }
                text="Next"
                status="primary"
                type="TouchableOpacity"
                onPress={() => { stage = 2; forceUpdate(); }}
                />

                </>
                }

                {stage == 2 &&
                <>
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

                            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}> 

                            <View style={{ marginVertical: 20, flex: 1 }}>
                                <Autocomplete
                                data={[]}
                                placeholder="Amount"
                                onChangeText={e => {
                                    handleChange(idx, "serving_amt", Number(e))
                                }}
                                defaultValue={String(field.serving_amt).replace("undefined", "")}
                                keyboardType='numeric'
                                style={{ height: 50 }}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                            <Button 
                                text={field.serving_unit ? field.serving_unit : "Unit"}
                                status="primary"
                                outline={true}
                                type="TouchableOpacity"
                                onPress={() => {
                                    unitBeingEdited = idx
                                    setSliderVisible(true)
                                }}
                                style={{ height: 50 }}
                            />
                            </View>

                            <View>
                            <Button
                                text={<Ionicons name="trash-outline" size={20} color={themeColor.danger} />}
                                outline={true}
                                status="danger"
                                type="TouchableOpacity"
                                onPress={() => { handleRemoveIng(idx) }}
                                style={{ height: 50 }}
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

                <View style={{ marginTop: 50, flexDirection: "row", marginHorizontal: 20, gap: 20 }}>
                    <Button
                        style={{ marginVertical: 10, flex: 1 }}
                        leftContent={
                            <Ionicons name="arrow-back" size={20} color={themeColor.primary} />
                        }
                        text="Back"
                        status="primary"
                        outline={true}
                        type="TouchableOpacity"
                        onPress={() => { stage = 1; forceUpdate(); }}
                    />

                    <Button
                        style={{ marginVertical: 10, flex: 1 }}
                        leftContent={
                            <Ionicons name="arrow-forward" size={20} color={themeColor.white} />
                        }
                        text="Next"
                        status="primary"
                        type="TouchableOpacity"
                        onPress={() => { stage = 3; forceUpdate(); }}
                    />

                </View>
                </>
                }


                {stage == 3 &&
                <>
                {steps.map((step, idx) => {
                return (
                    <Section style={{ marginHorizontal: 20, marginTop: 20 }}>
                    <SectionContent>

                        <View style={{ marginVertical: 10 }}>
                        <TextInput
                            placeholder="Enter a step.."
                            onChangeText={e => {
                            handleChangeStep(idx, e)
                            }}
                            defaultValue={step}
                        />
                        </View>

                        <View style={{ marginVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <Button
                        leftContent={
                            <Ionicons name="image" size={20} color={themeColor.primary} />
                        }
                        style={{ flex: 3 }}
                        text={recipe.stepImages[idx] ? recipe.stepImages[idx].name : "Add Image"}
                        status="primary"
                        type="TouchableOpacity"
                        outline={true}
                        onPress={() => { 
                            launchImageLibrary({ mediaType: 'photo', includeBase64: true }, (response) => {
                                if (response.didCancel) {
                                    console.log('User cancelled image picker');
                                } 
                                else if (response.errorMessage) {
                                    console.log('ImagePicker Error: ', response.errorMessage);
                                } 
                                else {
                                    recipe.stepImages[idx] = response.assets[0]
                                    recipe.stepImages[idx].size = recipe.stepImages[idx].fileSize
                                    recipe.stepImages[idx].name = recipe.stepImages[idx].fileName
                                    forceUpdate();
                                }
                            })
                        }}
                        />
                        <Button
                            text={<Ionicons name="trash-outline" size={20} color={themeColor.danger} />}
                            status="danger"
                            type="TouchableOpacity"
                            onPress={() => { handleRemoveStep(idx) }}
                            outline={true}
                            style={{ flex: 1 }}
                        />
                        </View>

                        { recipe.stepImages[idx] &&
                            <TouchableOpacity onPress={() => { recipe.stepImages[idx] = ""; forceUpdate() }}>
                                <Text style={{ color: themeColor.danger500 }}>Remove Image</Text>
                            </TouchableOpacity>
                        }

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
                
                <View style={{ marginTop: 50, flexDirection: "row", marginHorizontal: 20, gap: 20 }}>
                    <Button
                        style={{ marginVertical: 10, flex: 1 }}
                        leftContent={
                            <Ionicons name="arrow-back" size={20} color={themeColor.primary} />
                        }
                        text="Back"
                        status="primary"
                        outline={true}
                        type="TouchableOpacity"
                        onPress={() => { stage = 2; forceUpdate(); }}
                    />

                    <Button
                        style={{ marginVertical: 10, flex: 1 }}
                        leftContent={
                            <Ionicons name="arrow-forward" size={20} color={themeColor.white} />
                        }
                        text="Finish"
                        status="primary"
                        type="TouchableOpacity"
                        onPress={() => {
                            save().then(() => {
                                navigation.goBack()
                            })
                        }}
                    />
                </View>
                </>
                }

            </View>
        </ScrollView>

        <Dialog.Container visible={customVisible}>
            <Dialog.Title>Enter Custom Unit</Dialog.Title>
            <Dialog.Input placeholder="enter custom unit here..." onChangeText={res => {customUnit = res; console.log(res)}} />
            <Dialog.Button label="Cancel" onPress={() => setCustomVisible(false)} />
            <Dialog.Button label="Save" onPress={() => {
                console.log(customUnit)
                handleChange(unitBeingEdited, "serving_unit", customUnit)
                setCustomVisible(false)
                forceUpdate();
            }} />
        </Dialog.Container>
                
        <SlidePicker.Parallel
            visible={sliderVisible}
            dataSource={sliderData}
            values={["Select a unit"]}
            wheels={1}
            checkedTextStyle={{ fontWeight: 'bold', color: themeColor.primary300 }}
            normalTextStyle={{ fontSize: 14, height: 60, color: themeColor.primary100 }}
            onCancelClick={() => setSliderVisible(false)}
            onConfirmClick={res => {
                console.log(res)
                if (res[0].value != "custom") handleChange(unitBeingEdited, "serving_unit", res[0].value)
                else {
                    customUnit = "";
                    setCustomVisible(true)
                }
                setSliderVisible(false)
                forceUpdate();
            }}
            itemHeight={100}
            animationDuration={100}
            contentBackgroundColor="#1a1820"
            itemDividerColor="#1a1820"
            titleText="Select a unit"
            cancelText="Cancel"
            onMaskClick={() => setSliderVisible(false)}
            
        />
      </Layout>
      <Toast />
    </KeyboardAvoidingView>

  );
}