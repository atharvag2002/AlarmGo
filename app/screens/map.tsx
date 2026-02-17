import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { getDistance } from "geolib";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { LatLng, Marker, Region } from "react-native-maps";

Notifications.requestPermissionsAsync();

function sendNotification() {
  Notifications.scheduleNotificationAsync({
    content: {
      title: "hello",
      body: "hello",
    },
    trigger: null,
  });
}

Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });


 
export default function Map() {
  const [userlocation, setUserlocation] = useState<Region | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [search, setSearch] = useState<string>("");
  const [loading, setloading] = useState<boolean>(false);
  const [error , setError] = useState<string>("");  
  useEffect(()=>{

    console.log("destination",destination)
    },[destination]);

 
  const handleSearch = async () =>{
    try{
      console.log("search pressed");

      setloading(true);
      setError("");
      setSearch(search);

      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${search}`);
      const data = await response.json();
      console.log(data);

      setDestination({
        latitude:parseFloat(data[0].lat),
        longitude:parseFloat(data[0].lon)
      })

     
     

    }
    catch{}
    finally{

    }


  }


  let distance = 0;
  if (userlocation && destination) {
    distance = getDistance(
      { latitude: userlocation.latitude, longitude: userlocation.longitude },
      { latitude: destination.latitude, longitude: destination.longitude }
    );
  }


  useEffect(() => {
    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});

      setUserlocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <TextInput style={styles.textinput} 
      placeholder="Enter Destination..."
      onChangeText={setSearch} 
      value={search} />

      <MapView
        style={styles.map}
        showsUserLocation
        region={userlocation ?? undefined}
      >
        {destination && <Marker coordinate={destination} />}
      </MapView>

      <Pressable style={styles.notification} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </Pressable>

      <Text style={styles.text}>
        USER: {userlocation?.longitude} | {userlocation?.latitude}{"\n"}
        DESTINATION: {destination?.longitude} | {destination?.latitude}
        {"\n\n"}
        DISTANCE: {distance} M
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
    marginBottom: 20,
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
