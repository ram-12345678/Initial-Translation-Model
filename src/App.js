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
  const [allTranscript, setAllTranscript] = useState([]);
  const [translatedSentences, setTranslatedSentences] = useState([]);
  const [language, setLanguage] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const queueRef = useRef([]);
  const transcriptsEndRef = useRef(null);
  const translatedEndRef = useRef(null);
  const processedSentences = useRef(new Set());
  const accumulatedTextRef = useRef(''); // Store unprocessed text here
  const isRecordingRef = useRef(isRecording);

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
      if (!isSpeakingRef.current && queueRef.current.length > 0) {
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
 
  const extractSentences = (text, onSentenceMatch, processedSentences) => {
    const sentenceEndings = [
      'है', 'हूँ', 'थे', 'हों', 'होगा', 'होगी', 'था', 'थी', 'रहा है', 'रही है', 
      'रहे हैं', 'जाता है', 'जाती है', 'गया है', 'गई है', 'किया है', 'की है',
      'किया था', 'किया है', 'किए हैं', 'दिया है', 'दी है', 'दिए हैं', 'रहेंगे', 
      'जाएगा', 'जाएगी', 'जाएंगे', 'देखा है', 'देखा था', 'मिला है', 'मिली है', 
      'मिले हैं', 'कहा है', 'कहा था', 'बताया है', 'बताया था', 'सकता है', 
      'सकती है', 'सकते हैं', 'लेकर', 'करते हैं', 'होता है', 'होती है', 
      'होते हैं', 'बनाया है', 'बनाई है', 'बनाए हैं', 'चुका है', 'चुकी है', 
      'चुके हैं', 'चाहता है', 'चाहती है', 'चाहते हैं', 'लगा है', 'लगी है', 
      'लगे हैं', 'रहा था', 'रही थी', 'रहे थे', 'समझा है', 'समझा था', 'समझी है', 
      'समझे हैं', 'सोचा है', 'सोचा था', 'देखने', 'समझने', 'जानने', 'करने'
    ];
    
    
    // Regex to match sentence endings
    const regex = new RegExp(`(${sentenceEndings.join('|')})(?=[\\s\\n]|$)`, 'g');

    console.log(text,'text')
    let match;
    let lastIndex = 0;
    let accumulatedText = '';
  
    while ((match = regex.exec(text)) !== null) {
      const endIndex = regex.lastIndex;
      
      // Accumulate text from the last match position to the current match position
      accumulatedText += text.slice(lastIndex, endIndex).trim();
      lastIndex = endIndex;
      
      // Process the accumulated text as a complete sentence
      const trimmedSentence = accumulatedText.trim();
      if (trimmedSentence.length > 0 && !processedSentences.has(trimmedSentence)) {
        console.log(`Dubbing sentence: ${trimmedSentence}`); // Dubbing console log
        onSentenceMatch(trimmedSentence);
        processedSentences.add(trimmedSentence);
      }
  
      // Clear the accumulated text for the next segment
      accumulatedText = '';
    }
  
    // Process any remaining text after the last match
    if (lastIndex < text.length) {
      accumulatedText += text.slice(lastIndex).trim();
      const trimmedSentence = accumulatedText.trim();
      if (trimmedSentence.length > 0 && !processedSentences.has(trimmedSentence) &&
          sentenceEndings.some(ending => trimmedSentence.endsWith(ending))) {
        console.log(`Dubbing sentence: ${trimmedSentence}`); // Dubbing console log
        onSentenceMatch(trimmedSentence);
        processedSentences.add(trimmedSentence);
      }
    }
    
    // Reset regex lastIndex for next use
    regex.lastIndex = 0;
  
    // Debugging output
    console.log(`Final accumulated text: ${accumulatedText}`);
  };
  
  const processTranscript = (transcript) => {
    extractSentences(transcript, (sentence) => {
      const trimmedSentence = sentence.trim();
      if (!processedSentences.current.has(trimmedSentence)) {
        console.log(`Processing sentence: ${trimmedSentence}`);
        setAllTranscript((prev) => [...prev, trimmedSentence]);
        processedSentences.current.add(trimmedSentence);
        dispatch(translateText({ text: trimmedSentence, lang: language }));
      }
    }, processedSentences.current);
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
      let interimTranscript = '';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript.trim() + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript.trim() + ' ';
          }
        }

        if (finalTranscript) {
          processTranscript(finalTranscript);
        }

        processTranscript(interimTranscript);
        interimTranscript = '';
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
      const sentence = queueRef.current.shift();
      isSpeakingRef.current = true;

      try {
        const result = await dispatch(speechToVoice({ text: sentence, lang: language })).unwrap();
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
