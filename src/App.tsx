import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { compareText } from './compareText';

function App() {
  const [transcript, setTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<any | null>(null);
  const [textToCompare, setTextToCompare] = useState('');
  const [volume, setVolume] = useState<number>(0); // Для уровня громкости
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null); // Загруженный

  useEffect(() => {
    // Проверяем поддержку Web Speech API
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const avgVolume = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(avgVolume); // Обновляем громкость
        requestAnimationFrame(updateVolume);
      };

      updateVolume();
    })
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
    recognitionInstance.continuous = true;

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

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedAudio(file);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:5000/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to process audio');
        }

        const data = await response.json();
        setTranscript(data.transcript); // Установить распознанный текст
      } catch (error) {
        console.error('Error processing audio:', error);
      }
    }
  };

  const accuracy = useMemo(() => {
    const res = compareText(transcript.toLowerCase(), textToCompare.toLowerCase());

    return isNaN(res) ? 0 : res;
  }, [transcript, textToCompare]);

  return (
    <div className="App" style={{ '--volume-scale': isRecording ? ((volume * 5) + 50) / 100 : 0.5 } as React.CSSProperties}>
      <div className="content">
        <label className="input-wrapper">
          <span className="input-caption">Загрузить аудио-файл</span>
          <input type="file" accept="audio/*" onChange={handleAudioUpload} />
          {uploadedAudio && (
            <audio controls>
              <source src={URL.createObjectURL(uploadedAudio)} type="audio/mpeg" />
              Ваш браузер не поддерживает аудио-воспроизведение.
            </audio>
          )}
        </label>
        <label className="input-wrapper">
          <span className="input-caption">Текст для сравнения</span>
          <textarea className="input" value={textToCompare} onChange={e => setTextToCompare(e.target.value)} />
        </label>
        <div className="buttons">
          <button onClick={isRecording ? stopRecognition : startRecognition} className={`button ${isRecording ? 'isRecording' : ''}`}>
            {isRecording ? 'Остановить' : 'Начать'} запись
          </button>
        </div>
        <div className="accuracy">Точность: {accuracy.toFixed(2)}%</div>
        <div className="text">
          {transcript}
        </div>
      </div>
    </div>
  );
}

export default App;
