import { FirebaseDatabaseTypes } from "@react-native-firebase/database";
import { FIREBASE_ERROR, REQUEST_LIMIT } from "../config/Constants";
import { attemptFirebaseGet } from "./firebase";
import { FirebaseError } from "../errors/FirebaseError";
import { Item, Product, Receipt, ReceiptsType } from "./types";

export const getTodayProfit = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    const imports = await attemptFirebaseGet(database, '/inventory', REQUEST_LIMIT);
    if(imports === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let profit = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key];
        if(receipt.createdAt) {
            const now = new Date();
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            receiptDate.getMonth() == now.getMonth() &&
            receiptDate.getDate() == now.getDate()) {
                profit += receipt.totalPrice;
                profit -= receipt.totalBoughtPrice;
            }
        }
    }

    // for(let key in imports.val()) {
    //     const product : Product = imports.val()[key];
    //     if(product.items) {
    //         for(let itemKey in product.items) {
    //             const item : Item = product.items[itemKey];
    //             if(product.items[itemKey] && item.importedAt) {
    //                 const now = new Date();
    //                 const importDate = new Date(item.importedAt);

    //                 if(importDate.getFullYear() == now.getFullYear() &&
    //                 importDate.getMonth() == now.getMonth() &&
    //                 importDate.getDate() == now.getDate()) {
    //                     profit -= item.boughtPrice * item.totalWeight;
    //                 }
    //             }
    //         }
    //     }
    // }

    return profit;
}

export const getWeekProfit = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    const imports = await attemptFirebaseGet(database, '/inventory', REQUEST_LIMIT);
    if(imports === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let profit = 0;

    const now = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (now.getDay() + 1) % 7);
    const weekEnd = new Date();
    weekEnd.setDate(now.getDate() + 7 - (now.getDay() + 1) % 7);

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key];
        if(receipt.createdAt) {
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            receiptDate.getTime() >= weekStart.getTime() &&
            receiptDate.getTime() < weekEnd.getTime()) {
                profit += receipt.totalPrice;
                profit -= receipt.totalBoughtPrice;
            }
        }
    }

    // for(let key in imports.val()) {
    //     const product : Product = imports.val()[key];
    //     if(product.items) {
    //         for(let itemKey in product.items) {
    //             const item : Item = product.items[itemKey];
    //             if(product.items[itemKey] && item.importedAt) {
    //                 const importDate = new Date(item.importedAt);

    //                 if(importDate.getFullYear() == now.getFullYear() &&
    //                 importDate.getTime() >= weekStart.getTime() &&
    //                 importDate.getTime() < weekEnd.getTime()) {
    //                     console.log("key", item.boughtPrice, item.totalWeight, item.boughtPrice * item.totalWeight);
    //                     profit -= item.boughtPrice * item.totalWeight;
    //                 }
    //             }
    //         }
    //     }
    // }

    return profit;
}

export const getMonthProfit = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    const imports = await attemptFirebaseGet(database, '/inventory', REQUEST_LIMIT);
    if(imports === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let profit = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key];
        if(receipt.createdAt) {
            const now = new Date();
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            receiptDate.getMonth() == now.getMonth()) {
                profit += receipt.totalPrice;
                profit -= receipt.totalBoughtPrice;
            }
        }
    }

    // for(let key in imports.val()) {
    //     const product : Product = imports.val()[key];
    //     if(product.items) {
    //         for(let itemKey in product.items) {
    //             const item : Item = product.items[itemKey];
    //             if(product.items[itemKey] && item.importedAt) {
    //                 const now = new Date();
    //                 const importDate = new Date(item.importedAt);

    //                 if(importDate.getFullYear() == now.getFullYear() &&
    //                 importDate.getMonth() == now.getMonth()) {
    //                     profit -= item.boughtPrice * item.totalWeight;
    //                 }
    //             }
    //         }
    //     }
    // }

    return profit;
}

export const getLastMonthProfit = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    const imports = await attemptFirebaseGet(database, '/inventory', REQUEST_LIMIT);
    if(imports === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let profit = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key];
        if(receipt.createdAt) {
            const now = new Date();
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            ((receiptDate.getMonth() == (now.getMonth() - 1)) || 
            (receiptDate.getMonth() == ((now.getMonth() - 1) % 12) && receiptDate.getFullYear() == (now.getFullYear() - 1)))) {
                profit += receipt.totalPrice;
                profit -= receipt.totalBoughtPrice;
            }
        }
    }

    // for(let key in imports.val()) {
    //     const product : Product = imports.val()[key];
    //     if(product.items) {
    //         for(let itemKey in product.items) {
    //             const item : Item = product.items[itemKey];
    //             if(product.items[itemKey] && item.importedAt) {
    //                 const now = new Date();
    //                 const importDate = new Date(item.importedAt);

    //                 if(importDate.getFullYear() == now.getFullYear() &&
    //                 ((importDate.getMonth() == (now.getMonth() - 1)) || 
    //                 (importDate.getMonth() == ((now.getMonth() - 1) % 12) && importDate.getFullYear() == (now.getFullYear() - 1)))) {
    //                     profit -= item.boughtPrice * item.totalWeight;
    //                 }
    //             }
    //         }
    //     }
    // }

    return profit;
}

