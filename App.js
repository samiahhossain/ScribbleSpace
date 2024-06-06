import React, { useEffect, useState, useRef } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, Modal, Button } from 'react-native';
import tw, { useDeviceContext } from 'twrnc';
import MasonryList from '@react-native-seoul/masonry-list';
import { store } from './store';
import {
  useSearchNotesQuery,
  useAddNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useDeleteAllNotesMutation,
} from './db';

// Home Screen
function HomeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const { data: notes = [], error, isLoading } = useSearchNotesQuery(search);
  const [deleteAllNotes] = useDeleteAllNotesMutation();
  const [modalVisible, setModalVisible] = useState(false);

  // For rendering each note
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Edit', { note: item })}
      style={tw`w-[95%] mb-1 mx-auto bg-gray-600 rounded-sm px-1`}
    >
      <Text style={tw`text-lg text-white font-bold`}>{item.title}</Text>
      <Text style={tw`text-white`}>{item.content}</Text>
    </TouchableOpacity>
  );

  if (isLoading) return <ActivityIndicator size="large" color="#0000ff" />; // Loading indicator
  if (error) return <Text>Error loading notes: {error.message}</Text>; // Error

  // "Clear All" button press functionality
  const handleClearAll = async () => {
    setModalVisible(false);
    await deleteAllNotes();
  };

  return (
    <View style={tw`flex-1 bg-gray-950`}>
      {/* Search bar */}
      <TextInput
        style={tw`p-2 m-2 bg-gray-600 text-white rounded`}
        placeholder="Search Notes"
        placeholderTextColor="white"
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
      {/* Clear all button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={tw`bg-red-500 rounded-full absolute bottom-8 left-8 w-12 h-12 items-center justify-center`}
      >
        <Text style={tw`text-white text-3xl`}>🗑️</Text>
      </TouchableOpacity>
      {/* Confirmation box */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`w-80 p-5 bg-white rounded`}>
            <Text style={tw`text-lg mb-4`}>Are you sure you want to delete all notes?</Text>
            <View style={tw`flex-row justify-end`}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Yes" onPress={handleClearAll} />
            </View>
          </View>
        </View>
      </Modal>
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
      if (note.id) {
        await updateNote({
          id: note.id,
          title: note.title,
          content: note.content,
        });
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

  // Delete functionality
  const handleDelete = async () => {
    if (note.id) {
      await deleteNote({
        id: note.id,
      });
    }
    navigation.goBack();
  };

  return (
    <View style={tw`flex-1 bg-gray-950 p-4`}> 
      {addError && <Text>Error adding note: {addError.message}</Text>}
      {updateError && <Text>Error updating note: {updateError.message}</Text>}
      {deleteError && <Text>Error deleting note: {deleteError.message}</Text>}
      {/* Title bar */}
      <TextInput
        style={tw`p-2 mb-4 bg-gray-600 text-white rounded`}
        placeholder="Title"
        placeholderTextColor="white"
        value={note.title}
        onChangeText={(text) => setNote((prev) => ({ ...prev, title: text }))}
      />
      {/* Note content area */}
      <TextInput
        style={tw`p-2 bg-gray-600 text-white rounded`}
        placeholder="Content"
        placeholderTextColor="white"
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
  useDeviceContext(tw);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          {/* Home header */}
          <Stack.Screen
            name="Notes"
            component={HomeScreen}
            options={{
              headerStyle: tw`bg-gray-950`,
              headerTintColor: '#fff',
              headerTitleStyle: tw`font-bold`,
              headerTitleAlign: 'center',
              headerShadowVisible: false,
            }}
          />
          {/* Editing header */}
          <Stack.Screen
            name="Edit"
            component={EditScreen}
            options={{
              headerStyle: tw`bg-gray-950`,
              headerTintColor: '#fff',
              headerTitleStyle: tw`font-bold`,
              headerShadowVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
