import React, { useEffect, useState, useRef } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import tw, { useDeviceContext } from 'twrnc';
import MasonryList from '@react-native-seoul/masonry-list';
import { store } from './store';
import {
  useSearchNotesQuery,
  useAddNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation
} from './db';

// Home Screen
function HomeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const { data: notes = [], error, isLoading } = useSearchNotesQuery(search);

  // For rendering each note
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Edit', { note: item })}
      // appearance of note
      style={tw`w-[95%] mb-1 mx-auto bg-purple-300 rounded-sm px-1`}
    >
      <Text style={tw`text-lg font-bold`}>{item.title}</Text>
      <Text>{item.content}</Text>
    </TouchableOpacity>
  );

  if (isLoading) return <ActivityIndicator size="large" color="#0000ff" />; // Loading indicator
  if (error) return <Text>Error loading notes: {error.message}</Text>; // Error

  return (
    <View style={tw`flex-1 bg-purple-400`}>
      {/* Search bar */}
      <TextInput
        style={tw`p-2 m-2 bg-white rounded`}
        placeholder="Search Notes"
        value={search}
        onChangeText={setSearch}
      />
      {/* Notes grid */}
      <MasonryList
        data={notes}
        numColumns={2}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
      {/* New note button to go to edit screen */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Edit', { note: { title: '', content: '' } })}
        style={tw`bg-blue-500 rounded-full absolute bottom-8 right-8 w-12 h-12 items-center justify-center`}
      >
        <Text style={tw`text-white text-3xl`}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// Edit Screen
function EditScreen({ route, navigation }) {
  const { note: initialNote } = route.params;
  const [note, setNote] = useState(initialNote);
  const contentInputRef = useRef(null);
  const [addNote, { error: addError }] = useAddNoteMutation();
  const [updateNote, { error: updateError }] = useUpdateNoteMutation();
  const [deleteNote, { error: deleteError }] = useDeleteNoteMutation();

  // Header title on edit screen is note title
  useEffect(() => {
    navigation.setOptions({ title: note.title || 'New Note' });
  }, [navigation, note.title]);

  // Save the note
  useEffect(() => {
    const saveNote = async () => {
      // With existing notes
      if (note.id) {
        await updateNote({
          id: note.id,
          title: note.title,
          content: note.content,
        });
      // With new notes
      } else {
        const result = await addNote({
          title: note.title,
          content: note.content,
        });
        setNote({
          ...result.data,
        });
        navigation.setOptions({ title: result.data.title });
      }
    };

    const timeoutId = setTimeout(saveNote, 500);
    return () => clearTimeout(timeoutId);
  }, [note, addNote, updateNote, navigation]);

  // Focus on note content when opened
  useEffect(() => {
    if (contentInputRef.current) {
      contentInputRef.current.focus();
    }
  }, []);

  // Delete action
  const handleDelete = async () => {
    if (note.id) {
      await deleteNote({
        id: note.id,
      });
    }
    navigation.goBack();
  };

  return (
    // Background style
    <View style={tw`flex-1 bg-purple-400 p-4`}> 
      {addError && <Text>Error adding note: {addError.message}</Text>}
      {updateError && <Text>Error updating note: {updateError.message}</Text>}
      {deleteError && <Text>Error deleting note: {deleteError.message}</Text>}
      {/* Title bar */}
      <TextInput
        style={tw`p-2 mb-4 bg-white rounded`}
        placeholder="Title"
        value={note.title}
        onChangeText={(text) => setNote((prev) => ({ ...prev, title: text }))}
      />
      {/* Note content section */}
      <TextInput
        style={tw`p-2 bg-white rounded`}
        placeholder="Content"
        multiline
        value={note.content}
        onChangeText={(text) => setNote((prev) => ({ ...prev, content: text }))}
        ref={contentInputRef}
      />
      {/* Delete button */}
      <TouchableOpacity
        onPress={handleDelete}
        style={tw`bg-slate-500 rounded-full absolute top-8 right-8 w-12 h-12 items-center justify-center`}
      >
        <Text style={tw`text-white text-3xl`}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

const Stack = createNativeStackNavigator();

// Main App Component
export default function App() {
  // Dark mode toggle functionality
  const [isDarkMode, setIsDarkMode] = useState(false);
  useDeviceContext(tw);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          {/* Main header */}
          <Stack.Screen
            name="Notes"
            component={HomeScreen}
            options={{
              headerStyle: tw`${isDarkMode ? 'bg-purple-900' : 'bg-purple-300'}`,
              headerTintColor: '#fff',
              headerTitleStyle: tw`font-bold`,
              headerTitleAlign: 'center',
            }}
          />
          {/* Edit screen header */}
          <Stack.Screen
            name="Edit"
            component={EditScreen}
            options={{
              headerStyle: tw`${isDarkMode ? 'bg-purple-900' : 'bg-purple-300'}`,
              headerTintColor: '#fff',
              headerTitleStyle: tw`font-bold`,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      {/* Dark mode toggle */}
      <TouchableOpacity
        onPress={toggleDarkMode}
        style={tw`bg-gray-600 rounded-full absolute bottom-8 left-8 w-10 h-10 items-center justify-center`}
      >
        <Text style={tw`text-white text-3xl`}>{isDarkMode ? '🌙' : '☀️'}</Text>
      </TouchableOpacity>
    </Provider>
  );
}