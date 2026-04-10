import { useState, useRef } from "react";

const VideoShowcase = () => {
  const [frame, setFrame] = useState(1);

  return (
    <div className="w-screen h-screen overflow-hidden" style={{ backgroundColor: "#f2f1f3" }}>
      {frame === 1 && (
        <div className="w-full h-full flex items-center justify-center">
          <video
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
          onEnded={() => setFrame(3)}
        />
      )}

      {frame === 3 && (
        <video
          className="w-full h-full object-cover"
          src="/videos/Logo-5-remix.mp4"
          autoPlay
          muted
          playsInline
        />
      )}
    </div>
  );
};

export default VideoShowcase;
