import {
  Message,
  sendErrorMessageToClient,
  sendMessageToClient,
} from "@root/src/chrome/message";
import reloadOnUpdate from "virtual:reload-on-update-in-background-script";
import Logger from "./lib/utils/logger";

reloadOnUpdate("pages/background");

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate("pages/content/style.scss");

type RequiredDataNullableInput<T extends Message> = {
  type: T["type"];
  input?: unknown;
  data: Exclude<T["data"], undefined>;
};

// chrome.action.onClicked.addListener(async (tab) => {
//   const existingContexts = await (chrome.runtime as any).getContexts({});

//   const offScreenDocument = existingContexts.find(
//     (c) => c.contextType === "OFFSCREEN_DOCUMENT"
//   );

//   // If an offscreen document is not already open, create one.
//   if (!offScreenDocument) {
//     // Create an offscreen document.
//     await chrome.offscreen.createDocument({
//       url: "offscreen.html",
//       reasons: [chrome.offscreen.Reason.USER_MEDIA],
//       justification: "Recording from chrome.tabCapture API",
//     });
//   }

//   // Get a MediaStream for the active tab.
//   const streamId = await chrome.tabCapture.getMediaStreamId(
//     {
//       targetTabId: tab.id,
//     },
//     null
//   );
// });

chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    console.log("Port disconnected");
  });
  port.onMessage.addListener(async (message: Message) => {
    Logger.receive(message);

    const sendResponse = <M extends Message>(
      message: RequiredDataNullableInput<M>
    ) => {
      Logger.send(message);
      sendMessageToClient(port, message);
    };

    try {
      switch (message.type) {
        case "startAudioRecording": {
          if (message.input !== "offscreen") break;

          startRecording(message.data);
          break;
        }
        case "stopAudioRecording": {
          if (message.input !== "offscreen") break;

          stopRecording();

          break;
        }
        default:
          return;
      }
    } catch (error) {
      Logger.warn(error);
      sendErrorMessageToClient(port, error);
    }
  });
});

let recorder,
  data = [];

async function startRecording(streamId) {
  if (recorder?.state === "recording") {
    throw new Error("Called startRecording while recording is in progress.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  // Continue to play the captured audio to the user.
  const output = new AudioContext();
  const source = output.createMediaStreamSource(stream);
  source.connect(output.destination);

  // Start recording.
  recorder = new MediaRecorder(stream, { mimeType: "audio/mp3" });
  recorder.ondataavailable = (event) => data.push(event.data);
  recorder.onstop = () => {
    const blob = new Blob(data, { type: "audio/mp3" });
    window.open(URL.createObjectURL(blob), "_blank");

    // Clear state ready for next recording
    recorder = undefined;
    data = [];
  };
  recorder.start();

  // Record the current state in the URL. This provides a very low-bandwidth
  // way of communicating with the service worker (the service worker can check
  // the URL of the document and see the current recording state). We can't
  // store that directly in the service worker as it may be terminated while
  // recording is in progress. We could write it to storage but that slightly
  // increases the risk of things getting out of sync.
  window.location.hash = "recording";
}

async function stopRecording() {
  recorder.stop();

  // Stopping the tracks makes sure the recording icon in the tab is removed.
  recorder.stream.getTracks().forEach((t) => t.stop());

  // Update current state in URL
  window.location.hash = "";

  // Note: In a real extension, you would want to write the recording to a more
  // permanent location (e.g IndexedDB) and then close the offscreen document,
  // to avoid keeping a document around unnecessarily. Here we avoid that to
  // make sure the browser keeps the Object URL we create (see above) and to
  // keep the sample fairly simple to follow.
}

console.log("background loaded");
