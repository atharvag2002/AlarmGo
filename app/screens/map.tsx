import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { getDistance } from "geolib";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { LatLng, Marker, Polyline } from "react-native-maps";

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
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [destinationSelected, setDestinationSelected] = useState(false);

  const hasNotified = useRef(false);
  const locationSubscription =
    useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView>(null);

  // 📍 Continuous tracking
  useEffect(() => {
    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      locationSubscription.current =
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          (location) => {
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
    })();

    return () => {
      locationSubscription.current?.remove();
    };
  }, []);

  // 📍 Center on user when location is first available
  useEffect(() => {
    if (userLocation) {
      centerOnUser();
    }
  }, [userLocation]);

  const centerOnUser = () => {
    if (!userLocation || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  };

  // 🔎 Suggestions (debounced)
  useEffect(() => {
    if (search.length < 3 || destinationSelected) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${search}`
        );
        const data = await res.json();
        setSuggestions(data.slice(0, 5));
      } catch (err) {
        console.log(err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, destinationSelected]);

  // 📍 Auto zoom
  useEffect(() => {
    if (!destination || !userLocation || !mapRef.current) return;

    mapRef.current.fitToCoordinates(
      [userLocation, destination],
      {
        edgePadding: { top: 150, right: 50, bottom: 150, left: 50 },
        animated: true,
      }
    );
  }, [destination]);

  // 📏 Distance
  const distance =
    userLocation && destination
      ? getDistance(userLocation, destination)
      : 0;

  // 🚨 Proximity
  useEffect(() => {
    if (!destination || !userLocation) return;

    if (distance < 7000 && !hasNotified.current) {
      sendNotification();
      hasNotified.current = true;
    }
  }, [distance]);

  return (
    <View style={styles.container}>
      {/* Map as background */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        showsUserLocation
        showsMyLocationButton={false} 
      >
        {destination && <Marker coordinate={destination} />}

        {destination && userLocation && (
          <Polyline
            coordinates={[userLocation, destination]}
            strokeWidth={3}
            strokeColor="black"
            lineDashPattern={[15, 20]}
          />
        )}
      </MapView>

      {/* Overlay UI */}
      <View style={styles.overlay}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Search destination..."
            value={search}
            onChangeText={setSearch}
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => {
                setSearch("");
                setSuggestions([]);
                setDestination(null);
                setDestinationSelected(false);
                hasNotified.current = false;
              }}
              style={styles.clearBtn}
            >
              <Text style={{ fontWeight: "bold" }}>X</Text>
            </Pressable>
          )}
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {suggestions.map((item) => (
              <Pressable
                key={item.place_id}
                onPress={() => {
                  setDestination({
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon),
                  });
                  setSearch(item.display_name);
                  setSuggestions([]);
                  setDestinationSelected(true);
                  hasNotified.current = false;
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.suggestionText}>
                  {item.display_name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Pressable style={styles.centerButton} onPress={centerOnUser}>
        <Text>📍</Text>
      </Pressable>

      {/* Bottom Info */}
      <View style={styles.bottomCard}>
        <Text style={{ color: "white" }}>
          Distance: {(distance / 1000).toFixed(2)} KM
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  overlay: {
    paddingTop: 20,
    paddingHorizontal: 15,
  },

  centerButton: {
    position: "absolute",
    bottom: 120,
    right: 20,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 30,
    elevation: 5,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "white",
  },

  clearBtn: {
    marginLeft: 8,
    padding: 10,
    backgroundColor: "white",
    borderRadius: 8,
  },

  suggestionBox: {
    marginTop: 8,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    maxHeight: 200,
  },

  suggestionText: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },

  bottomCard: {
    position: "absolute",
    bottom: 30,
    left: 15,
    right: 15,
    backgroundColor: "black",
    padding: 15,
    borderRadius: 10,
  },
});