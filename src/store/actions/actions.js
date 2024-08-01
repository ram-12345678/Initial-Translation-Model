import { message as antMessage } from 'antd'
import axiosInstance from "./axiosConfig";
export const TRANSLATE_SPEECH_TO_TEXT = 'TRANSLATE_SPEECH_TO_TEXT';
export const TRANSLATE_SPEECH_TO_TEXT_REQUEST = 'TRANSLATE_SPEECH_TO_TEXT_REQUEST';

const speechTranslationDataActions = {};

const dispatchSpeechToText = (text) => ({
    type: TRANSLATE_SPEECH_TO_TEXT,
    payload: text
})
speechTranslationDataActions.translateText = (data) => {
    console.log(data,'13')
    return (dispatch) => {
        console.log(dispatch,'14')
        axiosInstance.post('/translate', data)
            .then(res => dispatch(dispatchSpeechToText(res.data)))
            .catch(error => antMessage('post api raise error', error))
    }
}
export default speechTranslationDataActions;