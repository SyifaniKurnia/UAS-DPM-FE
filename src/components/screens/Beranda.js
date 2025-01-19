import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons"; // Import the Icon library

const API_URL = "http://192.168.56.1:3000/api/prices";

export default function Beranda() {
  const [prices, setPrices] = useState([]);
  const [orderList, setOrderList] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [weight, setWeight] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [orderDate] = useState(new Date().toISOString().split("T")[0]); // Today's date
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [token, setToken] = useState("");
  const [filteredPrices, setFilteredPrices] = useState([]);
  const [receivedDate, setReceivedDate] = useState(""); // State untuk tanggal barang diterima

  useEffect(() => {
    // Set receivedDate otomatis saat komponen dimuat (set ke tanggal hari ini)
    const today = new Date().toISOString().split("T")[0]; // Format tanggal YYYY-MM-DD
    setReceivedDate(today);

    const fetchPrices = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) {
        const { token } = JSON.parse(storedToken);
        setToken(token);
        const response = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setPrices(data.data || []);
        setFilteredPrices(data.data || []);
      }
    };
    fetchPrices();

    const intervalId = setInterval(() => {
      fetchPrices(); // Refresh data every 5 seconds
    }, 5000);

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  const handleAddToOrder = (price) => {
    // Check if the package is already added to avoid duplicates
    if (!selectedPackages.some((pkg) => pkg._id === price._id)) {
      setSelectedPackages([...selectedPackages, price]);
    } else {
      Alert.alert("Info", "This package is already added to your order.");
    }
  };

  // Handle submit order
  const handleSubmitOrder = async () => {
    if (
      !customerName ||
      !customerPhone ||
      !weight ||
      !completionDate ||
      !receivedDate || // Pastikan tanggal diterima ada
      selectedPackages.length === 0
    ) {
      Alert.alert(
        "Error",
        "Please fill all fields and add at least one package before submitting."
      );
      return;
    }

    // Validate package IDs
    const validPackages = selectedPackages.filter((pkg) => pkg._id);
    if (validPackages.length !== selectedPackages.length) {
      Alert.alert("Error", "Invalid package IDs detected.");
      return;
    }

    const totalPrice = selectedPackages.reduce(
      (total, pkg) => total + parseFloat(weight) * pkg.priceAmount,
      0
    );

    const order = {
      customerName,
      customerPhone,
      weight,
      completionDate,
      receivedDate, // Sertakan tanggal barang diterima
      totalPrice,
      packages: validPackages.map((pkg) => pkg._id), // Mengirimkan hanya _id dari paket yang valid
    };

    try {
      const response = await fetch("http://192.168.56.1:3000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(order),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Order submitted successfully!");
        setOrderList([...orderList, data.data]);
        resetForm();
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while submitting the order.");
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setWeight("");
    setCompletionDate("");
    setSelectedPackages([]);
  };

  const handleCalendarChange = (date) => {
    setCompletionDate(date.dateString);
    setShowCalendar(false);
  };

  const closeCalendar = () => {
    setShowCalendar(false);
  };

  const handleRemovePackage = (pkgId) => {
    setSelectedPackages(selectedPackages.filter((pkg) => pkg._id !== pkgId));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MyLaundry</Text>

      {filteredPrices.length === 0 ? (
        <Text style={styles.noDataText}>No Data Available</Text>
      ) : (
        <FlatList
          data={filteredPrices}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.packageName}> {item.packageName}</Text>
              <Text style={styles.price}>
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(item.price)}
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToOrder(item)}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Order Details */}
      {showOrderDetail && (
        <View style={styles.orderForm}>
          <Text style={styles.header}>Order Details</Text>

          {/* Display selected packages as rows */}
          {selectedPackages.map((item) => (
            <View style={styles.selectedPackageRow} key={item._id}>
              <Text style={styles.packageRowText}>{item.packageName}</Text>
              <Text style={styles.packageRowText}>
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(item.price)}
              </Text>
              <TouchableOpacity onPress={() => handleRemovePackage(item._id)}>
                <Icon name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Input fields for customer details */}
          <TextInput
            style={styles.input}
            placeholder="Customer Name"
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={styles.input}
            placeholder="Customer Phone"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />

          {/* Date picker for completion date */}
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowCalendar(true)}
          >
            <Text style={styles.buttonText}>
              Select Completion Date: {completionDate || "Select Date"}
            </Text>
          </TouchableOpacity>

          {/* Submit button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitOrder}
          >
            <Text style={styles.buttonText}>Submit Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Toggle button to show/hide Order Details */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowOrderDetail((prev) => !prev)}
      >
        <Text style={styles.buttonText}>
          {showOrderDetail ? "Hide Order Details" : "Show Order Details"}
        </Text>
      </TouchableOpacity>

      {/* Modal to display the calendar */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={showCalendar}
        onRequestClose={closeCalendar}
      >
        <TouchableWithoutFeedback onPress={closeCalendar}>
          <View style={styles.modalBackground}>
            <View style={styles.calendarContainer}>
              <Calendar
                markedDates={{
                  [receivedDate]: { selected: true, selectedColor: "blue" },
                }}
                onDayPress={handleCalendarChange} // Ubah tanggal diterima
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  card: {
    backgroundColor: "#bbdefb",
    padding: 20,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 5,
  },
  packageName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0d47a1",
    marginBottom: 10,
  },
  price: {
    fontSize: 16,
    color: "#0d47a1",
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#0d47a1",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  orderForm: {
    backgroundColor: "#bbdefb",
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
    elevation: 5,
  },
  selectedPackageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  packageRowText: {
    fontSize: 16,
    color: "#0d47a1",
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: "#0d47a1",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#0d47a1",
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
  },
  toggleButton: {
    backgroundColor: "#0d47a1",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  calendarContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#0d47a1",
  },
});
