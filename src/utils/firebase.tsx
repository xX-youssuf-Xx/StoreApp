import { FirebaseDatabaseTypes } from "@react-native-firebase/database";
import { FIREBASE_ERROR } from "../config/Constants";

export const attemptFirebaseUpdate = async (
    database: FirebaseDatabaseTypes.Module, 
    ref: string, 
    key: string, 
    val: string | boolean | object, 
    times: number
): Promise<true | typeof FIREBASE_ERROR> => {
    try {
        await database.ref(ref).update({ [key]: val });
        return true; 
    } catch (e) {
        console.log("Error updating item", e);

        if (times > 0) {
            await new Promise(resolve => setTimeout(resolve, 5000));

            return await attemptFirebaseUpdate(database, ref, key, val, times - 1);
        } else {
            return FIREBASE_ERROR; 
        }
    }
};

export const attemptFirebaseGet = async (
    database: FirebaseDatabaseTypes.Module, 
    ref: string, 
    times: number
): Promise<FirebaseDatabaseTypes.DataSnapshot | typeof FIREBASE_ERROR> => {
    try {
        const snapShot = await database.ref(ref).once('value');
        return snapShot; 
    } catch (e) {
        console.log("Error updating item", e);

        if (times > 0) {
            await new Promise(resolve => setTimeout(resolve, 5000));

            return await attemptFirebaseGet(database, ref, times - 1);
        } else {
            return FIREBASE_ERROR; 
        }
    }
};

export const attemptFirebasePush = async (
    database: FirebaseDatabaseTypes.Module, 
    ref: string, 
    key: string, 
    value: any,
    times: number
): Promise<true | typeof FIREBASE_ERROR> => {
    try {
        const newRef = database.ref(ref).push(key);
        await newRef.set(value);
        return true; 
    } catch (e) {
        console.log("Error updating item", e);

        if (times > 0) {
            await new Promise(resolve => setTimeout(resolve, 5000));

            return await attemptFirebasePush(database, ref, key, value, times - 1);
        } else {
            return FIREBASE_ERROR; 
        }
    }
};