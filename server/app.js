import express from "express";
import bodyParser from "body-parser";
import { Expo } from "expo-server-sdk";

const app = express();
app.use(bodyParser.json());

const expo = new Expo();
let savedTokens = []; // in real case, save in DB

// ✅ Save token from mobile app
app.post("/api/save-token", (req, res) => {
  const { token } = req.body;

  if (Expo.isExpoPushToken(token)) {
    // Only add if not already saved
    if (!savedTokens.includes(token)) {
      savedTokens.push(token);
      console.log("Saved token:", token);
    } else {
      console.log("Token already saved:", token);
    }
    res.send({ success: true });
  } else {
    res.status(400).send({ error: "Invalid Expo push token" });
  }
});

// ✅ Send notification
app.post("/api/send", async (req, res) => {
  const { title, body, sound, data } = req.body;

  if (savedTokens.length === 0) {
    return res.status(400).send({ error: "No tokens saved yet" });
  }

  const messages = savedTokens.map((pushToken) => ({
    to: pushToken,
    sound: sound || "default", // iOS/Android sound
    title: title || "Default Title",
    body: body || "Default body text",
    data: data || { extra: "meta info" },
  }));

  try {
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    res.send({ success: true, tickets });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
