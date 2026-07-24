import React, { useState, useEffect } from 'react';
import { AudioEngine, RecordingState, getAudioEngine } from '../services/AudioEngine';
import { Mic, Square, Play, Pause, Download, Volume2 } from 'lucide-react';

interface AudioInterfaceProps {
  language: 'en' | 'hi';
  onRecordingComplete?: (audioBlob: Blob, transcript?: string) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
}

export const AudioInterface: React.FC<AudioInterfaceProps> = ({
  language,
  onRecordingComplete,
  onPlaybackStart,
  onPlaybackEnd
}) => {
  const [audioEngine] = useState<AudioEngine | null>(() => {
    try {
      return getAudioEngine();
    } catch {
      return null;
    }
  });

  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0
  });

  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!audioEngine) {
      setIsSupported(false);
      return;
    }

    setIsSupported(AudioEngine.isSupported());
    const unsubscribe = audioEngine.onRecordingStateChange(setRecordingState);
    return unsubscribe;
  }, [audioEngine]);

  const startRecording = async () => {
    try {
      if (!audioEngine) return;
      setTranscript('');
      await audioEngine.startRecording();
    } catch (error) {
      console.error('[AudioInterface] Failed to start recording:', error);
      alert(language === 'en' ? 'Failed to access microphone' : 'माइक्रोफ़ोन एक्सेस विफल रहा');
    }
  };

  const pauseRecording = () => {
    if (!audioEngine) return;
    audioEngine.pauseRecording();
  };

  const resumeRecording = () => {
    if (!audioEngine) return;
    audioEngine.resumeRecording();
  };

  const stopRecording = async () => {
    try {
      if (!audioEngine) return;

      setIsProcessing(true);
      const audioBlob = await audioEngine.stopRecording();

      // Create URL for playback
      const url = audioEngine.createAudioURL(audioBlob);
      setRecordedAudioUrl(url);

      // Try to transcribe
      try {
        const detectedLanguage = language === 'en' ? 'en-US' : 'hi-IN';
        const transcribedText = await audioEngine.speechToText(audioBlob, detectedLanguage as any);
        setTranscript(transcribedText);
      } catch (error) {
        console.warn('[AudioInterface] Transcription failed, continuing without it:', error);
      }

      setIsProcessing(false);

      // Notify parent
      onRecordingComplete?.(audioBlob, transcript);
    } catch (error) {
      console.error('[AudioInterface] Failed to stop recording:', error);
      setIsProcessing(false);
    }
  };

  const playRecording = async () => {
    if (!audioEngine || !recordedAudioUrl) return;

    try {
      onPlaybackStart?.();
      await audioEngine.playAudio(recordedAudioUrl);
      onPlaybackEnd?.();
    } catch (error) {
      console.error('[AudioInterface] Failed to play audio:', error);
      onPlaybackEnd?.();
    }
  };

  const downloadRecording = () => {
    if (!recordedAudioUrl) return;

    const link = document.createElement('a');
    link.href = recordedAudioUrl;
    link.download = `recording-${Date.now()}.webm`;
    link.click();
  };

  const clearRecording = () => {
    setRecordedAudioUrl(null);
    setTranscript('');
  };

  if (!isSupported) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-slate-950 to-black rounded-3xl border border-red-500/50 p-6">
        <div className="text-center">
          <div className="text-3xl mb-3">🔊</div>
          <p className="text-red-400 font-medium">
            {language === 'en'
              ? 'Audio not supported in your browser'
              : 'आपके ब्राउज़र में ऑडियो समर्थित नहीं है'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 to-black rounded-3xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-white text-sm">
            {language === 'en' ? 'Audio' : 'ऑडियो'}
          </h3>
        </div>
      </div>

      {/* Recording Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        {!recordingState.isRecording && !recordedAudioUrl && (
          <>
            <div className="text-4xl animate-bounce">🎤</div>
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold hover:from-red-700 hover:to-orange-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              {language === 'en' ? 'Start Recording' : 'रिकॉर्डिंग शुरू करें'}
            </button>
          </>
        )}

        {recordingState.isRecording && (
          <div className="space-y-4 w-full text-center">
            <div className="inline-block">
              <div className="animate-pulse">
                <div className="w-16 h-16 rounded-full bg-red-600/50 flex items-center justify-center mx-auto">
                  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-white animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-2xl font-bold text-red-400">
              {AudioEngine.formatTime(recordingState.duration)}
            </div>

            <div className="flex gap-2 justify-center">
              {!recordingState.isPaused ? (
                <button
                  onClick={pauseRecording}
                  className="px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm font-semibold hover:bg-yellow-700 transition-colors flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  {language === 'en' ? 'Pause' : 'रोकें'}
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {language === 'en' ? 'Resume' : 'फिर से शुरू करें'}
                </button>
              )}

              <button
                onClick={stopRecording}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                {language === 'en' ? 'Stop' : 'रोकें'}
              </button>
            </div>
          </div>
        )}

        {recordedAudioUrl && (
          <div className="w-full space-y-3">
            <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/50">
              <p className="text-xs text-green-300 font-semibold mb-2">
                {language === 'en' ? 'Recording Saved' : 'रिकॉर्डिंग सहेजी गई'}
              </p>

              {transcript && (
                <div className="text-xs text-white/80 bg-black/30 p-2 rounded mb-2 max-h-16 overflow-y-auto">
                  <p className="font-semibold mb-1">
                    {language === 'en' ? 'Transcript:' : 'ट्रांस्क्रिप्ट:'}
                  </p>
                  <p>{transcript}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={playRecording}
                  className="flex-1 px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Volume2 className="w-3 h-3" />
                  {language === 'en' ? 'Play' : 'चलाएं'}
                </button>

                <button
                  onClick={downloadRecording}
                  className="px-3 py-1.5 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                </button>

                <button
                  onClick={clearRecording}
                  className="px-3 py-1.5 rounded bg-red-600/50 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                >
                  {language === 'en' ? 'Clear' : 'साफ़'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="text-center">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full" />
            </div>
            <p className="text-xs text-white/60 mt-2">
              {language === 'en' ? 'Processing...' : 'प्रक्रिया जारी है...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
