import { FirebaseDatabaseTypes } from "@react-native-firebase/database";
import { attemptFirebaseGet, attemptFirebasePush, attemptFirebaseUpdate } from "./firebase";
import { FIREBASE_ERROR, REQUEST_LIMIT } from "../config/Constants";
import { FirebaseError } from "../errors/FirebaseError";

export const getActiveUser = async (database: FirebaseDatabaseTypes.Module) => {
    const user = await attemptFirebaseGet(database, '/active_user', REQUEST_LIMIT);
    if(user === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return user;
}

export const setActiveUser = async (database: FirebaseDatabaseTypes.Module, name: string) => {
    const added = await attemptFirebaseUpdate(database, '/', 'active_user', name, REQUEST_LIMIT);
    if(added === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return name;
}

export const getUser = async (database: FirebaseDatabaseTypes.Module, name: string) => {
    const user = await attemptFirebaseGet(database, `/users/${name}`, REQUEST_LIMIT);
    if(user === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return user;
}

export const addUser = async (database: FirebaseDatabaseTypes.Module, name: string) => {
    const added = await attemptFirebasePush(database, `/users`, name, { last_backup: 0 }, REQUEST_LIMIT);
    if(added === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return name;
}

export const emptyActiveUser = async (database: FirebaseDatabaseTypes.Module) => {
    const added = await attemptFirebaseUpdate(database, `/`, 'active_user', false, REQUEST_LIMIT);
    if(added === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    return true;
}