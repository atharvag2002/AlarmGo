import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { getDistance } from "geolib";
import { useEffect, useRef, useState } from "react";
import { styles } from "../styles/map";

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

async function sendNotification(triggerDistance: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "You are close!",
      body: `Less than ${(triggerDistance / 1000).toFixed(0)} KM remaining`,
      sound: "alarm.mp3", // Custom sound file
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
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [triggerDistance, setTriggerDistance] = useState(7000);
  const [showDistanceInput, setShowDistanceInput] = useState(false);
  const [distanceInput, setDistanceInput] = useState("");

  const hasNotified = useRef(false);
  const locationSubscription =
    useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView>(null);

  // 📍 Continuous tracking (background enabled)
  useEffect(() => {
    (async () => {
      // Request foreground permissions first
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== "granted") return;

      // Then request background permissions
      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== "granted") {
        console.log("Background location permission not granted");
      }

      // Start location tracking with background capability
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

  // � Request notification permissions
  useEffect(() => {
    (async () => {
      await Notifications.requestPermissionsAsync();
    })();
  }, []);

  // �� Center on user when location is first available
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

    if (distance < triggerDistance && !hasNotified.current) {
      sendNotification(triggerDistance);
      hasNotified.current = true;
    }
  }, [distance, triggerDistance]);

  const handleSetDistance = () => {
    const num = parseInt(distanceInput, 10);
    if (!isNaN(num) && num > 0) {
      setTriggerDistance(num);
      hasNotified.current = false; // Reset notification if distance changes
    }
    setShowDistanceInput(false);
    setDistanceInput("");
  };

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

      {/* Distance Input Overlay */}
      {showDistanceInput && (
        <View style={styles.distanceInputOverlay}>
          <View style={styles.distanceInputContainer}>
            <Text style={styles.distanceInputLabel}>Set Trigger Distance (meters)</Text>
            <TextInput
              style={styles.distanceInput}
              placeholder="Enter distance in meters"
              value={distanceInput}
              onChangeText={setDistanceInput}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.distanceButtons}>
              <Pressable 
                style={[styles.distanceButton, styles.cancelButton]} 
                onPress={() => setShowDistanceInput(false)}
              >
                <Text style={styles.distanceButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.distanceButton, styles.saveButton]} 
                onPress={handleSetDistance}
              >
                <Text style={styles.distanceButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* FAB Menu */}
      <View style={styles.fabContainer}>
        {/* Menu Items */}
        {fabMenuOpen && (
          <View style={styles.fabMenu}>
            <Pressable style={styles.fabMenuItem} onPress={centerOnUser}>
              <Text style={styles.fabMenuIcon}>🎯</Text>
            </Pressable>
            
            <Pressable 
              style={styles.fabMenuItem} 
              onPress={() => setShowDistanceInput(true)}
            >
              <Text style={styles.fabMenuIcon}>📏</Text>
            </Pressable>
            
            <Pressable style={styles.fabMenuItem}>
              <Text style={styles.fabMenuIcon}>📍</Text>
            </Pressable>
          </View>
        )}
        
        {/* Main FAB Button */}
        <Pressable 
          style={[styles.fabButton, fabMenuOpen && styles.fabButtonActive]} 
          onPress={() => setFabMenuOpen(!fabMenuOpen)}
        >
          <Text style={styles.fabButtonText}>⋮</Text>
        </Pressable>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomCard}>
        <Text style={{ color: "white" }}>
          Distance: {(distance / 1000).toFixed(2)} KM
        </Text>
        <Text style={{ color: "white", marginTop: 4 }}>
          Trigger: {(triggerDistance / 1000).toFixed(0)} KM
        </Text>
      </View>
    </View>
  );
}
