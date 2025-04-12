"use client";

import React from "react";

const BackgroundVideo: React.FC = () => {
  return (
    <video autoPlay muted loop className="w-[50%] h-full mx-auto">
      <source src="/ppbackground.mp4" type="video/mp4" />
    </video>
  );
};

export default BackgroundVideo;
