import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const dbApi = createApi({
  reducerPath: 'dbApi',
  tagTypes: ['Notes'],
  baseQuery: fakeBaseQuery(),
  endpoints: (build) => ({
    fetchNotes: build.query({
      async queryFn() {
        const serializedNotes = await AsyncStorage.getItem('notes');
        const notes = JSON.parse(serializedNotes) || [];
        return { data: notes };
      },
      providesTags: (result) => ['Notes'],
    }),
    searchNotes: build.query({
      async queryFn(searchString) {
        const serializedNotes = await AsyncStorage.getItem('notes');
        const notes = JSON.parse(serializedNotes) || [];
        if (searchString === "") {
          return { data: notes };
        } else {
          const filteredNotes = notes.filter(note => {
            const { title, content } = note;
            const s = searchString.toLowerCase();
            return title.toLowerCase().includes(s) || content.toLowerCase().includes(s);
          });
          return { data: filteredNotes };
        }
      },
      providesTags: (result) => ['Notes'],
    }),
    addNote: build.mutation({
      async queryFn(note) {
        const serializedNotes = await AsyncStorage.getItem('notes');
        const notes = JSON.parse(serializedNotes) || [];
        note.id = uuid.v4();
        notes.unshift(note);
        await AsyncStorage.setItem('notes', JSON.stringify(notes));
        return { data: note };
      },
      invalidatesTags: ['Notes'],
    }),
    deleteNote: build.mutation({
      async queryFn(note) {
        const serializedNotes = await AsyncStorage.getItem('notes');
        let notes = JSON.parse(serializedNotes) || [];
        notes = notes.filter(x => x.id !== note.id);
        await AsyncStorage.setItem('notes', JSON.stringify(notes));
        return { data: note };
      },
      invalidatesTags: ['Notes'],
    }),
    updateNote: build.mutation({
      async queryFn(note) {
        const serializedNotes = await AsyncStorage.getItem('notes');
        const notes = JSON.parse(serializedNotes) || [];
        const updatedNotes = notes.map((n) => {
          if (n.id === note.id) {
            return { ...n, title: note.title, content: note.content };
          }
          return n;
        });
        await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
        return { data: note };
      },
      invalidatesTags: ['Notes'],
    }),
    deleteAllNotes: build.mutation({
      async queryFn() {
        await AsyncStorage.setItem('notes', JSON.stringify([]));
        return { data: [] };
      },
      invalidatesTags: ['Notes'],
    }),
  }),
});

export const { 
  useFetchNotesQuery, 
  useSearchNotesQuery, 
  useAddNoteMutation, 
  useUpdateNoteMutation, 
  useDeleteNoteMutation, 
  useDeleteAllNotesMutation 
} = dbApi;
