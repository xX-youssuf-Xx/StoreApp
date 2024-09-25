import { FirebaseDatabaseTypes } from "@react-native-firebase/database";
import { attemptFirebaseGet, attemptFirebasePush } from "./firebase";
import { FIREBASE_ERROR, REQUEST_LIMIT } from "../config/Constants";
import { FirebaseError } from "../errors/FirebaseError";

export const getAllProducts = async (database: FirebaseDatabaseTypes.Module) => {
    const products = await attemptFirebaseGet(database, '/inventory', REQUEST_LIMIT);
    if(products === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return products;
}

export const getProduct = async (database: FirebaseDatabaseTypes.Module, productName: string) => {
    const products = await attemptFirebaseGet(database, `/inventory/${productName}`, REQUEST_LIMIT);
    if(products === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return products;
}

export const createProduct = async (database: FirebaseDatabaseTypes.Module, 
    productName: string, 
    isStatic: Boolean = false, 
    boxWeight: number = 0, 
    isQrable: Boolean = false, 
    qrData: {
        from: number,
        intLength: number,
        floatLength: number
    }) => {
    const products = await attemptFirebasePush(database, `/inventory`, productName, {
        isStatic: isStatic,
        boxWeight: boxWeight,
        isQrable: isQrable,
        items: {},
        qrData: qrData
    }, REQUEST_LIMIT);
    if(products === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return products;
}

export const importItem = async (database: FirebaseDatabaseTypes.Module, productName: string, boughtPrice: number, weight: number) => {
    const products = await attemptFirebasePush(database, `/inventory/${productName}`, null, {
        boughtPrice: boughtPrice,
        weight: weight,
        totalWeight: weight,
    }, REQUEST_LIMIT);
    if(products === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return products;
}