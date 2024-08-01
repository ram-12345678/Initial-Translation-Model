import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import { Row, Col, Select, Button, Spin } from 'antd';
import { translateText } from './store/translationSlice'; // Import action creator
import { languages } from './constant/languages';
import { speechToVoice } from './store/speechToVoiceSlice';
const { Option } = Select;

const App = () => {
  const dispatch = useDispatch();
  const { translatedText, loading } = useSelector((state) => state.translation);
  const { audioUrl, loading: voiceLoading } = useSelector((state) => state.speechToVoice);
  const [transcript, setTranscript] = useState('');
  const [startSpeech, setStartSpeech] = useState(false);
  const [language, setLanguage] = useState('en');
  const recognitionRef = useRef(null);

  console.log(audioUrl, 'audioUrl')

  useEffect(() => {
    if (transcript && language) {
      dispatch(translateText({ text: transcript, lang: language }));
    }
  }, [transcript, language, dispatch]);

  useEffect(() => {
    if (translatedText && language) {
      // Assuming translatedText contains the text to convert to speech
      dispatch(speechToVoice({ text: translatedText?.translated_text, lang: language }));
    }
  }, [translatedText, language, dispatch]);

  const initializeRecognition = async (lang) => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        console.error('SpeechRecognition API is not supported in this browser.');
        return;
      }

      recognitionRef.current = new Recognition();
      const recognition = recognitionRef.current;

      recognition.lang = 'hi-IN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let resultText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          resultText += event.results[i][0].transcript.trim() + ' ';
        }
        setTranscript(resultText.trim());
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        if (startSpeech) {
          initializeRecognition(language);
        }
      };

      recognition.start();
    } catch (error) {
      console.error('Error initializing recognition:', error);
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const startRecording = () => {
    initializeRecognition(language);
  };

  const onClickStartRecording = () => {
    if (startSpeech) {
      stopRecognition();
    } else {
      startRecording();
    }
    setStartSpeech(prevState => !prevState);
  };

  const onChangeLanguage = (lang) => {
    setLanguage(lang);
  };

  // Safely handle the rendering of translatedText
  // const renderTranslatedText = () => {
  //   if (typeof translatedText === 'string') {
  //     return translatedText;
  //   } else if (translatedText && typeof translatedText === 'object') {
  //     return JSON.stringify(translatedText); // or extract specific property, e.g., translatedText.translated_text
  //   }
  //   return 'No translation available.';
  // };

  return (
    <div className="App">
      <h1>Speech to Speech Translation</h1>
      <Row>
        <Col xs={12} sm={8} md={8} lg={8} xl={8}>
          <h2>Recognized Text: </h2>
          <p>{transcript}</p>
        </Col>
        <Col xs={12} sm={8} md={8} lg={8} xl={8}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24}>
            <Button onClick={onClickStartRecording}>
              {startSpeech ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24}>
            <Select style={{ width: 128, marginTop: 10 }} onChange={onChangeLanguage} id="language" placeholder='Please Select Target Language' defaultValue="en">
              {languages.map(item => <Option key={item.id} value={item.code}>{item.name}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24}>
            <h2>Audio Output:</h2>
            <audio src={audioUrl} controls />
          </Col>
        </Col>
        <Col xs={12} sm={8} md={8} lg={8} xl={8}>
          <h2>Translated Text:</h2>
          {loading ? <Spin /> : translatedText?.translated_text}
        </Col>
      </Row>
    </div>
  );
};

export default App;
