export type RecordAudioMessage = {
  type: "startAudioRecording";
  input?: string;
  data?: any;
};

export type StopAudioRecording = {
  type: "stopAudioRecording";
  input?: "offscreen";
  data?: any;
};

export type ErrorMessage = {
  type: "Error";
  input?: never;
  error: Error;
};
