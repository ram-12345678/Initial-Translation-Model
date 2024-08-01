import { configureStore } from '@reduxjs/toolkit';
import translationReducer from './translationSlice';
import speechToVoiceReducer from './speechToVoiceSlice'

export const store = configureStore({
  reducer: {
    translation: translationReducer,
    speechToVoice: speechToVoiceReducer
  }
});
