import { useRef, useState, useEffect } from 'react';
import { Mic, Square, PlayCircle, Trash2, Plus, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  onVoiceNoteSaved: (audioUrl: string, duration: number) => void;
  maxNotes?: number;
  existingNoteCount?: number;
}

export default function VoiceNoteRecorder({ onVoiceNoteSaved, maxNotes = 3, existingNoteCount = 0 }: Props) {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{ url: string; duration: number } | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const canAddMore = existingNoteCount < maxNotes;

  const startRecording = async () => {
    if (!canAddMore) {
      setError(`Maximum ${maxNotes} voice notes allowed`);
      return;
    }

    setError('');
    setRecordingTime(0);
    audioChunks.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio({ url: audioUrl, duration: recordingTime });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSave = () => {
    if (recordedAudio) {
      onVoiceNoteSaved(recordedAudio.url, recordedAudio.duration);
      setRecordedAudio(null);
      setRecordingTime(0);
    }
  };

  const handleDiscard = () => {
    setRecordedAudio(null);
    setRecordingTime(0);
    if (recordedAudio?.url) {
      URL.revokeObjectURL(recordedAudio.url);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!canAddMore && !recordedAudio) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2">
        <AlertCircle size={16} className="text-amber-400" />
        <p className="text-amber-300 text-sm">Maximum voice notes reached ({existingNoteCount}/{maxNotes})</p>
      </div>
    );
  }

  if (recordedAudio) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-emerald-400 font-medium text-sm">Voice Note Recorded</p>
          <span className="text-emerald-400 text-sm font-mono">{formatTime(recordedAudio.duration)}</span>
        </div>
        <audio ref={audioRef} src={recordedAudio.url} onEnded={() => setIsPlaying(false)} />
        <div className="flex gap-2">
          <button
            onClick={handlePlay}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            <PlayCircle size={14} /> {isPlaying ? 'Playing' : 'Play'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            <CheckCircle size={14} /> Save
          </button>
          <button
            onClick={handleDiscard}
            className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-medium"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-medium text-sm">Add Voice Note</p>
          <p className="text-gray-500 text-xs mt-0.5">Describe your preferences using voice</p>
        </div>
        <span className="text-gray-600 text-xs bg-gray-800 px-2 py-1 rounded">{existingNoteCount}/{maxNotes}</span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-3 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400" />
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {isRecording ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center animate-pulse">
              <Mic size={16} className="text-red-400" />
            </div>
            <div>
              <p className="text-red-400 font-medium text-sm">Recording...</p>
              <p className="text-gray-500 text-xs font-mono">{formatTime(recordingTime)}</p>
            </div>
          </div>
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Square size={14} /> Stop
          </button>
        </div>
      ) : (
        <button
          onClick={startRecording}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg text-sm font-medium"
        >
          <Mic size={16} /> Start Recording
        </button>
      )}
    </div>
  );
}
