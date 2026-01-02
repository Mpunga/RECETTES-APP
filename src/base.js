import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
    apiKey: "AIzaSyCfFJhnKtSBJetiywjSZv74Mvbqd3cxBLc",
    authDomain: "recette-app-b63e0.firebaseapp.com",
    databaseURL: "https://recette-app-b63e0-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "recette-app-b63e0",
    storageBucket: "recette-app-b63e0.firebasestorage.app",
    messagingSenderId: "514766436378",
    appId: "1:514766436378:web:51871fe7281118f208f9a3",
    measurementId: "G-X034HRSSSN"
};

const base = initializeApp(firebaseConfig);


export const database = getDatabase(base); // <-- IMPORTANT : utiliser database
export const auth = getAuth(base);
export default base;
