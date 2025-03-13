import { FirebaseDatabaseTypes, set } from "@react-native-firebase/database";
import { FIREBASE_ERROR } from "../config/Constants";

export const attemptFirebaseUpdate = async (
    database: FirebaseDatabaseTypes.Module, 
    ref: string, 
    key: string, 
    val: string | boolean | object | number, 
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
        // Add options to always fetch from server
        const snapShot = await database.ref(ref).once('value', undefined, {
            serverSideTimestamp: true
        });
        return snapShot; 
    } catch (e) {
        console.log("Error getting item", e);

        if (times > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            return await attemptFirebaseGet(database, ref, times - 1);
        } else {
            return FIREBASE_ERROR; 
        }
    }
};

export const attemptFirebasePush = async (
    database: FirebaseDatabaseTypes.Module, 
    ref: string, 
    key: string | null, 
    value: any,
    times: number
): Promise<false | string | typeof FIREBASE_ERROR> => {
    try {
        if(key === null) {
            const newRef = database.ref(ref).push();
            await newRef.set(value);
            if(newRef.key) {
                return newRef.key; 
            }
            else
                return false;
        } else {
            await database.ref(`${ref}/${key}`).set(value);
            return key; 
        }
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