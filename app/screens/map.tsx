import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { getDistance } from "geolib";
import { useEffect, useRef, useState } from "react";
import { styles } from "../styles/map";

import {
  Dimensions,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Circle, LatLng, Marker, Polyline } from "react-native-maps";

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
      title: "Destination Reached!",
      body: `You have entered the trigger zone (${(triggerDistance / 1000).toFixed(1)} KM radius)`,
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
  const [triggerDistance, setTriggerDistance] = useState(100);
  const [showDistanceInput, setShowDistanceInput] = useState(false);
  const [distanceInput, setDistanceInput] = useState("");
  const [isSelectingPin, setIsSelectingPin] = useState(false);
  const [tempPinPosition, setTempPinPosition] = useState<LatLng | null>(null);

  const hasNotified = useRef(false);
  const locationSubscription =
    useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView>(null);
  const { width, height } = Dimensions.get("window");
  const [pulsePhase, setPulsePhase] = useState(0);

  // 📍 Continuous tracking (background enabled)
  useEffect(() => {
    // Pulsing effect using interval
    const pulseInterval = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 100);
    }, 30);

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
      clearInterval(pulseInterval);
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
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=5`
        );
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const text = await res.text();
        
        if (!text || text.trim() === '') {
          setSuggestions([]);
          return;
        }
        
        const data = JSON.parse(text);
        setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (err) {
        console.log('Search error:', err);
        setSuggestions([]);
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

  // 🚨 Proximity - Check if destination is within trigger zone
  useEffect(() => {
    if (!destination || !userLocation) return;

    if (distance < triggerDistance && !hasNotified.current) {
      sendNotification(triggerDistance);
      hasNotified.current = true;
    } else if (distance >= triggerDistance && hasNotified.current) {
      // Reset notification when destination leaves trigger zone
      hasNotified.current = false;
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

  const startPinSelection = () => {
    setIsSelectingPin(true);
    setFabMenuOpen(false);
    // Get initial center position for the pin
    if (mapRef.current) {
      mapRef.current.getCamera().then((camera) => {
        setTempPinPosition({
          latitude: camera.center.latitude,
          longitude: camera.center.longitude,
        });
      });
    }
  };

  const cancelPinSelection = () => {
    setIsSelectingPin(false);
    setTempPinPosition(null);
  };

  const confirmPinSelection = () => {
    if (tempPinPosition) {
      setDestination(tempPinPosition);
      setDestinationSelected(true);
      setSearch("");
      setSuggestions([]);
      hasNotified.current = false;
    }
    setIsSelectingPin(false);
    setTempPinPosition(null);
  };

  const handleMapRegionChange = () => {
    if (isSelectingPin && mapRef.current) {
      mapRef.current.getCamera().then((camera) => {
        setTempPinPosition({
          latitude: camera.center.latitude,
          longitude: camera.center.longitude,
        });
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Map as background */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={handleMapRegionChange}
      >
        {userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={triggerDistance}
              strokeColor="rgba(255, 0, 0, 0.8)"
              fillColor="rgba(255, 0, 0, 0.2)"
              strokeWidth={2}
            />
            
            {/* Pulsing wave circles */}
            <Circle
              center={userLocation}
              radius={triggerDistance * (1 + pulsePhase * 0.002)}
              strokeColor="rgba(255, 0, 0, 0.4)"
              fillColor="transparent"
              strokeWidth={2}
            />
            
            <Circle
              center={userLocation}
              radius={triggerDistance * (1 + ((pulsePhase + 33) % 100) * 0.002)}
              strokeColor="rgba(255, 0, 0, 0.2)"
              fillColor="transparent"
              strokeWidth={2}
            />
            
            <Circle
              center={userLocation}
              radius={triggerDistance * (1 + ((pulsePhase + 66) % 100) * 0.002)}
              strokeColor="rgba(255, 0, 0, 0.1)"
              fillColor="transparent"
              strokeWidth={1}
            />
          </>
        )}
        
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

      {/* Center Pin for Selection Mode */}
      {isSelectingPin && (
        <View style={styles.centerPinContainer}>
          <View style={styles.centerPin}>
            <View style={styles.pinHead} />
            <View style={styles.pinShaft} />
          </View>
        </View>
      )}

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

      {/* Pin Selection Overlay */}
      {isSelectingPin && (
        <View style={styles.pinSelectionOverlay}>
          <View style={styles.pinSelectionInstructions}>
            <Text style={styles.pinSelectionText}>
              Move the map to position the pin
            </Text>
          </View>
          
          <View style={styles.pinSelectionButtons}>
            <Pressable 
              style={[styles.pinButton, styles.cancelPinButton]} 
              onPress={cancelPinSelection}
            >
              <Text style={styles.pinButtonText}>Cancel</Text>
            </Pressable>
            <Pressable 
              style={[styles.pinButton, styles.confirmPinButton]} 
              onPress={confirmPinSelection}
            >
              <Text style={styles.pinButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}

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
            
            <Pressable 
              style={styles.fabMenuItem} 
              onPress={startPinSelection}
            >
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
          Trigger: {triggerDistance }M
        </Text>
      </View>
    </View>
  );
}
