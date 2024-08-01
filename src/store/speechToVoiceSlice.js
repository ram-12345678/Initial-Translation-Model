import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from './actions/axiosConfig'; // Adjust the path as needed
import { message as antMessage } from 'antd';

// Async thunk for speech to voice
export const speechToVoice = createAsyncThunk(
  'speechToVoice/speechToVoice',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/text-to-speech', data);
      return response.data;
    } catch (error) {
      antMessage.error('Failed to convert speech to voice. Please try again later.');
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

// Create slice
const speechToVoiceSlice = createSlice({
  name: 'speechToVoice',
  initialState: {
    audioUrl: null,
    error: null,
    loading: false
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(speechToVoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(speechToVoice.fulfilled, (state, action) => {
        state.loading = false;
        state.audioUrl = action.payload.audio_url; // Adjust based on the actual response
      })
      .addCase(speechToVoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default speechToVoiceSlice.reducer;
