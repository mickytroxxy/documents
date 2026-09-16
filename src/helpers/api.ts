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
export const getSecretsTableId = async (): Promise<string | null> => {
    try {
        const querySnapshot = await getDocs(query(collection(db, 'secrets')));
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const updateSecrets = async (data?: Partial<Data>): Promise<boolean> => {
    try {
        const targetId = await getSecretsTableId();
        if (!targetId) {
            console.error('No secrets document found in database.');
            return false;
        }
        const docRef = doc(db, 'secrets', targetId);
        await updateDoc(docRef, data || { DEEP_SEEK_API: '' });
        console.log('Secrets updated successfully');
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
export const authenticateUser = async (phoneNumber: string): Promise<any[]> => {
    try {
        const querySnapshot = await getDocs(query(collection(db, 'users'), where('phoneNumber', '==', phoneNumber || '')));
        const data = querySnapshot.docs.map((doc) => doc.data());
        return data;
    } catch (e) {
        console.error(e);
        return [];
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
