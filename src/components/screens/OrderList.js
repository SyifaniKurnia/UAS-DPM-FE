import axios from "axios";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OrderListScreen() {
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Retrieve token from AsyncStorage
        const storedToken = await AsyncStorage.getItem("token");
        if (!storedToken) {
          setError("Token not found");
          setLoading(false);
          return;
        }

        const parsedToken = JSON.parse(storedToken).token;

        const response = await axios.get(
          "http://192.168.56.1:3000/api/orders",
          {
            headers: {
              Authorization: `Bearer ${parsedToken}`,
            },
          }
        );

        // Cek data yang diterima
        console.log("Data dari API:", response.data);

        // Ensure the response contains 'data' and it's in the expected format
        if (response.data && response.data.data) {
          const transformedOrders = response.data.data.map((order) => ({
            order_id: order._id,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            weight: order.weight,
            totalPrice: order.totalPrice,
            orderDate: new Date(order.createdAt).toLocaleDateString("id-ID"),
            completionDate: new Date(order.completionDate).toLocaleDateString(
              "id-ID"
            ),
            receivedDate: order.receivedDate
              ? new Date(order.receivedDate).toLocaleDateString("id-ID")
              : "Not available", // Add a default value if receivedDate is missing
            packages: order.packages.map((pkg) => ({
              packageName: pkg.packageName,
              price: pkg.price, // Menampilkan harga paket
            })),
          }));

          setOrderList(transformedOrders);
        } else {
          setError("No data found");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const intervalId = setInterval(() => {
      fetchOrders(); // Refresh data every 5 seconds
    }, 5000);

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0d47a1" />
        <Text style={styles.header}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Submitted Orders</Text>
      <FlatList
        data={orderList}
        keyExtractor={(item) => item.order_id.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.orderCard}>
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.orderText}>Order ID: {item.order_id}</Text>
            </View>

            <Text style={styles.customerInfo}>
              Customer: {item.customerName} | Phone: {item.customerPhone}
            </Text>
            <Text style={styles.orderText}>Order Date: {item.orderDate}</Text>

            <Text style={styles.subHeader}>Packages</Text>
            <View style={styles.packageTable}>
              {item.packages.map((pkg, idx) => (
                <View key={idx} style={styles.packageRow}>
                  <Text style={styles.packageText}>{pkg.packageName}</Text>
                  <Text style={styles.packageText}>
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(pkg.price)}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.subHeader}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Weight: {item.weight} kg</Text>
              <Text style={styles.summaryText}>
                Total Price:{" "}
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(item.totalPrice)}
              </Text>
            </View>

            <Text style={styles.receivedDate}>
              Completion Date: {item.completionDate}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#e3f2fd",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0d47a1",
    marginBottom: 20,
    textAlign: "center",
  },
  invoiceHeader: {
    borderBottomWidth: 2,
    borderBottomColor: "#0d47a1",
    paddingBottom: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  invoiceTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#0d47a1",
  },
  orderCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#0d47a1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  orderText: {
    fontSize: 16,
    color: "#0d47a1",
    marginBottom: 5,
  },
  customerInfo: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0d47a1",
    marginTop: 20,
  },
  packageTable: {
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    marginBottom: 10,
  },
  packageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  packageText: {
    fontSize: 16,
    color: "#0d47a1",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    color: "#0d47a1",
  },
  receivedDate: {
    fontSize: 16,
    color: "#555",
    marginTop: 10,
  },
});
