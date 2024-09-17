import { firebase, FirebaseDatabaseTypes } from "@react-native-firebase/database";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useLoading } from "./LoadingContext";
import { Text } from "react-native";
import { setItem } from "../utils/localStorage";
import { emptyActiveUser } from "../utils/auth";

interface FirebaseContextType {
    db: FirebaseDatabaseTypes.Module | null;
    goOffline: () => Promise<void>, 
    backup: () => Promise<Boolean>
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

interface FirebaseProviderProps {
    children: ReactNode;
}

export const FirebaseProvider = ({ children }: FirebaseProviderProps) => {
    const [db, setDb] = useState<FirebaseDatabaseTypes.Module | null>(null);
    const [shouldOnline, setShouldOnline] = useState<Boolean>(true);
    const [online, setOnline] = useState<Boolean>(true);
    const database = firebase
        .app()
        .database('https://storeapp-44934-default-rtdb.europe-west1.firebasedatabase.app');
    database.setPersistenceEnabled(true);

    const goOffline = async () => {
        await db!.goOffline();
        setShouldOnline(false);
    }

    const backup = async () => {
        try {
            await database.goOnline();
            setShouldOnline(true);
            await new Promise((resolve) => setTimeout(() => resolve, 10000));
            await setItem('active', false);
            await emptyActiveUser(database);
            await goOffline();
            return true;
        } catch (e) {
            console.log("ERROR");
            console.log(e);
            return false;
        }
    }

    const connectDB = async () => {
        setDb(database);
    }

    useEffect(() => {
        connectDB();

        firebase.database().ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                setOnline(true);
            } else {
                setOnline(false);
            }
        });
    }, []);
    
    if(!db) {
        return <>
            <Text>Loading</Text>
            {/* JOE: LOADING SCREEN */}
        </>
    }

    return (
        <FirebaseContext.Provider value={{ db, goOffline, backup }}>
            {children}
            { shouldOnline && !online ? <>{/* JOE: SHOW OFFLINE BIG DANGER SCREEN */}</> : null }
        </FirebaseContext.Provider>
    )
}

export const useFirebase = (): FirebaseContextType => {
    const context = useContext(FirebaseContext);
    if (context === null) {
        throw new Error('useFirebase must be used within a FirebaseContext');
    }
    return context;
};