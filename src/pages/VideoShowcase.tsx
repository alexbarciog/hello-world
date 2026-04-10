import { useState, useRef } from "react";

const VideoShowcase = () => {
  const [frame, setFrame] = useState(1);
  const video1Ref = useRef<HTMLVideoElement>(null);

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ backgroundColor: "#f2f1f3" }}>
      {frame === 1 && (
        <div className="w-full h-full flex items-center justify-center">
          <video
            ref={video1Ref}
            className="w-full max-w-4xl"
            src="/videos/Search_1.mp4"
            autoPlay
            muted
            playsInline
            onEnded={() => setFrame(2)}
          />
        </div>
      )}

      {frame === 2 && (
        <video
          className="w-full h-full object-cover"
          src="/videos/Simple-text-remix.mp4"
          autoPlay
          muted
          playsInline
        />
      )}
    </div>
  );
};

export default VideoShowcase;
