import React, { useState, useEffect } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import Splash from "./src/components/screens/Splash";

import PaketList from "./src/components/screens/PaketList";
import ProfileScreen from "./src/components/screens/Profile";
import LoginScreen from "./src/components/auth/Login";
import RegisterScreen from "./src/components/auth/Register";
import BerandaScreen from "./src/components/screens/Beranda";
import OrderListScreen from "./src/components/screens/OrderList"; // Import the OrderListScreen

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TOKEN_EXPIRATION_DAYS = 2;

// Helper function to get icon name
const getIconName = (routeName) => {
  switch (routeName) {
    case "Beranda":
      return "home";
    case "Paket":
      return "list";
    case "Profil":
      return "person";
    case "Orders":
      return "cart";
    default:
      return "home";
  }
};

// MainTabNavigator
function MainTabNavigator({ handleLogout, orderList }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Icon name={getIconName(route.name)} size={size} color={color} />
        ),
        tabBarActiveTintColor: "#2464EC", // Active color
        tabBarInactiveTintColor: "gray", // Inactive color
        tabBarStyle: {
          backgroundColor: "#b9dcf5", // Dark background for tab bar
          borderTopWidth: 0, // Remove border top
          height: 60, // Increase height for tab bar
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "600", // Bold label text
        },
      })}
    >
      <Tab.Screen
        name="Beranda"
        component={BerandaScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Beranda",
        }}
      />
      <Tab.Screen
        name="Paket"
        component={PaketList}
        options={{
          headerShown: false,
          title: "Paket",
          tabBarLabel: "Paket",
        }}
      />
      <Tab.Screen
        name="Orders"
        children={(props) => (
          <OrderListScreen {...props} orderList={orderList} />
        )}
        options={{
          headerShown: false,
          tabBarLabel: "Orders",
        }}
      />
      <Tab.Screen
        name="Profil"
        options={{
          headerShown: false,
          tabBarLabel: "Profil",
        }}
      >
        {(props) => <ProfileScreen {...props} onLogout={handleLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isSplashVisible, setSplashVisible] = useState(true);
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [orderList, setOrderList] = useState([]); // State to store orders

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const tokenData = await AsyncStorage.getItem("token");
        if (tokenData) {
          const parsedTokenData = JSON.parse(tokenData);
          const { token, expiry } = parsedTokenData;
          const now = new Date();
          if (new Date(expiry) > now) {
            setLoggedIn(true);
          } else {
            await AsyncStorage.removeItem("token");
          }
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      } finally {
        setSplashVisible(false);
      }
    };
    checkLoginStatus();
  }, []);

  const handleLogin = async (token) => {
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + TOKEN_EXPIRATION_DAYS);
      await AsyncStorage.setItem(
        "token",
        JSON.stringify({ token, expiry: expiry.toISOString() })
      );
      setLoggedIn(true);
    } catch (error) {
      console.error("Error handling login:", error);
      Alert.alert("Error", "Failed to login. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      setLoggedIn(false);
    } catch (error) {
      console.error("Error handling logout:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2464EC" barStyle="light-content" />
      {isSplashVisible ? (
        <Splash />
      ) : (
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: "#2464EC" },
              headerTintColor: "#fff",
            }}
          >
            {isLoggedIn ? (
              <>
                <Stack.Screen name="Home" options={{ headerShown: false }}>
                  {(props) => (
                    <MainTabNavigator
                      {...props}
                      handleLogout={handleLogout}
                      orderList={orderList}
                    />
                  )}
                </Stack.Screen>
              </>
            ) : (
              <>
                <Stack.Screen name="Login" options={{ headerShown: false }}>
                  {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
                </Stack.Screen>
                <Stack.Screen
                  name="Register"
                  options={{ headerShown: false }}
                  component={RegisterScreen}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2464EC",
  },
});
