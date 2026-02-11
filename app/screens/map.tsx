import * as Location from "expo-location";
import * as Notifications from 'expo-notifications';
import { getDistance } from 'geolib';
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { LatLng, Marker, Region } from "react-native-maps";

export default function Map() {
  const [userlocation, setUserlocation] = useState<Region | null>(null);
  const [destination , setDestination] = useState<LatLng | null>(null);
  let distance = 0;
  
  if(userlocation&&destination){
     distance = getDistance(
    {latitude: userlocation?.latitude, longitude: userlocation?.longitude},
    {latitude: destination?.latitude, longitude: destination?.longitude})
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge:false,
      shouldShowBanner:false,
      shouldShowList:false 
    }),
  });
  


  useEffect(() => {
    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      console.log(status);


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
        <TextInput style={styles.textinput} placeholder="Hii" />
      <MapView
        style={styles.map}
        showsUserLocation
        region={userlocation ?? undefined}
        onPress={(e) => setDestination(e.nativeEvent.coordinate)}
        >   
        {destination && <Marker coordinate={destination} />}
        </MapView>
        <Text style={styles.text}> 
          USER :{userlocation?.longitude}| {userlocation?.latitude}  {`\n`} 
          DESTINATION :{destination?.longitude}| {destination?.latitude}   {`\n`} {`\n`}
          DISTANCE : {distance}
        </Text>
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
    marginBottom: 20, 
    position:"absolute",
    top:20,
    left:15,
    right:15,
    zIndex: 10,      // important
    elevation: 10, 
  },
  text:{
    backgroundColor:'black',
    position:"absolute",
    bottom:30,
    left:15,
    right:15,
    zIndex: 10,      // important
    elevation: 10,
    color:'white'
    
  }
});
