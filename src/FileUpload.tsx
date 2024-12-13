import React, { useCallback, useMemo, useState } from 'react';
import { Upload, X, File as FileIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { calculateCER, calculateWER, compareText } from './compareText';

interface FileStatus {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  referenceText: string; // Текст для сравнения
  transcript?: string; // Расшифрованный текст
  cer?: number;
  wer?: number;
  accuracy?: number;
}

export const FileUpload: React.FC = () => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const newFileStatuses: FileStatus[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
      referenceText: file.name, // Пустое поле для текста сравнения
    }));

    setFiles(prev => [...prev, ...newFileStatuses]);
  };

  const updateReferenceText = (file: File, text: string) => {
    setFiles(prev =>
      prev.map(f => (f.file === file ? {
        ...f,
        referenceText: text,
        wer: f.transcript ? calculateWER(text, f.transcript.trim()) : f.wer,
        cer: f.transcript ? calculateCER(text, f.transcript.trim()) : f.cer,
        accuracy: f.transcript ? compareText(f.transcript.trim(), text) : f.accuracy,
      } : f))
    );
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const startProcessing = async () => {
    if (!files.length) return;

    setIsProcessing(true);

    const formData = new FormData();
    files.forEach(({ file, referenceText }) => {
      formData.append('files', file); // Добавляем файл
      formData.append('referenceTexts', referenceText); // Добавляем соответствующий текст для сравнения
    });

    try {
      const response = await fetch('http://localhost:5000/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process files');
      }

      const data = await response.json();
      const updatedFiles = files.map(fileStatus => {
        const result = data.find((item: any) => item.fileName === fileStatus.file.name); // Предполагается, что сервер возвращает массив
        return result
          ? {
          ...fileStatus,
            status: 'success',
            transcript: result.transcript,
            wer: result.transcript ? calculateWER(fileStatus.referenceText, result.transcript.trim()) : result.wer,
            cer: result.transcript ? calculateCER(fileStatus.referenceText, result.transcript.trim()) : result.cer,
            accuracy: result.transcript ? compareText(result.transcript.trim(), fileStatus.referenceText) : fileStatus.accuracy,
        }
          : { ...fileStatus, status: 'error' };
      });

      // @ts-ignore
      setFiles(updatedFiles);
    } catch (error) {
      console.error('Error:', error);
      setFiles(prev =>
        prev.map(fileStatus => ({ ...fileStatus, status: 'error' }))
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const avgCer = useMemo(() => {
    const cers = files.map(({ cer }) => cer).filter(it => it !== undefined) as number[]
    const sum = cers.reduce((acc, cer) => acc + cer, 0);

    return sum / cers.length;
  }, [files]);

  const avgWer = useMemo(() => {
    const wers = files.map(({ wer }) => wer).filter(it => it !== undefined) as number[]
    const sum = wers.reduce((acc, wer) => acc + wer, 0);

    return sum / wers.length;
  }, [files]);

  const avgAcc = useMemo(() => {
    const accs = files.map(({ accuracy }) => accuracy).filter(it => it !== undefined) as number[]
    const sum = accs.reduce((acc, ac) => acc + ac, 0);

    return sum / accs.length;
  }, [files]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-white" />
          <h3 className="mt-2 text-sm font-semibold text-white">
            Перенесите сюда файлы
          </h3>
          <p className="mt-1 text-sm text-white">или нажмите</p>
          <input
            type="file"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileInput}
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          {files.map(({ accuracy, cer, wer, file, progress, status, referenceText, transcript }) => (
            <div
              key={file.name}
              className="bg-white rounded-lg shadow p-4 flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <FileIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {status === 'uploading' && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <button
                    onClick={() => removeFile(file)}
                    className="ml-2 text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <textarea
                className="w-full p-2 border rounded"
                placeholder="Введите текст для сравнения"
                value={referenceText}
                onChange={e => updateReferenceText(file, e.target.value)}
              />
              {status === 'success' && transcript && (
                <p className="text-sm text-gray-700 mt-2">
                  Расшифровка: {transcript}
                </p>
              )}
              {status === 'success' && (
                <p className="text-sm text-gray-700 mt-2">
                  Точность: {accuracy?.toFixed(2)}%
                </p>
              )}
              {status === 'success' && (
                <p className="text-sm text-gray-700 mt-2">
                  CER: {cer?.toFixed(2)}
                </p>
              )}
              {status === 'success' && (
                <p className="text-sm text-gray-700 mt-2">
                  WER: {wer?.toFixed(2)}
                </p>
              )}
            </div>
          ))}
          <button
            onClick={startProcessing}
            className="button full mt-4"
            disabled={!files.every(f => f.referenceText) || isProcessing}
          >
            {isProcessing ? 'Обработка...' : 'Запустить распознавание'}
          </button>
          {!isProcessing && (
            <p className="text-sm text-gray-400 mt-2">
              Avg Точность: {avgAcc.toFixed(2)}&nbsp;
              Avg WER: {avgWer.toFixed(2)}&nbsp;
              Avg CER: {avgCer.toFixed(2)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
