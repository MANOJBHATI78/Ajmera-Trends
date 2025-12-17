import React, { useRef, useEffect } from 'react';
import { ReelData } from '../types';

interface VideoPreviewProps {
  src: string;
  data: ReelData;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ src, data }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [src]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200 flex items-center justify-center">
      {/* Aspect Ratio Container */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain bg-black"
        controls={true}
        loop
        playsInline
      />
      
      {/* Overlay Layer */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none">
        {/* 
            Using flex-col justify-end ensures natural stacking.
            If content grows, it pushes up, preventing overlap.
            The gradient height is set to min-h-[25%] to match logic.
        */}
        <div className="w-full min-h-[25vh] bg-gradient-to-b from-transparent via-black/60 to-black/95 flex flex-col justify-end pb-[5%] px-6 text-center">
          
          {/* Address */}
          <div className="mb-[2.5%]">
            <p 
              className="text-white font-medium leading-snug tracking-wide whitespace-pre-line break-words"
              style={{ 
                textShadow: '0 2px 4px rgba(0,0,0,1)',
                fontSize: `${1 * data.addressScale}rem` 
              }}
            >
              {data.address || "Ajmera Trends\nCity - XXXXXX"}
            </p>
          </div>

          {/* Mobile */}
          <div>
            <p 
              className="text-white font-bold tracking-tight"
              style={{ 
                textShadow: '0 2px 8px rgba(0,0,0,1)',
                fontSize: `${1.5 * data.mobileScale}rem`
              }}
            >
              {data.mobile || "+91 XXXXX XXXXX"}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};