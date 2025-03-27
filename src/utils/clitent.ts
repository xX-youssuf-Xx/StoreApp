import { FirebaseDatabaseTypes } from "@react-native-firebase/database";
import { attemptFirebaseGet, attemptFirebasePush, attemptFirebaseUpdate } from "./firebase";
import { FIREBASE_CREATING_ERROR, FIREBASE_ERROR, REQUEST_LIMIT } from "../config/Constants";
import { FirebaseError } from "../errors/FirebaseError";
import { Client, ClientsType, ReceiptsType } from "./types";


export const getAllClients = async (database: FirebaseDatabaseTypes.Module): Promise<ClientsType> => {
    const clients = await attemptFirebaseGet(database, '/clients', REQUEST_LIMIT);
    if (clients === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return clients.val();
}

export const getClient = async (database: FirebaseDatabaseTypes.Module, clientUuid: string): Promise<Client> => {
    const client = await attemptFirebaseGet(database, `/clients/${clientUuid}`, REQUEST_LIMIT);
    if (client === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return client.val();
}

export const updateClientBalance = async (database: FirebaseDatabaseTypes.Module, clientUuid: string, newBalance: number): Promise<Boolean> => {
    const res = await attemptFirebaseUpdate(database, `/clients/${clientUuid}`, 'balance', newBalance, REQUEST_LIMIT);
    if (res === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return res;
}

export const createClient = async (database: FirebaseDatabaseTypes.Module, name: string, number: string): Promise<string> => {
    const res = await attemptFirebasePush(database, `/clients`, null, {
        name: name,
        number: number,
        balance: 0,
        receipts: {}
    }, REQUEST_LIMIT);
    if (res === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    if (res === false) {
        throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }
    return res;
}

export const getClientReceiptsHelper = async (database: FirebaseDatabaseTypes.Module, clientUuid: string): Promise<ReceiptsType> => {
    const receiptsIds = await attemptFirebaseGet(database, `/clients/${clientUuid}/receipts`, REQUEST_LIMIT);
    if (receiptsIds === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    const receipts: ReceiptsType = {};

    for (const key in receiptsIds.val()) {
        const receipt = await attemptFirebaseGet(database, `/receipts/${key}`, REQUEST_LIMIT);
        if (receipt === FIREBASE_ERROR) {
            throw new FirebaseError(FIREBASE_ERROR);
        }
        receipts[key] = receipt.val();
    };
    return receipts;
}

export const deleteClients = async (database: FirebaseDatabaseTypes.Module, clientsUuids: string[]) => {
  await Promise.allSettled(clientsUuids.map(async (clientUuid) => {
    const res = await attemptFirebaseUpdate(database, `/clients/${clientUuid}`, 'status', 'deleted', REQUEST_LIMIT);
    if (res === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
  }))
}