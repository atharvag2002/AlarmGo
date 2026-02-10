import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import MapView, { Region } from "react-native-maps";

export default function Map() {
  const [region, setRegion] = useState<Region | null>(null);

  useEffect(() => {
    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      console.log(status);


      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
        <TextInput style={styles.textinput} />
      <MapView
        style={styles.map}
        showsUserLocation
        region={region ?? undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  textinput:{  height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    marginBottom: 20, }
});