export const getAllProfit = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }
    const imports = await attemptFirebaseGet(database, '/inventory', REQUEST_LIMIT);
    if(imports === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let profit = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key];        
        profit += receipt.totalPrice;
        profit -= receipt.totalBoughtPrice;
    }

    // for(let key in imports.val()) {
    //     const product : Product = imports.val()[key];
    //     if(product.items) {
    //         for(let itemKey in product.items) {
    //             const item : Item = product.items[itemKey];
    //             if(product.items[itemKey] && item.importedAt) {
    //                 profit -= item.boughtPrice * item.totalWeight;
    //             }
    //         }
    //     }
    // }

    return profit;
}


export const getTodayIncome = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let income = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key];
        if(receipt.createdAt) {
            const now = new Date();
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            receiptDate.getMonth() == now.getMonth() &&
            receiptDate.getDate() == now.getDate()) {
                income += receipt.moneyPaid;
            }
        }
    }

    return income;
}

export const getWeekIncome = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let income = 0;

    const now = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (now.getDay() + 1) % 7);
    const weekEnd = new Date();
    weekEnd.setDate(now.getDate() + 7 - (now.getDay() + 1) % 7);

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key];
        if(receipt.createdAt) {
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            receiptDate.getTime() >= weekStart.getTime() &&
            receiptDate.getTime() < weekEnd.getTime()) {
                income += receipt.moneyPaid;
            }
        }
    }

    return income;
}

export const getMonthIncome = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let income = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key];
        if(receipt.createdAt) {
            const now = new Date();
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            receiptDate.getMonth() == now.getMonth()) {
                income += receipt.moneyPaid;
            }
        }
    }

    return income;
}

export const getLastMonthIncome = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let income = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key];
        if(receipt.createdAt) {
            const now = new Date();
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            ((receiptDate.getMonth() == (now.getMonth() - 1)) || 
            (receiptDate.getMonth() == ((now.getMonth() - 1) % 12) && receiptDate.getFullYear() == (now.getFullYear() - 1)))) {
                income += receipt.moneyPaid;
            }
        }
    }

    return income;
}

export const getAllIncome = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let income = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key];        
        income += receipt.moneyPaid;
    }

    return income;
}


export const getTodaySales = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let sales = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key] as Receipt;
        if(receipt.createdAt) {
            const now = new Date();
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            receiptDate.getMonth() == now.getMonth() &&
            receiptDate.getDate() == now.getDate()) {
                for (const product of Object.values(receipt.products)) {
                    sales += product.sellPrice * (product.totalWeight ?? 0);
                }
            }
        }
    }

    return sales;
}

export const getWeekSales = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let sales = 0;

    const now = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (now.getDay() + 1) % 7);
    const weekEnd = new Date();
    weekEnd.setDate(now.getDate() + 7 - (now.getDay() + 1) % 7);

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key] as Receipt;
        if(receipt.createdAt) {
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            receiptDate.getTime() >= weekStart.getTime() &&
            receiptDate.getTime() < weekEnd.getTime()) {
                for (const product of Object.values(receipt.products)) {
                    sales += product.sellPrice * (product.totalWeight ?? 0);
                }
            }
        }
    }

    return sales;
}

export const getMonthSales = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let sales = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key] as Receipt;
        if(receipt.createdAt) {
            const now = new Date();
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            receiptDate.getMonth() == now.getMonth()) {
                for (const product of Object.values(receipt.products)) {
                    sales += product.sellPrice * (product.totalWeight ?? 0);
                }
            }
        }
    }

    return sales;
}

export const getLastMonthSales = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let sales = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key] as Receipt;
        if(receipt.createdAt) {
            const now = new Date();
            const receiptDate = new Date(receipt.createdAt);

            if(receiptDate.getFullYear() == now.getFullYear() &&
            ((receiptDate.getMonth() == (now.getMonth() - 1)) || 
            (receiptDate.getMonth() == ((now.getMonth() - 1) % 12) && receiptDate.getFullYear() == (now.getFullYear() - 1)))) {
                for (const product of Object.values(receipt.products)) {
                    sales += product.sellPrice * (product.totalWeight ?? 0);
                }
            }
        }
    }

    return sales;
}

export const getAllSales = async (database: FirebaseDatabaseTypes.Module) : Promise<Number> => {
    const receipts = await attemptFirebaseGet(database, '/receipts', REQUEST_LIMIT);
    if(receipts === FIREBASE_ERROR) {
        throw new FirebaseError(FIREBASE_ERROR);
    }

    let sales = 0;

    for(let key in receipts.val()) {
        const receipt = receipts.val()[key] as Receipt;        
        for (const product of Object.values(receipt.products)) {
            sales += product.sellPrice * (product.totalWeight ?? 0);
        }
    }

    return sales;
}