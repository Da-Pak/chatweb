import { useState, useRef, useCallback, useEffect } from 'react';

// Web Speech API의 타입 정의 (window 객체에 없을 수 있으므로)
interface CustomWindow extends Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

declare const window: CustomWindow;

export type RecordingStatus = "idle" | "recording" | "error";

export const useVoiceToText = (onTranscriptReceived: (transcript: string, isFinal: boolean) => void) => {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("이 브라우저는 Web Speech API를 지원하지 않습니다.");
      setStatus("error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // 중간 결과도 계속 받음
    recognition.interimResults = true; // 최종 결과가 아니어도 받음
    recognition.lang = 'ko-KR'; // 한국어 설정

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      onTranscriptReceived(finalTranscript || interimTranscript, finalTranscript ? true : false);
    };

    recognition.onerror = (event: any) => {
      console.error("음성 인식 오류:", event.error);
      setStatus("error");
    };

    recognition.onend = () => {
      setStatus("idle");
    };

    recognitionRef.current = recognition;
  }, [onTranscriptReceived]);

  const toggleRecording = useCallback(() => {
    if (status === "recording") {
      recognitionRef.current?.stop();
    } else if (status === "idle") {
      recognitionRef.current?.start();
      setStatus("recording");
    }
  }, [status]);

  return { status, toggleRecording };
}; 