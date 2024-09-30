import { FirebaseDatabaseTypes } from "@react-native-firebase/database";
import { attemptFirebaseGet, attemptFirebasePush } from "./firebase";
import { FIREBASE_CREATING_ERROR, FIREBASE_ERROR, REQUEST_LIMIT } from "../config/Constants";
import { FirebaseError } from "../errors/FirebaseError";
import { Item, Product, ProuctsType, qrDataType } from "./types";
import { updateAdminBalance } from "./auth";

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

export const getProductQrData = async (database: FirebaseDatabaseTypes.Module, productName: string) : Promise<qrDataType | false> => {
    const product = await getProduct(database, `/inventory/${productName}`);

    if(!product.isQrable) {
        return false;
    }

    const qrData = await attemptFirebaseGet(database, `/inventory/${productName}/qrData`, REQUEST_LIMIT);
    if(qrData === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    return qrData.val();
}

export const getProductItem = async (database: FirebaseDatabaseTypes.Module, productName: string, itemUuid: string) : Promise<Item> => {
    const item = await attemptFirebaseGet(database, `/inventory/${productName}/items/${itemUuid}`, REQUEST_LIMIT);
    if(item === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return item.val();
}

export const createProduct = async (database: FirebaseDatabaseTypes.Module, 
    productName: string, 
    isStatic: Boolean = false, 
    isQrable: Boolean = false, 
    boxWeight: number = 0, 
    qrData: (qrDataType | {}) = {}) : Promise<string> => {
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
    if(res === false) {
        throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }
    return res;
}

export const createItems = async (database: FirebaseDatabaseTypes.Module, 
    productName: string, 
    boughtPrice: number, 
    weight: number, 
    qrString?: string) : Promise<string> => {
    const res = await attemptFirebasePush(database, `/inventory/${productName}/items`, null, {
        boughtPrice: boughtPrice,
        weight: weight,
        totalWeight: weight,
        qrString: qrString,
        importedAt: (new Date()).toISOString()
    }, REQUEST_LIMIT);
    if(res === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    if(res === false) {
        throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }

    const balanceRes = await updateAdminBalance(database, - boughtPrice * weight);
    if(!balanceRes) {
        throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }

    return res;
}