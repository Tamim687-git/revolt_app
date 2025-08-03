const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Google TTS client with credentials
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, 'google-credentials.json'),
});

app.post('/api/gemini', async (req, res) => {
  const userText = req.body.text;
  console.log("📥 Received from frontend:", userText);

  try {
    console.log("🔁 Sending to Gemini API...");

    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: userText }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("✅ Gemini Reply:", reply);

    if (!reply) throw new Error("No reply from Gemini");

    console.log("🔊 Sending reply to TTS...");
    const [ttsRes] = await client.synthesizeSpeech({
      input: { text: reply },
      voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' }
    });

    const audioBase64 = ttsRes.audioContent;
    console.log("✅ TTS audio created:", audioBase64.length, "bytes");

    res.json({
      reply,
      audioContent: audioBase64
    });

  } catch (err) {
    console.error("❌ Error in Gemini or TTS:", err.response?.data || err.message);
    res.status(500).send("Server error from Gemini or TTS");
  }
});

app.listen(5000, () => {
  console.log("🚀 Backend server running at http://localhost:5000");
});
