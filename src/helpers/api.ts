import { collection, doc, getDocs, query, setDoc, updateDoc, where, QuerySnapshot, DocumentData, deleteDoc } from 'firebase/firestore';
import { db, app } from '../config/firebase';

interface Data {
    [key: string]: any;
}

export const createData = async (tableName: string, docId: string, data: Data): Promise<boolean> => {
    try {
        await setDoc(doc(db, tableName, docId), data);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const updateData = async (tableName: string, docId: string, obj: Partial<Data>): Promise<boolean> => {
    try {
        const docRef = doc(db, tableName, docId);
        await updateDoc(docRef, obj);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const deleteData = async (tableName: string, docId: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, tableName, docId));
        return true;
    } catch (e) {
        return false;
    }
};

export const getSecretKeys = async (): Promise<any[]> => {
    try {
        const querySnapshot = await getDocs(query(collection(db, 'secrets')));
        const data = querySnapshot.docs.map((doc) => doc.data());
        return data;
    } catch (e) {
        console.error(e);
        return [];
    }
};
