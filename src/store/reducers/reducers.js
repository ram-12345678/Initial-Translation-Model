import { TRANSLATE_SPEECH_TO_TEXT } from '../actions/actions';

const initialState = {
    translatedText: undefined
}

const reducers = (state = initialState, action) => {
    switch (action.type) {
        case TRANSLATE_SPEECH_TO_TEXT:
            return {
                ...state,
                translatedText: action?.payload
            }
        default:
            return state;
    }
}


export default reducers;