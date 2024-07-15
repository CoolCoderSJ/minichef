import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as React from "react";
import {
  KeyboardAvoidingView, ScrollView,
  View, Platform
} from "react-native";
import {
  Button, Layout, Section, SectionContent, TextInput,
  themeColor, TopNav, useTheme, Picker, Text
} from "react-native-rapi-ui";
import Toast from 'react-native-toast-message';

console.disableYellowBox = true;

// Initialize the variables

export default function UnitConversion () {    
  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const navigation = useNavigation();
  const { isDarkmode, setTheme } = useTheme();

  const [MPVStart, setMPVStart] = React.useState(null);
  const [MPVEnd, setMPVEnd] = React.useState(null);
  const [MPVStartValue, setMPVStartValue] = React.useState(null);
  const [MPVEndValue, setMPVEndValue] = React.useState(null);

  const [TPVStart, setTPVStart] = React.useState(null);
  const [TPVEnd, setTPVEnd] = React.useState(null);
  const [TPVStartValue, setTPVStartValue] = React.useState(null);
  const [TPVEndValue, setTPVEndValue] = React.useState(null);

  const [VPVStart, setVPVStart] = React.useState(null);
  const [VPVEnd, setVPVEnd] = React.useState(null);
  const [VPVStartValue, setVPVStartValue] = React.useState(null);
  const [VPVEndValue, setVPVEndValue] = React.useState(null);

  const massItems = [
      { label: 'Kilograms', value: 'kg' },
      { label: 'Grams', value: 'g' },
      { label: 'Milligrams', value: 'mg' },
      { label: 'Pounds', value: 'lb' },
      { label: 'Ounces', value: 'oz' },
  ];

    const tempItems = [
        { label: 'Celsius', value: 'c' },
        { label: 'Fahrenheit', value: 'f' },
    ];

    const volumeItems = [
        { label: 'Liters', value: 'l' },
        { label: 'Milliliters', value: 'ml' },
        { label: 'Gallons', value: 'gal' },
        { label: 'Quarts', value: 'qt' },
        { label: 'Pints', value: 'pt' },
        { label: 'Cups', value: 'cup' },
        { label: 'Fluid Ounces', value: 'fl oz' },
        { label: 'Tablespoon', value: 'tbsp' },
        { label: 'Teaspoon', value: 'tsp' },
    ]

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
          middleContent="Unit Conversion"
        />
        <ScrollView>

            <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
            <SectionContent>
                <View style={{ marginBottom: 20 }}>
                    <Text size="h3" fontWeight='medium' style={{ textAlign: "center" }}>Mass</Text>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 20, alignItems: "center", width: "100%", gap: 16 }}>
                    <View style={{ flex: 1 }}>
                        <View style={{ marginBottom: 20 }}>
                            <Picker
                                items={massItems}
                                value={MPVStart}
                                placeholder="Select a Unit"
                                onValueChange={(val) => {
                                    setMPVStart(val)
                                    let baseline
                                    if (MPVEnd === 'mg') {
                                        baseline = MPVEndValue / 1000
                                    }
                                    if (MPVEnd === 'g') {
                                        baseline = MPVEndValue
                                    }
                                    if (MPVEnd === 'kg') {
                                        baseline = MPVEndValue * 1000
                                    }

                                    if (MPVEnd === 'oz') {
                                        baseline = val * 28.35
                                    }
                                    if (MPVEnd === 'lb') {
                                        baseline = val * 453.592
                                    }

                                    let mg = baseline * 1000
                                    let g = baseline
                                    let kg = baseline / 1000
                                    let oz = baseline / 28.35
                                    let lb = baseline / 453.592

                                    if (val === 'mg') {
                                        setMPVStartValue(String(mg))
                                    }
                                    if (val === 'g') {
                                        setMPVStartValue(String(g))
                                    }
                                    if (val === 'kg') {
                                        setMPVStartValue(String(kg))
                                    }
                                    if (val === 'oz') {
                                        setMPVStartValue(String(baseline / 28.35))
                                    }
                                    if (val === 'lb') {
                                        setMPVStartValue(String(baseline / 453.592))
                                    }

                                    forceUpdate()
                                }}
                            />
                        </View>

                        <View>
                            <TextInput
                                placeholder="Starting value"
                                keyboardType="numeric"
                                defaultValue={MPVStartValue}
                                onChangeText={(val) => {
                                    setMPVStartValue(val)
                                    let baseline
                                    if (['mg', 'g', 'kg'].includes(MPVStart)) {
                                        if (MPVStart === 'mg') {
                                            baseline = val / 1000
                                        }
                                        if (MPVStart === 'g') {
                                            baseline = val
                                        }
                                        if (MPVStart === 'kg') {
                                            baseline = val * 1000
                                        }
                                    }
                                    else {
                                        if (MPVStart === 'oz') {
                                            baseline = val * 28.35
                                        }
                                        if (MPVStart === 'lb') {
                                            baseline = val * 453.592
                                        }
                                    }

                                    let mg = baseline * 1000
                                    let g = baseline
                                    let kg = baseline / 1000
                                    let oz = baseline / 28.35
                                    let lb = baseline / 453.592

                                    if (MPVEnd === 'mg') {
                                        setMPVEndValue(String(mg))
                                    }
                                    if (MPVEnd === 'g') {
                                        setMPVEndValue(String(g))
                                    }
                                    if (MPVEnd === 'kg') {
                                        setMPVEndValue(String(kg))
                                    }
                                    if (MPVEnd === 'oz') {
                                        setMPVEndValue(String(baseline / 28.35))
                                    }
                                    if (MPVEnd === 'lb') {
                                        setMPVEndValue(String(baseline / 453.592))
                                    }

                                    forceUpdate()
                                }}
                            />
                        </View>
                    </View>

                <View style={{ marginBottom: 20 }}>
                    <Text fontWeight='medium' style={{ fontSize: 19, textAlign: "center" }}>to</Text>
                </View>

                    <View style={{ flex: 1 }}>
                        <View style={{ marginBottom: 20 }}>
                            <Picker
                                items={massItems}
                                value={MPVEnd}
                                placeholder="Select a Unit"
                                onValueChange={(val) => {
                                    setMPVEnd(val)
                                    let baseline
                                    if (MPVStart === 'mg') {
                                        baseline = MPVStartValue / 1000
                                    }
                                    if (MPVStart === 'g') {
                                        baseline = MPVStartValue
                                    }
                                    if (MPVStart === 'kg') {
                                        baseline = MPVStartValue * 1000
                                    }

                                    if (MPVStart === 'oz') {
                                        baseline = val * 28.35
                                    }
                                    if (MPVStart === 'lb') {
                                        baseline = val * 453.592
                                    }
                                    

                                    let mg = baseline * 1000
                                    let g = baseline
                                    let kg = baseline / 1000
                                    let oz = baseline / 28.35
                                    let lb = baseline / 453.592

                                    if (val === 'mg') {
                                        setMPVEndValue(String(mg))
                                    }
                                    if (val === 'g') {
                                        setMPVEndValue(String(g))
                                    }
                                    if (val === 'kg') {
                                        setMPVEndValue(String(kg))
                                    }
                                    if (val === 'oz') {
                                        setMPVEndValue(String(oz))
                                    }
                                    if (val === 'lb') {
                                        setMPVEndValue(String(lb))
                                    }

                                    forceUpdate()
                                }}
                            />
                        </View>

                        <View>
                            <TextInput
                                placeholder="Converted value"
                                keyboardType="numeric"
                                value={MPVEndValue}
                                onChangeText={(val) => {
                                    setMPVEndValue(val)
                                    let baseline
                                    if (['mg', 'g', 'kg'].includes(MPVEnd)) {
                                        if (MPVEnd === 'mg') {
                                            baseline = val / 1000
                                        }
                                        if (MPVEnd === 'g') {
                                            baseline = val
                                        }
                                        if (MPVEnd === 'kg') {
                                            baseline = val * 1000
                                        }
                                    }
                                    else {
                                        if (MPVEnd === 'oz') {
                                            baseline = val * 28.35
                                        }
                                        if (MPVEnd === 'lb') {
                                            baseline = val * 453.592
                                        }
                                    }

                                    let mg = baseline * 1000
                                    let g = baseline
                                    let kg = baseline / 1000
                                    let oz = baseline / 28.35
                                    let lb = baseline / 453.592

                                    if (MPVStart === 'mg') {
                                        setMPVStartValue(String(mg))
                                    }
                                    if (MPVStart === 'g') {
                                        setMPVStartValue(String(g))
                                    }
                                    if (MPVStart === 'kg') {
                                        setMPVStartValue(String(kg))
                                    }
                                    if (MPVStart === 'oz') {
                                        setMPVStartValue(String(baseline / 28.35))
                                    }
                                    if (MPVStart === 'lb') {
                                        setMPVStartValue(String(baseline / 453.592))
                                    }

                                    forceUpdate()
                                }}
                            />
                        </View>
                    </View>
                </View>
            </SectionContent>
        </Section>

        <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
            <SectionContent>
                <View style={{ marginBottom: 20 }}>
                    <Text size="h3" fontWeight='medium' style={{ textAlign: "center" }}>Temperature</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 20, alignItems: "center", width: "100%", gap: 16 }}>
                    <View style={{ flex: 1 }}>
                    <View style={{ marginBottom: 20 }}>
                            <Picker
                                items={tempItems}
                                value={TPVStart}
                                placeholder="Select a Unit"
                                onValueChange={(val) => {
                                    setTPVStart(val)
                                    let baseline
                                    if (TPVEnd == "f") {
                                        baseline = (TPVEndValue - 32) * 5 / 9
                                    }
                                    else {
                                        baseline = TPVEndValue
                                    }

                                    let c = baseline
                                    let f = baseline * 9 / 5 + 32

                                    if (val === 'f') {
                                        setTPVStartValue(String(f))
                                    }
                                    if (val === 'c') {
                                        setTPVStartValue(String(c))
                                    }

                                    forceUpdate()
                                }}
                            />
                        </View>

                        <View>
                            <TextInput
                                placeholder="Starting value"
                                keyboardType="numeric"
                                defaultValue={TPVStartValue}
                                onChangeText={(val) => {
                                    setTPVStartValue(val)
                                    let baseline
                                    if (TPVStart == "f") {
                                        baseline = (val - 32) * 5 / 9
                                    }
                                    else {
                                        baseline = val
                                    }

                                    let c = baseline
                                    let f = baseline * 9 / 5 + 32

                                    if (TPVEnd === 'f') {
                                        setTPVEndValue(String(f))
                                    }
                                    if (TPVEnd === 'c') {
                                        setTPVEndValue(String(c))
                                    }

                                    forceUpdate()
                                }}
                            />
                        </View>
                    </View>

                    <View style={{ marginBottom: 20 }}>
                        <Text fontWeight='medium' style={{ fontSize: 19, textAlign: "center" }}>to</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <View style={{ marginBottom: 20 }}>
                            <Picker
                                items={tempItems}
                                value={TPVEnd}
                                placeholder="Select a Unit"
                                onValueChange={(val) => {
                                    setTPVEnd(val)
                                    let baseline
                                    if (TPVStart == "f") {
                                        baseline = (TPVStartValue - 32) * 5 / 9
                                    }
                                    else {
                                        baseline = TPVStartValue
                                    }

                                    let c = baseline
                                    let f = baseline * 9 / 5 + 32

                                    if (val === 'f') {
                                        setTPVEndValue(String(f))
                                    }
                                    if (val === 'c') {
                                        setTPVEndValue(String(c))
                                    }

                                    forceUpdate()
                                }}
                            />
                        </View>

                        <View>
                            <TextInput
                                placeholder="Converted value"
                                keyboardType="numeric"
                                value={TPVEndValue}
                                onChangeText={(val) => {
                                    setTPVEndValue(val)
                                    let baseline
                                    if (TPVEnd == "f") {
                                        baseline = (val - 32) * 5 / 9
                                    }
                                    else {
                                        baseline = val
                                    }

                                    let c = baseline
                                    let f = baseline * 9 / 5 + 32

                                    if (TPVStart === 'f') {
                                        setTPVStartValue(String(f))
                                    }
                                    if (TPVStart === 'c') {
                                        setTPVStartValue(String(c))
                                    }

                                    forceUpdate()
                                }}
                            />
                        </View>
                    </View>
                </View>
            </SectionContent>
        </Section>

        <Section style={{ paddingBottom: 0, marginHorizontal: 20, marginTop: 20 }}>
            <SectionContent>
                <View style={{ marginBottom: 20 }}>
                    <Text size="h3" fontWeight='medium' style={{ textAlign: "center" }}>Volume</Text>
                </View>
                <View style={{ marginBottom: 20 }}>
                    <TextInput
                        placeholder="Starting value"
                        keyboardType="numeric"
                        defaultValue={VPVStartValue}
                        onChangeText={(val) => {
                            setVPVStartValue(val)
                            let baseline
                            if (VPVStart == "l") baseline = val
                            if (VPVStart == "ml") baseline = val / 1000
                            if (VPVStart == "gal") baseline = val * 3.78541
                            if (VPVStart == "qt") baseline = val * 0.946353
                            if (VPVStart == "pt") baseline = val * 0.473176
                            if (VPVStart == "cup") baseline = val * 0.236588
                            if (VPVStart == "fl oz") baseline = val * 0.0295735
                            if (VPVStart == "tbsp") baseline = val * 0.0147868
                            if (VPVStart == "tsp") baseline = val * 0.00492892

                            let l = baseline
                            let ml = baseline * 1000
                            let gal = baseline / 3.78541
                            let qt = baseline / 0.946353
                            let pt = baseline / 0.473176
                            let cup = baseline / 0.236588
                            let fl_oz = baseline / 0.0295735
                            let tbsp = baseline / 0.0147868
                            let tsp = baseline / 0.00492892

                            if (VPVEnd === 'l') setVPVEndValue(String(l))
                            if (VPVEnd === 'ml') setVPVEndValue(String(ml))
                            if (VPVEnd === 'gal') setVPVEndValue(String(gal))
                            if (VPVEnd === 'qt') setVPVEndValue(String(qt))
                            if (VPVEnd === 'pt') setVPVEndValue(String(pt))
                            if (VPVEnd === 'cup') setVPVEndValue(String(cup))
                            if (VPVEnd === 'fl oz') setVPVEndValue(String(fl_oz))
                            if (VPVEnd === 'tbsp') setVPVEndValue(String(tbsp))
                            if (VPVEnd === 'tsp') setVPVEndValue(String(tsp))

                            forceUpdate()
                        }}
                    />
                </View>
                <View style={{ marginBottom: 20 }}>
                    <Picker
                        items={volumeItems}
                        value={VPVStart}
                        placeholder="Select a Unit"
                        onValueChange={(val) => {
                            setVPVStart(val)
                            let baseline
                            if (val == "l") baseline = VPVStartValue
                            if (val == "ml") baseline = VPVStartValue / 1000
                            if (val == "gal") baseline = VPVStartValue * 3.78541
                            if (val == "qt") baseline = VPVStartValue * 0.946353
                            if (val == "pt") baseline = VPVStartValue * 0.473176
                            if (val == "cup") baseline = VPVStartValue * 0.236588
                            if (val == "fl oz") baseline = VPVStartValue * 0.0295735
                            if (val == "tbsp") baseline = VPVStartValue * 0.0147868
                            if (val == "tsp") baseline = VPVStartValue * 0.00492892

                            let l = baseline
                            let ml = baseline * 1000
                            let gal = baseline / 3.78541
                            let qt = baseline / 0.946353
                            let pt = baseline / 0.473176
                            let cup = baseline / 0.236588
                            let fl_oz = baseline / 0.0295735
                            let tbsp = baseline / 0.0147868
                            let tsp = baseline / 0.00492892

                            if (VPVEnd === 'l') setVPVEndValue(String(l))
                            if (VPVEnd === 'ml') setVPVEndValue(String(ml))
                            if (VPVEnd === 'gal') setVPVEndValue(String(gal))
                            if (VPVEnd === 'qt') setVPVEndValue(String(qt))
                            if (VPVEnd === 'pt') setVPVEndValue(String(pt))
                            if (VPVEnd === 'cup') setVPVEndValue(String(cup))
                            if (VPVEnd === 'fl oz') setVPVEndValue(String(fl_oz))
                            if (VPVEnd === 'tbsp') setVPVEndValue(String(tbsp))
                            if (VPVEnd === 'tsp') setVPVEndValue(String(tsp))

                            forceUpdate()
                        }}
                    />
                </View>

                <View style={{ marginBottom: 20 }}>
                    <Text fontWeight='medium' style={{ fontSize: 19, textAlign: "center" }}>to</Text>
                </View>

                <View style={{ marginBottom: 20 }}>
                    <TextInput
                        placeholder="Converted value"
                        keyboardType="numeric"
                        value={VPVEndValue}
                        onChangeText={(val) => {
                            setVPVEndValue(val)
                            let baseline
                            if (VPVEnd == "l") baseline = val
                            if (VPVEnd == "ml") baseline = val / 1000
                            if (VPVEnd == "gal") baseline = val * 3.78541
                            if (VPVEnd == "qt") baseline = val * 0.946353
                            if (VPVEnd == "pt") baseline = val * 0.473176
                            if (VPVEnd == "cup") baseline = val * 0.236588
                            if (VPVEnd == "fl oz") baseline = val * 0.0295735
                            if (VPVEnd == "tbsp") baseline = val * 0.0147868
                            if (VPVEnd == "tsp") baseline = val * 0.00492892

                            let l = baseline
                            let ml = baseline * 1000
                            let gal = baseline / 3.78541
                            let qt = baseline / 0.946353
                            let pt = baseline / 0.473176
                            let cup = baseline / 0.236588
                            let fl_oz = baseline / 0.0295735
                            let tbsp = baseline / 0.0147868
                            let tsp = baseline / 0.00492892

                            if (VPVStart === 'l') setVPVStartValue(String(l))
                            if (VPVStart === 'ml') setVPVStartValue(String(ml))
                            if (VPVStart === 'gal') setVPVStartValue(String(gal))
                            if (VPVStart === 'qt') setVPVStartValue(String(qt))
                            if (VPVStart === 'pt') setVPVStartValue(String(pt))
                            if (VPVStart === 'cup') setVPVStartValue(String(cup))
                            if (VPVStart === 'fl oz') setVPVStartValue(String(fl_oz))
                            if (VPVStart === 'tbsp') setVPVStartValue(String(tbsp))
                            if (VPVStart === 'tsp') setVPVStartValue(String(tsp))

                            forceUpdate()
                        }}
                    />
                </View>
                <View style={{ marginBottom: 20 }}>
                    <Picker
                        items={volumeItems}
                        value={VPVEnd}
                        placeholder="Select a Unit"
                        onValueChange={(val) => {
                            setVPVEnd(val)
                            let baseline
                            if (val == "l") baseline = VPVEndValue
                            if (val == "ml") baseline = VPVEndValue / 1000
                            if (val == "gal") baseline = VPVEndValue * 3.78541
                            if (val == "qt") baseline = VPVEndValue * 0.946353
                            if (val == "pt") baseline = VPVEndValue * 0.473176
                            if (val == "cup") baseline = VPVEndValue * 0.236588
                            if (val == "fl oz") baseline = VPVEndValue * 0.0295735
                            if (val == "tbsp") baseline = VPVEndValue * 0.0147868
                            if (val == "tsp") baseline = VPVEndValue * 0.00492892

                            let l = baseline
                            let ml = baseline * 1000
                            let gal = baseline / 3.78541
                            let qt = baseline / 0.946353
                            let pt = baseline / 0.473176
                            let cup = baseline / 0.236588
                            let fl_oz = baseline / 0.0295735
                            let tbsp = baseline / 0.0147868
                            let tsp = baseline / 0.00492892

                            if (VPVStart === 'l') setVPVStartValue(String(l))
                            if (VPVStart === 'ml') setVPVStartValue(String(ml))
                            if (VPVStart === 'gal') setVPVStartValue(String(gal))
                            if (VPVStart === 'qt') setVPVStartValue(String(qt))
                            if (VPVStart === 'pt') setVPVStartValue(String(pt))
                            if (VPVStart === 'cup') setVPVStartValue(String(cup))
                            if (VPVStart === 'fl oz') setVPVStartValue(String(fl_oz))
                            if (VPVStart === 'tbsp') setVPVStartValue(String(tbsp))
                            if (VPVStart === 'tsp') setVPVStartValue(String(tsp))

                            forceUpdate()
                        }}
                    />
                </View>
            </SectionContent>
        </Section>

        </ScrollView>
      </Layout>
      <Toast />
    </KeyboardAvoidingView>
  );
}