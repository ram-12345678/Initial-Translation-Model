import { TRANSLATE_SPEECH_TO_TEXT, TRANSLATE_SPEECH_TO_TEXT_REQUEST, TRANSLATE_SPEECH_TO_TEXT_FAILURE } from '../actions/actions';

const initialState = {
  translatedText: undefined,
  error: null,
  loading: false
};

const reducers = (state = initialState, action) => {
  switch (action.type) {
    case TRANSLATE_SPEECH_TO_TEXT:
      return {
        ...state,
        translatedText: action.payload,
        loading: false
      };
    case TRANSLATE_SPEECH_TO_TEXT_REQUEST:
      return {
        ...state,
        loading: true
      };
    case TRANSLATE_SPEECH_TO_TEXT_FAILURE:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    default:
      return state;
  }
};

export default reducers;
