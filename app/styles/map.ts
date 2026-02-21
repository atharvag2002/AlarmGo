import { StyleSheet } from "react-native";


export 
const styles = StyleSheet.create({
  container: { flex: 1 },

  overlay: {
    paddingTop: 20,
    paddingHorizontal: 15,
  },

  centerButton: {
    position: "absolute",
    bottom: 120,
    right: 20,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 30,
    elevation: 5,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "white",
  },

  clearBtn: {
    marginLeft: 8,
    padding: 10,
    backgroundColor: "white",
    borderRadius: 8,
  },

  suggestionBox: {
    marginTop: 8,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    maxHeight: 200,
  },

  suggestionText: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },

  bottomCard: {
    position: "absolute",
    bottom: 30,
    left: 15,
    right: 15,
    backgroundColor: "black",
    padding: 15,
    borderRadius: 10,
  },

  fabContainer: {
    position: "absolute",
    bottom: 120,
    right: 20,
    alignItems: "flex-end",
  },

  fabMenu: {
    marginBottom: 10,
    alignItems: "flex-end",
  },

  fabMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  fabMenuIcon: {
    fontSize: 16,
  },

  fabButton: {
    backgroundColor: "#2196F3",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  fabButtonActive: {
    backgroundColor: "#1976D2",
    transform: [{ rotate: "45deg" }],
  },

  fabButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  distanceInputOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  distanceInputContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },

  distanceInputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  distanceInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },

  distanceButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  distanceButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },

  cancelButton: {
    backgroundColor: "#ccc",
  },

  saveButton: {
    backgroundColor: "#2196F3",
  },

  distanceButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});