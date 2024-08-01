import React, { useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import './App.css';
import { useDispatch } from 'react-redux';
import { Row, Col, Select } from 'antd';
import speechTranslationDataActions from './store/actions/actions';
import { languages } from './constant/languages';

const { Option } = Select;

const mapDispatchToProps = {
  translateText: speechTranslationDataActions.translateText
};

const AppBase = (props) => {
  const dispatch = useDispatch();
  const { translateText } = props;
  const [transcript, setTranscript] = useState('');
  const [startSpeech, setStartSpeech] = useState(false);
  const [language, setLanguage] = useState('en');
  const recognitionRef = useRef(null); // useRef to hold the recognition instance

  useEffect(() => {
    if (transcript && language) {
      dispatch(translateText(JSON.stringify({ text: transcript, lang: language })));
    }
  }, [transcript, language])

  const initializeRecognition = async (language) => {
    await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    if (recognitionRef.current) {
      recognitionRef.current.stop(); // Ensure any previous instance is stopped
      recognitionRef.current = null;
    }

    recognitionRef.current = new (window?.SpeechRecognition || window.webkitSpeechRecognition)();
    const recognition = recognitionRef.current;

    recognition.lang = 'hi-IN';
    recognition.continuous = true;
    recognition.interimResults = true; // Get interim results as well

    recognition.onresult = function (event) {
      let resultText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        resultText += event.results[i][0].transcript.trim() + ' ';
      }
      setTranscript(resultText.trim()); // Update the transcript with each new result

      if (resultText && language) {
        dispatch(translateText(JSON.stringify({ text: transcript, lang: language })));
      }
    };

    recognition.onerror = function (event) {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = function () {
      // Automatically restart recognition when it ends if recording is still active
      if (startSpeech) {
        initializeRecognition(language);
      }
    };

    recognition.start();
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

  useEffect(() => {
    // Cleanup on component unmount or when recording is stopped
    return () => stopRecognition();
  }, []);

  return (
    <div className="App">
      <h1>Speech to Speech Translation</h1>
      <Row>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <button onClick={onClickStartRecording}>
            {startSpeech ? 'Stop Recording' : 'Start Recording'}
          </button>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <h2>Recognized Text: {transcript}</h2>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <h2>Translated Text:</h2>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <audio id="translated-audio" controls></audio>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <Select onChange={onChangeLanguage} id="language" placeholder='Please Select Target Language' defaultValue="en">
            {languages.map(item => <Option key={item.id} value={item.code}>{item.name}</Option>)}
          </Select>
        </Col>
      </Row>
    </div>
  );
};

const App = connect(null, mapDispatchToProps)(AppBase);
export default App;
