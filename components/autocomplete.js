import React, { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';

const Autocomplete = ({ data, placeholder, onSelect, value }) => {
  const [query, setQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  const handleInputChange = (text) => {
    setQuery(text);
    if (text) {
      setFilteredData(data.filter(item => item.toLowerCase().includes(text.toLowerCase())));
    } else {
      setFilteredData([]);
    }
  };

  const handleSelectItem = (item) => {
    setQuery(item);
    setFilteredData([]);
    onSelect(item);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        defaultValue={value}
        onChangeText={handleInputChange}
        placeholder={placeholder}
        placeholderTextColor={"#60647e"}
      />
      {filteredData.length > 0 && (
        <FlatList
          style={styles.dropdown}
          data={filteredData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => handleSelectItem(item)}>
              <Text style={styles.text}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 50,
    color: "white",
    backgroundColor: "#262834",
    borderColor: "#60647e",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    fontFamily: "Ubuntu_400Regular"
  },
  dropdown: {
    marginTop: 5,
    borderColor: "#60647e",
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200
  },
  item: {
    padding: 10,
    borderBottomColor: '#60647e',
    borderBottomWidth: 1,
    color: "white",
    fontFamily: "Ubuntu_400Regular"
  },
  text: {
    color: "white",
    fontFamily: "Ubuntu_400Regular"
  }
});

export default Autocomplete;
