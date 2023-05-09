// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD2j90oM8la5GegyIURDhg79MiKgf9pC0I",
    authDomain: "validdoc-71875.firebaseapp.com",
    projectId: "validdoc-71875",
    storageBucket: "validdoc-71875.appspot.com",
    messagingSenderId: "981431723529",
    appId: "1:981431723529:web:b5c21c11a3360623b1bad8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;