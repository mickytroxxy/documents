import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDprLLqpEBeC58x-TL8ulI785-7CqfMXfk',
    authDomain: 'myguy-a78d0.firebaseapp.com',
    projectId: 'myguy-a78d0',
    storageBucket: 'myguy-a78d0.appspot.com',
    messagingSenderId: '743810339840',
    appId: '1:743810339840:web:f2ed6fe76da23c061074e5'
};
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
