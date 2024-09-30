import { FirebaseDatabaseTypes, serverTimestamp } from "@react-native-firebase/database";
import { FIREBASE_CREATING_ERROR, FIREBASE_ERROR, REQUEST_LIMIT } from "../config/Constants";
import { FirebaseError } from "../errors/FirebaseError";
import { attemptFirebaseGet, attemptFirebasePush, attemptFirebaseUpdate } from "./firebase";
import { productsReceiptQuery, Receipt, ReceiptsType } from "./types";
import { getClient, updateClientBalance } from "./clitent";
import { getProduct, getProductItem } from "./inventory";
import storage from '@react-native-firebase/storage';
import { updateAdminBalance } from "./auth";

export const getAllReceipts = async (database: FirebaseDatabaseTypes.Module) : Promise<ReceiptsType> => {
    const clients = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(clients === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return clients.val();
}

export const getReceipt = async (database: FirebaseDatabaseTypes.Module, receiptUuid: string) : Promise<Receipt> => {
    const clients = await attemptFirebaseGet(database, `/receipts/${receiptUuid}`, REQUEST_LIMIT);
    if(clients === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return clients.val();
}

const reduceItem = async (database: FirebaseDatabaseTypes.Module, productName: string, itemUuid: string, amount: number) : Promise<Boolean> => {
    const item = await getProductItem(database, productName, itemUuid);
    if(!item) {
        return false;
    }
    if(item.weight < amount) {
        return false;
    }

    const res = await attemptFirebaseUpdate(database, `/inventory/${productName}/items/${itemUuid}`, 'weight', item.weight - amount, REQUEST_LIMIT);
    if (res === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return res;
}

export const createReceiptHelper = async (database: FirebaseDatabaseTypes.Module, 
    clientUuid: string, 
    moneyPaid: number, 
    pdfPath: string, 
    uploadStateChange: (bytesTransferred: number, totalBytes: number) => void,
    products?: productsReceiptQuery) : Promise<string> => {
    
        let totalPrice = 0;
    for (let productName in products) {
        let totalWeight = 0;
        for (let itemUuid in products[productName].items) {

            await reduceItem(database, productName, itemUuid, products[productName].items[itemUuid]);
            totalPrice += products[productName].items[itemUuid] * products[productName].sellPrice;
            totalWeight += products[productName].items[itemUuid];
        }
        products[productName].totalWeight = totalWeight;
    }
    const client = await getClient(database, clientUuid);
    if(!client) {
        throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }
    
    const createdAt = (new Date()).toISOString();

    const receiptUuid = await attemptFirebasePush(database, `/receipts`, null, {
        client: clientUuid, 
        initialBalance: client.balance,
        moneyPaid: moneyPaid,
        products: products,
        totalPrice: totalPrice,
        createdAt: createdAt
    }, REQUEST_LIMIT);
    if(receiptUuid === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    if(receiptUuid === false) {
        throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }

    const newBalance = client.balance + totalPrice - moneyPaid;

    const balanceRes = await updateClientBalance(database, clientUuid, newBalance);
    if(!balanceRes) {
        throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }
    
    const adminBalanceRes = await updateAdminBalance(database, moneyPaid);
    if(!adminBalanceRes) {
        throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }

    const receiptRes = await attemptFirebasePush(database, `/clients/${clientUuid}/receipts/`, receiptUuid, true, REQUEST_LIMIT);
    if(receiptRes === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    if(receiptRes === false) {  
        throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }

    // const reference = storage().ref(`${receiptUuid}.pdf`);
    // const task = reference.putFile(pdfPath);

    // task.on('state_changed', (snapshot) => {
    //     uploadStateChange(snapshot.bytesTransferred, snapshot.totalBytes);
    // });
    
    // await task;
    
    return receiptUuid;
}