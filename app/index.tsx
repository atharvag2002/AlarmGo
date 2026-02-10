import { StyleSheet, View } from "react-native";
import Map from "./screens/map";

export default function Index() {
  return (
    <View style={styles.container}>
      <Map />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
