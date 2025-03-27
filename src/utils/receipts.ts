import {
  FirebaseDatabaseTypes,
} from '@react-native-firebase/database';
import {
  FIREBASE_CREATING_ERROR,
  FIREBASE_ERROR,
  REQUEST_LIMIT,
} from '../config/Constants';
import {FirebaseError} from '../errors/FirebaseError';
import {
  attemptFirebaseGet,
  attemptFirebasePush,
  attemptFirebaseUpdate,
} from './firebase';
import {productsReceiptQuery, Receipt, ReceiptsType} from './types';
import {getClient, updateClientBalance} from './clitent';
import {getProductItem} from './inventory';
import {updateAdminBalance} from './auth';

export const getAllReceipts = async (
  database: FirebaseDatabaseTypes.Module,
): Promise<ReceiptsType> => {
  const clients = await attemptFirebaseGet(
    database,
    '/receipts',
    REQUEST_LIMIT,
  );
  if (clients === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }
  return clients.val();
};

export const getReceipt = async (
  database: FirebaseDatabaseTypes.Module,
  receiptUuid: string,
): Promise<Receipt> => {
  const clients = await attemptFirebaseGet(
    database,
    `/receipts/${receiptUuid}`,
    REQUEST_LIMIT,
  );
  if (clients === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }
  return clients.val();
};

const reduceItem = async (
  database: FirebaseDatabaseTypes.Module,
  productName: string,
  itemUuid: string,
  amount: number,
): Promise<Boolean> => {
  const item = await getProductItem(database, productName, itemUuid);
  if (!item) {
    return false;
  }
  if (item.weight < amount) {
    return false;
  }

  const res = await attemptFirebaseUpdate(
    database,
    `/inventory/${productName}/items/${itemUuid}`,
    'weight',
    item.weight - amount,
    REQUEST_LIMIT,
  );
  if (res === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }
  return res;
};

export const createReceiptHelper = async (
  database: FirebaseDatabaseTypes.Module,
  clientUuid: string,
  moneyPaid: number,
  pdfPath: string,
  uploadStateChange: (bytesTransferred: number, totalBytes: number) => void,
  products?: productsReceiptQuery,
): Promise<string> => {
  // Get all receipts to determine the next receipt number
  const allReceipts = await getAllReceipts(database);
  const currentReceiptCount = allReceipts ? Object.keys(allReceipts).length : 0;
  const nextReceiptNumber = currentReceiptCount + 1;

  let totalPrice = 0;
  let totalBoughtPrice = 0;
  for (let productName in products) {
    let totalWeight = 0;
    await Promise.allSettled(
      Object.keys(products[productName].items).map(async itemUuid => {
        await reduceItem(
          database,
          productName,
          itemUuid,
          products[productName].items[itemUuid],
        );
        totalPrice +=
          products[productName].items[itemUuid] *
          products[productName].sellPrice;
        const item = await getProductItem(database, productName, itemUuid);
        totalBoughtPrice +=
          item.boughtPrice * products[productName].items[itemUuid];
        totalWeight += products[productName].items[itemUuid];
      }),
    );
    products[productName].totalWeight = totalWeight;
  }
  const client = await getClient(database, clientUuid);
  if (!client) {
    throw new FirebaseError(FIREBASE_CREATING_ERROR);
  }

  const createdAt = new Date().toISOString();

  const receiptUuid = await attemptFirebasePush(
    database,
    `/receipts`,
    null,
    {
      Rnumber: nextReceiptNumber, // Add receipt number
      client: clientUuid,
      initialBalance: client.balance,
      moneyPaid: moneyPaid,
      products: products,
      totalPrice: totalPrice,
      totalBoughtPrice: totalBoughtPrice,
      createdAt: createdAt,
      status: 'active', // Add this line
    },
    REQUEST_LIMIT,
  );
  if (receiptUuid === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }
  if (receiptUuid === false) {
    throw new FirebaseError(FIREBASE_CREATING_ERROR);
  }

  const newBalance = client.balance + totalPrice - moneyPaid;

  const balanceRes = await updateClientBalance(
    database,
    clientUuid,
    newBalance,
  );
  if (!balanceRes) {
    throw new FirebaseError(FIREBASE_CREATING_ERROR);
  }

  const adminBalanceRes = await updateAdminBalance(database, moneyPaid);
  if (!adminBalanceRes) {
    throw new FirebaseError(FIREBASE_CREATING_ERROR);
  }

  const receiptRes = await attemptFirebasePush(
    database,
    `/clients/${clientUuid}/receipts/`,
    receiptUuid,
    true,
    REQUEST_LIMIT,
  );
  if (receiptRes === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }
  if (receiptRes === false) {
    throw new FirebaseError(FIREBASE_CREATING_ERROR);
  }

  // const reference = storage().ref(`${receiptUuid}.pdf`);
  // const task = reference.putFile(pdfPath);

  // task.on('state_changed', (snapshot) => {
  //     uploadStateChange(snapshot.bytesTransferred, snapshot.totalBytes);
  // });

  // await task;

  return receiptUuid;
};

export const returnReceiptHelper = async (
  database: FirebaseDatabaseTypes.Module,
  receiptUuid: string,
) => {
  try {
    // 1. Get the receipt details
    const receipt = await getReceipt(database, receiptUuid);
    if (!receipt || receipt.status === 'returned') {
      throw new FirebaseError(FIREBASE_ERROR);
    }

    // 2. Return weights to inventory
    for (const productName in receipt.products) {
      const product = receipt.products[productName];
      for (const itemId in product.items) {
        const weight = product.items[itemId];

        // Get current item weight
        const item = await getProductItem(database, productName, itemId);
        if (!item) continue;

        // Update item weight by adding back the original amount
        const res = await attemptFirebaseUpdate(
          database,
          `/inventory/${productName}/items/${itemId}`,
          'weight',
          item.weight + weight,
          REQUEST_LIMIT,
        );

        if (res === FIREBASE_ERROR) {
          throw new FirebaseError(FIREBASE_ERROR);
        }
      }
    }

    // 3. Update client balance
    const client = await getClient(database, receipt.client);
    if (!client) {
      throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }

    // Reverse the balance changes
    const reversedBalance =
      Math.floor(client.balance - receipt.totalPrice + receipt.moneyPaid);
    const balanceRes = await updateClientBalance(
      database,
      receipt.client,
      reversedBalance,
    );
    if (!balanceRes) {
      throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }

    // 4. Update admin balance (reverse the money paid)
    const adminBalanceRes = await updateAdminBalance(
      database,
      -receipt.moneyPaid,
    );
    if (!adminBalanceRes) {
      throw new FirebaseError(FIREBASE_CREATING_ERROR);
    }

    // 5. Update receipt status to returned
    const statusRes = await attemptFirebaseUpdate(
      database,
      `/receipts/${receiptUuid}`,
      'status',
      'returned',
      REQUEST_LIMIT,
    );

    if (statusRes === FIREBASE_ERROR) {
      throw new FirebaseError(FIREBASE_ERROR);
    }

    // 6. Add return timestamp
    const returnedAtRes = await attemptFirebaseUpdate(
      database,
      `/receipts/${receiptUuid}`,
      'returnedAt',
      new Date().toISOString(),
      REQUEST_LIMIT,
    );

    if (returnedAtRes === FIREBASE_ERROR) {
      throw new FirebaseError(FIREBASE_ERROR);
    }

    return true;
  } catch (error) {
    console.error('Error returning receipt:', error);
    throw error;
  }
};
