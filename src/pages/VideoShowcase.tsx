const VideoShowcase = () => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f2f1f3" }}>
      <video
        className="w-full max-w-4xl"
        src="/videos/Search_1.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
};

export default VideoShowcase;
