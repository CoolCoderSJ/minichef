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
  themeColor, TopNav, useTheme
} from "react-native-rapi-ui";
import Toast from 'react-native-toast-message';

// Initialize the variables

export default function UnitConversion () {    
  // Initialize the state
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const navigation = useNavigation();
  const { isDarkmode, setTheme } = useTheme();


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
          
        </ScrollView>
      </Layout>

      <Toast />
    </KeyboardAvoidingView>
  );
}