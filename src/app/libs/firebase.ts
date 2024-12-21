// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyDGft46rz78KnaLlxZMMVkUaUcE-THgQno',
	authDomain: 'thanhhuy-store.firebaseapp.com',
	projectId: 'thanhhuy-store',
	storageBucket: 'thanhhuy-store.appspot.com',
	messagingSenderId: '1029786863369',
	appId: '1:1029786863369:web:dd257a6b5ce7114c2075d8',
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);

export const auth = getAuth(firebase);

export default firebase;
