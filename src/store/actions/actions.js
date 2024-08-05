import axiosInstance from './axiosConfig';

export const TRANSLATE_SPEECH_TO_TEXT = 'TRANSLATE_SPEECH_TO_TEXT';
export const TRANSLATE_SPEECH_TO_TEXT_REQUEST = 'TRANSLATE_SPEECH_TO_TEXT_REQUEST';
export const TRANSLATE_SPEECH_TO_TEXT_FAILURE = 'TRANSLATE_SPEECH_TO_TEXT_FAILURE';

const dispatchSpeechToText = (text) => ({
  type: TRANSLATE_SPEECH_TO_TEXT,
  payload: text
});

const dispatchTranslateTextRequest = () => ({
  type: TRANSLATE_SPEECH_TO_TEXT_REQUEST
});

const dispatchTranslateTextFailure = (error) => ({
  type: TRANSLATE_SPEECH_TO_TEXT_FAILURE,
  payload: error
});

export const translateText = (data) => {
  return async (dispatch) => {
    dispatch(dispatchTranslateTextRequest());

    try {
      const response = await axiosInstance.post('/translate', data);
      dispatch(dispatchSpeechToText(response.data));
    } catch (error) {
      console.error('Translation API error:', error);
      dispatch(dispatchTranslateTextFailure(error));
    }
  };
};
