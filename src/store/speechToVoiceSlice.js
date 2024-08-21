import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from './actions/axiosConfig'; // Adjust the path as needed

// Async thunk for speech to voice
export const speechToVoice = createAsyncThunk(
  'speechToVoice/speechToVoice',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/text-to-speech', data);
      return response.data;
    } catch (error) {
      console.error('Failed to convert speech to voice. Please try again later.');
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
        state.audioUrl = null; // Clear previous audio URL on new request
      })
      .addCase(speechToVoice.fulfilled, (state, action) => {
        state.loading = false;
        state.audioUrl = action.payload.audio_url; // Adjust based on the actual response
      })
      .addCase(speechToVoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.audioUrl = null; // Ensure audioUrl is cleared on error
      });
  }
});

export default speechToVoiceSlice.reducer;
