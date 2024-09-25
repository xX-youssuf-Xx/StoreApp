import AsyncStorage from "@react-native-async-storage/async-storage";

export const getItem = async (key: string) => {
    try {
        const value = await AsyncStorage.getItem(key);
        if (value == null)
            return false;
        
        return value;
    } catch (e) {
        console.log("Error:");
        console.log(e);
    }
}

export const setItem = async (key: string, value: string | Boolean) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
        return true;
    } catch (e) {
        console.log("Error:");
        console.log(e);
        return false;
    }
}

export const deleteItem = (key: string) => {

}