// // Import the functions you need from the SDKs you need
// const { initializeApp } = require('firebase/app');
// const { getStorage, ref } = require('@firebase/storage');
// import { FirebaseApp } from 'firebase/app';
// import { StorageReference, FirebaseStorage } from '@firebase/storage';
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: 'AIzaSyDIQFfa5jdCIXULgNyL77x_xTE9os-zjTc',
//   authDomain: 'flowsups-iles.firebaseapp.com',
//   projectId: 'flowsups-iles',
//   storageBucket: 'flowsups-iles.appspot.com',
//   messagingSenderId: '284003346580',
//   appId: '1:284003346580:web:6d7b300048042eef992c81',
//   measurementId: 'G-VD23J5VYDB',
// };

// let app: FirebaseApp | null = null;
// let storage: StorageReference | null = null;
// export let smsImageStorageRef: FirebaseStorage | null = null;

// export async function initializeFirebaseStorage() {
//   // Initialize Firebase
//   app = initializeApp(firebaseConfig);
//   storage = getStorage(app);
// }

// initializeFirebaseStorage()
//   .then(() => {
//     if (storage) {
//       // Create a storage reference from our storage service
//       smsImageStorageRef = ref(storage, 'sms-images/images-temp');
//     }
//   })
//   .catch((error) => {
//     console.log(error);
//   });

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getStorage, ref } from '@firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDIQFfa5jdCIXULgNyL77x_xTE9os-zjTc',
  authDomain: 'flowsups-iles.firebaseapp.com',
  projectId: 'flowsups-iles',
  storageBucket: 'flowsups-iles.appspot.com',
  messagingSenderId: '284003346580',
  appId: '1:284003346580:web:6d7b300048042eef992c81',
  measurementId: 'G-VD23J5VYDB',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

// Create a storage reference from our storage service
export function getSmsImageStorageRef() {
  return ref(storage, 'sms-images/images-temp');
}
