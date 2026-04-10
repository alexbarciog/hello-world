const VideoShowcase = () => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f2f1f3" }}>
      <video
        className="w-full max-w-4xl rounded-2xl shadow-2xl"
        src="/videos/Search.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
};

export default VideoShowcase;
