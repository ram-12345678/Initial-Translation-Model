import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import { Row, Col, Select, Button } from 'antd';
import { translateText } from './store/translationSlice';
import { languages } from './constant/languages';
import { speechToVoice } from './store/speechToVoiceSlice';

const { Option } = Select;

const App = () => {
  const dispatch = useDispatch();
  const { translatedText } = useSelector((state) => state.translation);
  const { audioUrl } = useSelector((state) => state.speechToVoice);
  const [transcript, setTranscript] = useState('');
  const [allTranscript, setAllTranscript] = useState([]);
  const [translatedSentences, setTranslatedSentences] = useState([]);
  const [language, setLanguage] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const queueRef = useRef([]);
  const transcriptsEndRef = useRef(null);
  const translatedEndRef = useRef(null);

  useEffect(() => {
    if (transcript && language) {
      dispatch(translateText({ text: transcript, lang: language }));
    }
  }, [transcript, language, dispatch]);

  useEffect(() => {
    if (translatedText?.translated_text) {
      setTranslatedSentences((prevSentences) => [
        ...prevSentences,
        translatedText.translated_text,
      ]);
      queueRef.current.push(translatedText.translated_text);
      if (!isSpeakingRef.current) {
        speakNextSentence();
      }
    }
  }, [translatedText]);

  useEffect(() => {
    if (allTranscript.length > 0) {
      transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allTranscript]);

  useEffect(() => {
    if (translatedSentences.length > 0) {
      translatedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [translatedSentences]);

  const speakNextSentence = () => {
    if (queueRef.current.length > 0) {
      const sentence = queueRef.current.shift();
      isSpeakingRef.current = true;
      dispatch(speechToVoice({ text: sentence, lang: language })).then(() => {
        isSpeakingRef.current = false;
        speakNextSentence(); // Speak the next sentence in the queue
      });
    } else {
      isSpeakingRef.current = false;
    }
  };

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
          if (event.results[i].isFinal) {
            resultText = event.results[i][0].transcript.trim();
            setTranscript(resultText);
            setAllTranscript((item) => [...item, resultText]);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        if (!isRecording) {
          recognition.start(); // Restart recognition if needed
        }
      };

      recognition.start();
    } catch (error) {
      console.error('Error initializing recognition:', error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } else {
      initializeRecognition(language);
      setAllTranscript([]);
      setTranslatedSentences([]);
      queueRef.current = [];
    }
    setIsRecording(!isRecording);
  };

  const onChangeLanguage = (lang) => {
    setLanguage(lang);
  };

  const handleAudioEnded = () => {
    speakNextSentence(); // Move to the next sentence when audio ends
  };

  return (
    <div className="App">
      <h1>Speech to Speech Translation</h1>
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8} lg={8} xl={8}>
          <h2>Recognized Text:</h2>
          <div className="transcripts">
            {allTranscript.length > 0 && allTranscript.map((item, index) => <p key={index}>{item}</p>)}
            <div ref={transcriptsEndRef} />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8} xl={8}>
          <div className="button-container">
            <Button onClick={toggleRecording} type="primary">
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </div>
          <div className="select-container">
            <Select style={{ width: 128 }} onChange={onChangeLanguage} id="language" placeholder="Select Target Language" defaultValue="en">
              {languages.map(item => <Option key={item.id} value={item.code}>{item.name}</Option>)}
            </Select>
          </div>
          <div className="audio-container">
            <h2>Audio Output:</h2>
            {audioUrl ? (
              <audio
                src={`http://localhost:5000/audio/${audioUrl.split('/').pop()}`}
                controls
                autoPlay
                onEnded={handleAudioEnded}
                onError={(e) => console.error('Audio playback error:', e)}
              />
            ) : (
              'Audio is not coming?'
            )}
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={8} xl={8}>
          <h2>Translated Text:</h2>
          <div className="scrollable-text">
            {translatedSentences.map((sentence, index) => (
              <p key={index}>{sentence}</p>
            ))}
            <div ref={translatedEndRef} />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default App;
