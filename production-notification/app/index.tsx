import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform, StatusBar, Text, View } from "react-native";

//push notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // iOS: show banner when foreground
    shouldShowList: true, // iOS: show in Notification Center
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  // Ask for permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Permission not granted for notifications!");
    return;
  }

  // Get Expo push token
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Expo Push Token:", token);

  //  Send token to backend
  await fetch("http://192.168.1.6:3000/api/save-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  // Android needs a channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listen when a notification is received
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    return () => subscription.remove();
  }, []);

  //to show the token on screen
  const [expoToken, setExpoToken] = useState("");

  useEffect(() => {
    registerForPushNotificationsAsync().then((t) => {
      if (t) setExpoToken(t);
    });
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <StatusBar barStyle={"dark-content"} />
      <Text>Production level Push Notifications Test 🚀</Text>
      <Text selectable>{expoToken}</Text>
    </View>
  );
}
