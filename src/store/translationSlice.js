import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from './actions/axiosConfig';
import { message as antMessage } from 'antd';

// Async thunk for translation
export const translateText = createAsyncThunk(
  'translation/translateText',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/translate', data);
      return response.data;
    } catch (error) {
      antMessage.error('Failed to translate text. Please try again later.');
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

// Create slice
const translationSlice = createSlice({
  name: 'translation',
  initialState: {
    translatedText: null,
    error: null,
    loading: false
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(translateText.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(translateText.fulfilled, (state, action) => {
        state.loading = false;
        state.translatedText = action.payload;
      })
      .addCase(translateText.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default translationSlice.reducer;
