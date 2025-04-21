// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDTokmcW4mkKaSz6qeaMonlmjHM2wKTb6c",
    authDomain: "skillppe.firebaseapp.com",
    projectId: "skillppe",
    storageBucket: "skillppe.firebasestorage.app",
    messagingSenderId: "714570952768",
    appId: "1:714570952768:web:bbe41cc6091a3a838defa5",
    measurementId: "G-D8YHKMY104"
  };
  
  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // Make available to other files
  export { app, auth, db };