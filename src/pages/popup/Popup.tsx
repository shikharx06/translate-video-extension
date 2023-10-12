import React, { useEffect, useRef, useState } from "react";
import "@pages/popup/Popup.css";
import withSuspense from "@src/shared/hoc/withSuspense";
import { sendMessageToBackgroundAsync } from "@root/src/chrome/message";

const Popup = () => {
  const captureAudio = async () => {
    // https://stackoverflow.com/questions/50991321/chrome-extension-getusermedia-throws-notallowederror-failed-due-to-shutdown/51009577#51009577
    await navigator.mediaDevices.getUserMedia({ audio: true });

    sendMessageToBackgroundAsync({
      type: "startAudioRecording",
      input: "offscreen",
    });
  };

  return (
    <div className=" bg-black flex-col flex items-center justify-center h-screen">
      <h1>test extension</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        onClick={() => {
          captureAudio();
        }}
      >
        capture audio
      </button>
    </div>
  );
};

export default withSuspense(Popup);
