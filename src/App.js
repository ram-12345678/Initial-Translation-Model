import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import { Row, Col, Select, Button } from 'antd';
import { translateText } from './store/translationSlice';
import { languages } from './constant/languages';
import { speechToVoice } from './store/speechToVoiceSlice';
const stringSimilarity = require('string-similarity');
const { Option } = Select;

const App = () => {
  const dispatch = useDispatch();
  const { translatedText } = useSelector((state) => state.translation);
  const { audioUrl } = useSelector((state) => state.speechToVoice);
  const [allTranscript, setAllTranscript] = useState([]);
  const [translatedSentences, setTranslatedSentences] = useState([]);
  const [translatedLanguage, setTranslatedLanguage] = useState('en');
  const [recognezedLanguage, setRecognezedLanguage] = useState('hi');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const queueRef = useRef([]);
  const transcriptsEndRef = useRef(null);
  const translatedEndRef = useRef(null);
  const processedSentences = useRef(new Set());
  const accumulatedTextRef = useRef('');
  const isRecordingRef = useRef(isRecording);
  const interimTranscriptRef = useRef('');

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (translatedText?.translated_text) {
      setTranslatedSentences((prevSentences) => [
        ...prevSentences,
        translatedText.translated_text,
      ]);
      queueRef.current.push(translatedText.translated_text);
    }
  }, [translatedText]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (false) {
        speakNextSentence();
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

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

  const extractSentences = (text, onSentenceMatch, processedSentences, isFinal = false) => {
    const sentenceEndings = [
      'है', 'हूँ', 'थे', 'हों', 'होगा', 'होगी', 'था', 'थी', 'रहा है', 'रही है',
      // add more sentence endings as needed
    ];

    const regex = new RegExp(`(${sentenceEndings.join('|')})(?=[\\s\\n]|$)`, 'g');

    let match;
    let lastIndex = 0;
    let pendingText = accumulatedTextRef.current; // Text that didn’t form a complete sentence last time
    while ((match = regex.exec(text)) !== null) {
      const endIndex = regex.lastIndex;
      const sentence = text.slice(lastIndex, endIndex).trim();
      lastIndex = endIndex;
      if (sentence && !processedSentences.has(sentence)) {
        const fullSentence = pendingText + ' ' + sentence; // Combine with pending text
        pendingText = ''; // Clear pending text after use
        onSentenceMatch(fullSentence.trim()); // Pass the combined sentence
        processedSentences.add(fullSentence);
      }
    }

    const remainingText = text.slice(lastIndex).trim();

    if (isFinal && remainingText && !processedSentences.has(remainingText)) {
      const fullSentence = pendingText + ' ' + remainingText; // Append remaining to pending
      onSentenceMatch(fullSentence.trim());
      processedSentences.add(fullSentence);
      pendingText = ''; // Clear pending text after use
    }
  };

  const processTranscript = (transcript, isFinal = false) => {
    const handleNewSentences = (sentence) => {
      const lastElement = [...processedSentences.current];
      if (sentence?.length > 10) {
        if (lastElement?.length > 0) {
          const similarity = stringSimilarity?.compareTwoStrings(lastElement.pop(), sentence);
          if (sentence && !(similarity >= 8) && !processedSentences.current.has(sentence)) {
            accumulatedTextRef.current = '';
            setAllTranscript((prev) => [...prev, sentence]);
            processedSentences.current.add(sentence);
            dispatch(translateText({ text: sentence, lang: translatedLanguage }));
          }
        }
      }
      else {
        accumulatedTextRef.current = sentence;
      }

    };

    extractSentences(transcript, handleNewSentences, processedSentences.current, isFinal);
  };

  const initializeRecognition = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        console.error('SpeechRecognition API is not supported in this browser.');
        return;
      }

      recognitionRef.current = new Recognition();
      const recognition = recognitionRef.current;

      recognition.lang = recognezedLanguage;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        interimTranscriptRef.current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.trim();
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscriptRef.current += transcript + ' ';
          }
        }

        if (finalTranscript) {
          processTranscript(finalTranscript, true);
        } else if (interimTranscriptRef.current) {
          processTranscript(interimTranscriptRef.current);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          recognition.start();
        }
      };

      recognition.start();
    } catch (error) {
      console.error('Error initializing recognition:', error);
    }
  };

  const speakNextSentence = async () => {
    if (queueRef.current.length > 0) {
      const qLength = queueRef.current.length;
      const sentence = queueRef.current.splice(0, qLength).join(' ');
      isSpeakingRef.current = true;

      try {
        const result = await dispatch(speechToVoice({ text: sentence, lang: translatedLanguage })).unwrap();
        const audioUrl = result.audioUrl;
        if (typeof audioUrl === "string") {
          const audioSrc = `http://localhost:5000/audio/${audioUrl.split('/').pop()}`;

          const audio = new Audio(audioSrc);
          audio.play();

          await new Promise((resolve) => {
            audio.onended = () => {
              isSpeakingRef.current = false;
              resolve();
            };
            audio.onerror = (e) => {
              console.error('Audio playback error:', e);
              isSpeakingRef.current = false;
              resolve();
            };
          });
        } else {
          console.error('Invalid audioUrl:', audioUrl);
        }
      } catch (error) {
        console.error('Error during speech synthesis:', error);
        isSpeakingRef.current = false;
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } else {
      processedSentences.current.clear();
      accumulatedTextRef.current = ''; // Reset accumulated text
      initializeRecognition(translatedLanguage);
      setAllTranscript([]);
      setTranslatedSentences([]);
      queueRef.current = [];
    }
    setIsRecording(!isRecording);
  };

  const onChangeRecognizedLanguage = (lang) => {
    setRecognezedLanguage(lang);
  };

  const onChangeTranslatedLanguage = (lang) => {
    setTranslatedLanguage(lang);
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
          <h2>Recognized Language:</h2>
            <Select style={{ width: 128 }} onChange={onChangeRecognizedLanguage} id="Recognizedlanguage" placeholder="Select Target Language" defaultValue="hi">
              {languages.map(item => <Option key={item.id} value={item.code}>{item.name}</Option>)}
            </Select>
          </div>
          <div className="select-container">
          <h2>Translated Language:</h2>
            <Select style={{ width: 128 }} onChange={onChangeTranslatedLanguage} id="Translatedlanguage" placeholder="Select Target Language" defaultValue="en">
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
                onEnded={() => isSpeakingRef.current = false} // Reset speaking flag when audio ends
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
