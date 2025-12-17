import React, { useRef, useState } from 'react';
import { Upload, FileVideo, AlertCircle } from 'lucide-react';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const validateAndSelect = (file: File) => {
    setError(null);
    if (!file.type.startsWith('video/')) {
      setError('Please upload a valid video file (MP4, MOV).');
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-80 rounded-3xl border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50 shadow-sm'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        
        <div className="z-10 flex flex-col items-center text-center p-6 space-y-4">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:scale-110 transition-transform'}`}>
            <Upload size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Upload Reel</h3>
            <p className="text-sm text-slate-500 mt-2">Drag & Drop or Click to Browse</p>
          </div>
          <div className="flex gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <FileVideo size={14} />
            <span>MP4, MOV (Max 100MB)</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="video/*"
          onChange={handleChange}
        />
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-sm animate-pulse">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};