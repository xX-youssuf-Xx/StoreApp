import { FirebaseDatabaseTypes } from "@react-native-firebase/database";
import { attemptFirebaseGet, attemptFirebasePush } from "./firebase";
import { FIREBASE_ERROR, REQUEST_LIMIT } from "../config/Constants";
import { FirebaseError } from "../errors/FirebaseError";
import { Product, ProuctsType } from "./types";

export const getAllProducts = async (database: FirebaseDatabaseTypes.Module) : Promise<ProuctsType> => {
    const products = await attemptFirebaseGet(database, '/inventory', REQUEST_LIMIT);
    if(products === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return products.val();
}

export const getProduct = async (database: FirebaseDatabaseTypes.Module, productName: string) : Promise<Product> => {
    const product = await attemptFirebaseGet(database, `/inventory/${productName}`, REQUEST_LIMIT);
    if(product === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return product.val();
}

export const createProduct = async (database: FirebaseDatabaseTypes.Module, 
    productName: string, 
    isStatic: Boolean = false, 
    isQrable: Boolean = false, 
    boxWeight: number = 0, 
    qrData: ({
        from: number,
        intLength: number,
        floatLength: number
    } | {}) = {}) : Promise<Boolean> => {
    const res = await attemptFirebasePush(database, `/inventory`, productName, {
        isStatic: isStatic,
        boxWeight: boxWeight,
        isQrable: isQrable,
        items: {},
        qrData: qrData
    }, REQUEST_LIMIT);
    if(res === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return res;
}

export const createItems = async (database: FirebaseDatabaseTypes.Module, 
    productName: string, 
    boughtPrice: number, 
    weight: number) : Promise<Boolean> => {
    const res = await attemptFirebasePush(database, `/inventory/${productName}/items`, null, {
        boughtPrice: boughtPrice,
        weight: weight,
        totalWeight: weight
    }, REQUEST_LIMIT);
    if(res === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return res;
}