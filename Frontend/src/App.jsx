// File: client/src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function App() {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // for checking that modrn browser use speech recognisation instead of webkitspeech recognisation to undestand the text speach.
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition");
      return;
    }
  // make a instence of speechrecognisation 
    const recognition = new SpeechRecognition();
    recognition.continuous = false;  
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;

      // Add user message to chat
      setMessages((prev) => [...prev, { from: 'user', text: transcript }]);

      // Send to backend
      await sendToGemini(transcript);
    };

    recognition.onerror = (e) => {
      console.error("Speech Recognition Error:", e);

    };
    
  recognition.onend = () => {
    // 👇 Auto restart if user didn't click stop
    if (isListening) {
      recognition.start();
    }
  };

    recognitionRef.current = recognition;
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

 const sendToGemini = async (text) => {
  try {
    const res = await axios.post("http://localhost:5000/api/gemini", { text });
    const { reply, audioContent } = res.data;

    // ✅ Add Gemini message to chat
    setMessages((prev) => [...prev, { from: 'gemini', text: reply }]);

    // ✅ Set and play audio
    if (audioRef.current) {
      audioRef.current.src = "data:audio/mp3;base64," + audioContent;
      audioRef.current.play();
    }
  } catch (err) {
    console.error("❌ Error sending to Gemini:", err);
  }
};



  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-center mb-4">🎤 Revolt Voice chat support</h1>

        <div className="overflow-y-auto max-h-96 space-y-2 mb-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-4 py-2 rounded-lg text-sm max-w-xs break-words ${
                  msg.from === 'user'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={toggleListening}
          className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors duration-200 ${
            isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isListening ? '🛑 Stop Listening' : '🎙️ Start Speaking'}
        </button>

        {/* Hidden audio tag */}
        <audio ref={audioRef} hidden />
      </div>
    </div>
  );
}

export default App;
