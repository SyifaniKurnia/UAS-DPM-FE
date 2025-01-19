import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Splash({ onFinish }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>My App</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2464EC",
  },
  text: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
  },
});
