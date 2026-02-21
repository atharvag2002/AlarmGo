import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { getDistance } from "geolib";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { LatLng, Marker, Polyline, Region } from "react-native-maps";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function sendNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "You are close!",
      body: "Less than 7KM remaining",
    },
    trigger: null,
  });
}

export default function Map() {
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const hasNotified = useRef(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // 📍 Continuous location tracking
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (location) => {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      );
    })();

    return () => {
      locationSubscription.current?.remove();
    };
  }, []);

  // 🔍 Search destination
  const handleSearch = async () => {
    try {
      setLoading(true);
      hasNotified.current = false; // reset alarm

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${search}`
      );
      const data = await response.json();

      if (data.length === 0) return;

      setDestination({
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // 📏 Distance calculation
  let distance = 0;

  if (userLocation && destination) {
    distance = getDistance(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      },
      {
        latitude: destination.latitude,
        longitude: destination.longitude,
      }
    );
  }

  // 🚨 Proximity Logic
  useEffect(() => {
    if (!destination || !userLocation) return;

    if (distance < 7000 && !hasNotified.current) {
      sendNotification();
      hasNotified.current = true;
    }
  }, [distance, destination, userLocation]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textinput}
        placeholder="Enter Destination..."
        value={search}
        onChangeText={setSearch}
      />

      <MapView
        style={styles.map}
        showsUserLocation
        region={userLocation ?? undefined}
      >
        {destination && <Marker coordinate={destination} />}
        {destination && userLocation && (
        <Polyline
          coordinates={[
            {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
            destination,
          ]}
          strokeWidth={3}
          strokeColor="black"
          lineDashPattern={[15,20]}
       
        />
      )}
      </MapView>

      <Pressable
        style={[styles.notification, loading && { backgroundColor: "grey" }]}
        onPress={handleSearch}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Searching..." : "Search"}
        </Text>
      </Pressable>

      <Text style={styles.text}>
        USER: {userLocation?.latitude} | {userLocation?.longitude}
        {"\n"}
        DESTINATION: {destination?.latitude} | {destination?.longitude}
        {"\n\n"}
        DISTANCE: {distance /1000} KM
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  map: { flex: 1 },

  textinput: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    position: "absolute",
    top: 20,
    left: 15,
    right: 15,
    zIndex: 10,
    elevation: 10,
  },

  text: {
    backgroundColor: "black",
    position: "absolute",
    bottom: 30,
    left: 15,
    right: 15,
    padding: 10,
    color: "white",
    zIndex: 10,
    elevation: 10,
  },

  notification: {
    backgroundColor: "black",
    position: "absolute",
    top: 90,
    left: 15,
    right: 15,
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
    elevation: 10,
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
});