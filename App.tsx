import React, { useState, useEffect } from 'react';
import { Download, Edit2, CheckCircle2, RefreshCw, Type } from 'lucide-react';
import { VideoUploader } from './components/VideoUploader';
import { VideoPreview } from './components/VideoPreview';
import { Button } from './components/ui/Button';
import { ProcessingStatus, ReelData } from './types';
import { processVideo } from './utils/videoProcessor';

const DEFAULT_DATA: ReelData = {
  address: "Ajmera Trends\nShop No. XX, Main Market\nCity - XXXXXX",
  mobile: "+91 XXXXX XXXXX",
  addressScale: 1.0,
  mobileScale: 1.0
};

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [reelData, setReelData] = useState<ReelData>(DEFAULT_DATA);
  const [isEditing, setIsEditing] = useState(true);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [progress, setProgress] = useState(0);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoSrc(url);
    setIsEditing(true);
    setStatus(ProcessingStatus.IDLE);
  };

  const handleDownload = async () => {
    if (!videoSrc) return;

    try {
      setStatus(ProcessingStatus.PROCESSING);
      setProgress(0);

      const blob = await processVideo(videoSrc, reelData, (p) => setProgress(p));
      
      // Trigger Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AjmeraTrends-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus(ProcessingStatus.COMPLETED);
    } catch (error) {
      console.error(error);
      setStatus(ProcessingStatus.ERROR);
      alert('Failed to process video. Please try a different file.');
    } finally {
      setTimeout(() => setStatus(ProcessingStatus.IDLE), 2000);
    }
  };

  const handleReset = () => {
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    setVideoFile(null);
    setVideoSrc(null);
    setStatus(ProcessingStatus.IDLE);
    setReelData(DEFAULT_DATA);
  };

  if (!videoSrc) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <header className="mb-12 text-center">
          <div className="inline-block p-3 bg-white rounded-2xl shadow-sm mb-4">
             <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="font-bold text-white text-2xl">A</span>
             </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Ajmera Trends
          </h1>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">
            Professional Reel Editor. Brand your content instantly.
          </p>
        </header>
        <VideoUploader onFileSelect={handleFileSelect} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex-none h-16 border-b border-slate-200 bg-white z-20 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-white text-lg">A</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 hidden md:inline">Ajmera Trends</span>
        </div>
        <Button variant="ghost" onClick={handleReset} className="text-sm px-4 py-2 h-10">
          <RefreshCw size={16} className="mr-2" />
          New Project
        </Button>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left: Preview Area */}
        <div className="flex-1 bg-slate-100 relative flex items-center justify-center p-4 md:p-8 overflow-y-auto">
           <div className="relative z-10 w-full max-w-[400px] aspect-[9/16] shadow-2xl rounded-2xl overflow-hidden bg-black ring-4 ring-white">
             <VideoPreview src={videoSrc} data={reelData} />
           </div>
        </div>

        {/* Right: Controls Area */}
        <div className="w-full md:w-[420px] bg-white border-l border-slate-200 flex flex-col z-20 shadow-xl">
          <div className="p-6 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
            
            {/* Title Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Edit2 size={20} className="text-blue-600" />
                Customize Overlay
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Edit text and adjust sizes below.
              </p>
            </div>

            {/* Inputs */}
            <div className={`space-y-8 transition-opacity duration-300 ${!isEditing ? 'opacity-50 pointer-events-none' : ''}`}>
              
              {/* Address Section */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                     Size: {(reelData.addressScale * 100).toFixed(0)}%
                  </span>
                </div>
                <textarea
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none h-20 text-sm leading-relaxed shadow-sm"
                  placeholder="Enter full address (e.g. Shop XX, Market X...)"
                  value={reelData.address}
                  onChange={(e) => setReelData(prev => ({ ...prev, address: e.target.value }))}
                />
                
                {/* Address Font Slider */}
                <div className="flex items-center gap-3">
                  <Type size={14} className="text-slate-400" />
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1" 
                    value={reelData.addressScale}
                    onChange={(e) => setReelData(prev => ({ ...prev, addressScale: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <Type size={18} className="text-slate-600" />
                </div>
              </div>

              {/* Mobile Section */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                     Size: {(reelData.mobileScale * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono font-medium shadow-sm"
                  placeholder="+91 XXXXX XXXXX"
                  value={reelData.mobile}
                  onChange={(e) => setReelData(prev => ({ ...prev, mobile: e.target.value }))}
                />

                {/* Mobile Font Slider */}
                <div className="flex items-center gap-3">
                  <Type size={14} className="text-slate-400" />
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1" 
                    value={reelData.mobileScale}
                    onChange={(e) => setReelData(prev => ({ ...prev, mobileScale: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <Type size={18} className="text-slate-600" />
                </div>
              </div>

            </div>
          </div>

          {/* Action Bar */}
          <div className="p-6 bg-white border-t border-slate-200 space-y-4">
            
            {isEditing ? (
              <Button 
                onClick={() => setIsEditing(false)} 
                className="w-full"
                variant="primary"
                icon={<CheckCircle2 size={18} />}
              >
                Update Preview
              </Button>
            ) : (
              <div className="flex gap-3">
                 <Button 
                  onClick={() => setIsEditing(true)} 
                  className="flex-1"
                  variant="secondary"
                  icon={<Edit2 size={18} />}
                >
                  Edit
                </Button>
                <Button 
                  onClick={handleDownload} 
                  className="flex-[2]"
                  variant="primary"
                  isLoading={status === ProcessingStatus.PROCESSING}
                  icon={<Download size={18} />}
                >
                  {status === ProcessingStatus.PROCESSING 
                    ? `Processing ${progress}%` 
                    : status === ProcessingStatus.COMPLETED 
                    ? 'Downloaded!' 
                    : 'Download Reel'}
                </Button>
              </div>
            )}
            
            {status === ProcessingStatus.PROCESSING && (
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
             {status === ProcessingStatus.PROCESSING && (
               <p className="text-xs text-center text-slate-500 animate-pulse">
                 Rendering high quality video... please wait.
               </p>
             )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;