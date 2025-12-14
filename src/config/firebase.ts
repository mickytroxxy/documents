import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyCoWRNPmk2s8PtB5OAe4gLfSP6YEs4v3PM',
    authDomain: 'docfactoryai.firebaseapp.com',
    projectId: 'docfactoryai',
    storageBucket: 'docfactoryai.firebasestorage.app',
    messagingSenderId: '896931532304',
    appId: '1:896931532304:web:aca4d676c06c101b444495',
    measurementId: 'G-4Q10JQNF2J'
};
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
