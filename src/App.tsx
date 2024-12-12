import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { compareText } from './compareText';

function App() {
  const [transcript, setTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<any | null>(null);
  const [textToCompare, setTextToCompare] = useState('');

  useEffect(() => {
    // Проверяем поддержку Web Speech API
    navigator.mediaDevices.getUserMedia({ audio: true })
      .catch((err) => {
        console.error('Microphone access denied:', err);
        alert('Access to microphone is required for speech recognition.');
      });

    if (!('webkitSpeechRecognition' in window)) {
      alert('Web Speech API is not supported by this browser. Use Google Chrome version 25 or later.');
      return;
    }

    const recognitionInstance = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
    recognitionInstance.lang = 'ru-RU';
    recognitionInstance.interimResults = true;
    recognitionInstance.continuous = false;

    // Обработчик распознавания
    recognitionInstance.onresult = (event: any) => {
      const finalTranscript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setTranscript(finalTranscript);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognitionInstance.onend = () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
    };

    setRecognition(recognitionInstance);
  }, []);

  const startRecognition = () => {
    if (recognition && !isRecording) {
      recognition.start();
      setIsRecording(true);
    }
  };

  const stopRecognition = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const accuracy = useMemo(() => {
    return compareText(transcript, textToCompare);
  }, [transcript, textToCompare]);

  return (
    <div>
      <h2>Speech Recognition Demo</h2>
      <label>
        <span>Текст для сравнения:</span>
        <input type="text" value={textToCompare} onChange={e => setTextToCompare(e.target.value)} />
      </label>
      <button onClick={startRecognition} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecognition} disabled={!isRecording}>
        Stop Recording
      </button>
      <p><strong>Recognized Text:</strong> {transcript}</p>
      <p>Accuracy: {accuracy.toFixed(2)}%</p>
    </div>
  );
}

export default App;
