// Audio Engine Service
// Handles Web Audio API, speech-to-text, text-to-speech, recording

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob?: Blob;
}

export class AudioEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private recordingState: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0
  };
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private timerInterval: number | null = null;
  private recordingListeners: ((state: RecordingState) => void)[] = [];

  constructor(private config: AudioConfig = {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16
  }) {}

  // Initialize audio context
  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Start recording audio
  async startRecording(): Promise<void> {
    try {
      await this.initialize();

      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.recordedChunks = [];
      this.startTime = Date.now();

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle stop
      this.mediaRecorder.onstop = () => {
        this.recordingState.audioBlob = new Blob(this.recordedChunks, {
          type: 'audio/webm'
        });
      };

      this.mediaRecorder.start();

      this.recordingState.isRecording = true;
      this.recordingState.isPaused = false;
      this.recordingState.duration = 0;

      // Update duration timer
      this.timerInterval = window.setInterval(() => {
        this.recordingState.duration = Math.floor((Date.now() - this.startTime) / 1000);
        this.notifyRecordingStateChange();
      }, 100);

      this.notifyRecordingStateChange();
    } catch (error) {
      console.error('[AudioEngine] Failed to start recording:', error);
      throw error;
    }
  }

  // Pause recording
  pauseRecording(): void {
    if (this.mediaRecorder && this.recordingState.isRecording && !this.recordingState.isPaused) {
      this.mediaRecorder.pause();
      this.recordingState.isPaused = true;

      if (this.timerInterval !== null) {
        clearInterval(this.timerInterval);
      }

      this.notifyRecordingStateChange();
    }
  }

  // Resume recording
  resumeRecording(): void {
    if (this.mediaRecorder && this.recordingState.isRecording && this.recordingState.isPaused) {
      this.mediaRecorder.resume();
      this.recordingState.isPaused = false;

      this.timerInterval = window.setInterval(() => {
        this.recordingState.duration = Math.floor((Date.now() - this.startTime) / 1000);
        this.notifyRecordingStateChange();
      }, 100);

      this.notifyRecordingStateChange();
    }
  }

  // Stop recording
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.recordingState.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.recordingState.isRecording = false;
        this.recordingState.isPaused = false;

        if (this.timerInterval !== null) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }

        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordingState.audioBlob = audioBlob;
        this.notifyRecordingStateChange();

        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Convert audio blob to URL for playback
  createAudioURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  // Play audio
  playAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);

      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };

      audio.onerror = () => {
        reject(new Error('Failed to play audio'));
      };

      audio.play().catch(reject);
    });
  }

  // Speech to text (using Web Speech API)
  async speechToText(audioBlob: Blob, language: 'en-US' | 'hi-IN' = 'en-US'): Promise<string> {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[AudioEngine] Speech Recognition not supported, returning empty text');
      return '';
    }

    return new Promise((resolve, reject) => {
      const recognition = new SpeechRecognition();
      recognition.language = language;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      // Convert blob to audio element and play for recognition
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);

      audio.oncanplaythrough = () => {
        recognition.start();
        audio.play();
      };

      audio.onended = () => {
        URL.revokeObjectURL(url);
        recognition.stop();
      };
    });
  }

  // Text to speech (using Web Speech API)
  async textToSpeech(text: string, language: 'en' | 'hi' = 'en'): Promise<void> {
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = language === 'en' ? 'en-US' : 'hi-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    return new Promise((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error('Text-to-speech failed'));

      window.speechSynthesis.cancel(); // Cancel any previous utterance
      window.speechSynthesis.speak(utterance);
    });
  }

  // Get recording state
  getRecordingState(): RecordingState {
    return { ...this.recordingState };
  }

  // Subscribe to recording state changes
  onRecordingStateChange(listener: (state: RecordingState) => void): () => void {
    this.recordingListeners.push(listener);
    return () => {
      this.recordingListeners = this.recordingListeners.filter(l => l !== listener);
    };
  }

  // Notify listeners
  private notifyRecordingStateChange(): void {
    this.recordingListeners.forEach(listener => listener({ ...this.recordingState }));
  }

  // Clean up
  dispose(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.recordedChunks = [];
    this.recordingListeners = [];
  }

  // Format time for display (MM:SS)
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Check browser support
  static isSupported(): boolean {
    return !!(navigator.mediaDevices?.getUserMedia &&
      (window.AudioContext || (window as any).webkitAudioContext) &&
      typeof SpeechSynthesisUtterance !== 'undefined');
  }
}

// Global instance
let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}

export function resetAudioEngine(): void {
  if (audioEngineInstance) {
    audioEngineInstance.dispose();
    audioEngineInstance = null;
  }
}
