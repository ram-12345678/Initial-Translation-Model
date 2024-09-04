import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import { Row, Col, Select, Button, Carousel } from 'antd';
import { translateText } from './store/translationSlice';
import { languages } from './constant/languages';
import { speechToVoice } from './store/speechToVoiceSlice';
import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";
import { saveAs } from "file-saver";
// import logo from '/';
// const stringSimilarity = require('string-similarity');
const { Option } = Select;

const App = () => {
  const dispatch = useDispatch();
  const { translatedText } = useSelector((state) => state.translation);
  const { audioUrl } = useSelector((state) => state.speechToVoice);
  const [allTranscript, setAllTranscript] = useState([]);
  const [translatedSentences, setTranslatedSentences] = useState([]);
  const [displayedSentences, setDisplayedSentences] = useState([]);
  const [translatedLanguage, setTranslatedLanguage] = useState('en');
  const [recognezedLanguage, setRecognezedLanguage] = useState('hi');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const queueRef = useRef([]);
  // const transcriptsEndRef = useRef(null);
  // const translatedEndRef = useRef(null);
  const processedSentences = useRef(new Set());
  const accumulatedTextRef = useRef('');
  const isRecordingRef = useRef(isRecording);
  const interimTranscriptRef = useRef('');
  console.log(allTranscript, 'allTranscript')
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (translatedText?.translated_text && displayedSentences !== undefined && translatedSentences !== null) {
      setTranslatedSentences((prevSentences) => [
        ...prevSentences,
        translatedText.translated_text
      ]);
      setDisplayedSentences((prevSentences) => [
        ...prevSentences,
        translatedText.translated_text
      ])
      queueRef.current.push(translatedText.translated_text);
    }
  }, [translatedText]);

  useEffect(() => {
    if (displayedSentences?.length > 5) {
      const sentences = displayedSentences.slice(1)
      setDisplayedSentences(sentences);
    }
  }, [displayedSentences]);

  console.log(displayedSentences, 'displayedSentences', translatedSentences, 'translatedSentences')
  // useEffect(() => {
  //   if (allTranscript.length > 0) {
  //     transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, [allTranscript]);

  // useEffect(() => {
  //   if (translatedSentences.length > 0) {
  //     translatedEndRef?.current?.scrollLeft = translatedEndRef?.current?.scrollWidth;
  //   }
  // }, [translatedSentences]);

  // const extractSentences = (text, onSentenceMatch, processedSentences, isFinal = false) => {
  //   const sentenceEndings = [
  //     'है', 'हूँ', 'थे', 'हों', 'होगा', 'होगी', 'था', 'थी', 'रहा है', 'रही है',
  //     // add more sentence endings as needed
  //   ];

  //   const regex = new RegExp(`(${sentenceEndings.join('|')})(?=[\\s\\n]|$)`, 'g');

  //   let match;
  //   let lastIndex = 0;
  //   let pendingText = accumulatedTextRef.current; // Text that didn’t form a complete sentence last time
  //   while ((match = regex.exec(text)) !== null) {
  //     const endIndex = regex.lastIndex;
  //     const sentence = text.slice(lastIndex, endIndex).trim();
  //     lastIndex = endIndex;
  //     if (sentence && !processedSentences.has(sentence)) {
  //       const fullSentence = pendingText + ' ' + sentence; // Combine with pending text
  //       pendingText = ''; // Clear pending text after use
  //       onSentenceMatch(fullSentence.trim()); // Pass the combined sentence
  //       processedSentences.add(fullSentence);
  //     }
  //   }

  //   const remainingText = text.slice(lastIndex).trim();

  //   if (isFinal && remainingText && !processedSentences.has(remainingText)) {
  //     const fullSentence = pendingText + ' ' + remainingText; // Append remaining to pending
  //     onSentenceMatch(fullSentence.trim());
  //     processedSentences.add(fullSentence);
  //     pendingText = ''; // Clear pending text after use
  //   }
  // };

  const initializeRecognition = async () => {
    try {
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
          setAllTranscript((prev) => [...prev, finalTranscript]);
          dispatch(translateText({ text: finalTranscript, lang: translatedLanguage }));
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
  
  const downloadSpeechAsWord = async () => {
    // Load the logo image
    const logoData = await fetch('./Capture.PNG').then((r) => r.blob());
  
    // Create a new Word document
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: logoData,
                  transformation: {
                    width: 100,
                    height: 50,
                  },
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Translation Report",
                  bold: true,
                  size: 32,
                  break: 1,
                }),
              ],
            }),
            ...translatedSentences.map(
              (sentence) =>
                new Paragraph({
                  children: [new TextRun(sentence)],
                })
            ),
          ],
        },
      ],
    });
  
    // Generate the Word document and save it as a file
    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "translated_sentences.docx");
    });
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
      setDisplayedSentences([]);
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
      <Row gutter={16}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} >
          <div>
            <img src='./Capture.PNG'></img>
          </div>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12} className="languageFields">
          <div className="select-container">
            {/* <h2>Recognized Language</h2> */}
            <Select
              label
              onChange={onChangeRecognizedLanguage}
              id="recognizedlanguage"
              placeholder="Select Target Language"
              defaultValue="hi"
              style={{ width: '100%' }} // Ensure it takes the full width of the container
            >
              {languages.map(item => (
                <Option key={item.id} value={item.code}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </div>
          <div className="select-container">
            {/* <h2>Translated Language</h2> */}
            <Select
              onChange={onChangeTranslatedLanguage}
              id="translatedlanguage"
              placeholder="Select Target Language"
              defaultValue="en"
              style={{ width: '100%' }} // Ensure it takes the full width of the container
            >
              {languages.map(item => (
                <Option key={item.id} value={item.code}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </div>
          <div className="button-container">
            <Button onClick={toggleRecording} type="primary">
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </div>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} style={{ position: 'relative' }}>
          <button onClick={downloadSpeechAsWord} className="copy-button">Copy</button>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} style={{ position: 'relative' }}>
          <div className="scrollable-text-container">
            <div className="scrollable-text">
              <div className="scroll-content">
                {displayedSentences.map((sentence, index) => (
                  <span key={index} className="carousel-item">
                    {sentence}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} className='container-audio'>
          <div className="audio">
            {/* <h2>Audio Output:</h2> */}
            <audio
              src={`http://localhost:5000/audio/${audioUrl?.split('/').pop()}`}
              controls
              autoPlay
              onEnded={() => isSpeakingRef.current = false} // Reset speaking flag when audio ends
              onError={(e) => console.error('Audio playback error:', e)}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default App;
