import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.56.1:3000/api/prices";

export default function PriceList() {
  const [prices, setPrices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [packageName, setPackageName] = useState("");
  const [price, setPrice] = useState("");
  const [token, setToken] = useState("");
  const [editPriceId, setEditPriceId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPrices, setFilteredPrices] = useState([]);

  useEffect(() => {
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
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = prices.filter(
      (price) =>
        price.packageName.toLowerCase().includes(text.toLowerCase()) ||
        price.price.toString().includes(text)
    );
    setFilteredPrices(filtered);
  };

  const handleAddPrice = async () => {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      alert("Price must be a valid number");
      return;
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ packageName, price: parsedPrice }),
    });

    const result = await response.json();

    if (response.ok) {
      const newPrices = [result.data, ...prices];
      setPrices(newPrices);
      setFilteredPrices(newPrices);
      setPackageName("");
      setPrice("");
      setShowForm(false);
    } else {
      alert(result.message || "Error adding price");
    }
  };

  const handleEditPrice = async () => {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      alert("Price must be a valid number");
      return;
    }

    const response = await fetch(`${API_URL}/${editPriceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ packageName, price: parsedPrice }),
    });

    const result = await response.json();

    if (response.ok) {
      const updatedPrices = prices.map((price) =>
        price._id === editPriceId
          ? { ...price, packageName, price: parsedPrice }
          : price
      );
      setPrices(updatedPrices);
      setFilteredPrices(updatedPrices);
      setPackageName("");
      setPrice("");
      setShowForm(false);
      setEditPriceId(null);
    } else {
      alert(result.message || "Error editing price");
    }
  };

  const handleDeletePrice = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const updatedPrices = prices.filter((price) => price._id !== id);
      setPrices(updatedPrices);
      setFilteredPrices(updatedPrices);
    } else {
      alert("Error deleting price");
    }
  };

  const handleCancelEdit = () => {
    setPackageName("");
    setPrice("");
    setShowForm(false);
    setEditPriceId(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Package Prices</Text>

      {showForm ? (
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Icon
              name="albums"
              size={20}
              color="#0d47a1"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Package Name"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={packageName}
              onChangeText={setPackageName}
            />
          </View>
          <View style={styles.inputGroup}>
            <Icon
              name="cash"
              size={20}
              color="#0d47a1"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#0d47a1" }]}
              onPress={editPriceId ? handleEditPrice : handleAddPrice}
            >
              <Text style={styles.buttonText}>
                {editPriceId ? "Update Price" : "Add Price"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#e91e63" }]}
              onPress={handleCancelEdit}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Prices..."
            placeholderTextColor="#b8c1d1"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <View style={styles.tableContainer}>
            {filteredPrices.length === 0 ? (
              <Text style={styles.noDataText}>No Data Available</Text>
            ) : (
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: 40 }]}>#</Text>
                <Text style={[styles.tableHeaderText, { width: "40%" }]}>
                  Package Name
                </Text>
                <Text style={[styles.tableHeaderText, { width: "30%" }]}>
                  Price
                </Text>
                <Text style={[styles.tableHeaderText, { width: 80 }]}>
                  Actions
                </Text>
              </View>
            )}
            <FlatList
              data={filteredPrices}
              keyExtractor={(item) => item._id}
              renderItem={({ item, index }) => (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: 40 }]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.tableCell, { width: "40%" }]}>
                    {item.packageName}
                  </Text>
                  <Text style={[styles.tableCell, { width: "30%" }]}>
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(item.price)}
                  </Text>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditPriceId(item._id);
                        setPackageName(item.packageName);
                        setPrice(item.price.toString());
                        setShowForm(true);
                      }}
                    >
                      <Icon name="create" size={24} color="#0d47a1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePrice(item._id)}
                    >
                      <Icon name="trash" size={24} color="red" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(true)}
          >
            <Icon name="add" size={30} color="white" />
          </TouchableOpacity>
        </>
      )}
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
  formContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#bbdefb",
    borderRadius: 15,
    elevation: 5,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderColor: "#0d47a1",
  },
  input: {
    flex: 1,
    height: 45,
    borderWidth: 0,
    paddingLeft: 10,
    backgroundColor: "#90caf9",
    color: "#0d47a1",
    fontSize: 16,
    borderRadius: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#0d47a1",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#ffffff",
    color: "#0d47a1",
    fontSize: 16,
  },
  tableContainer: {
    marginTop: 20,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#0d47a1",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    padding: 15,
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
    justifyContent: "space-between",
  },
  tableCell: {
    fontSize: 16,
    color: "#0d47a1",
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#0d47a1",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    textAlign: "center",
    fontSize: 18,
    color: "#0d47a1",
    marginTop: 20,
  },
});
