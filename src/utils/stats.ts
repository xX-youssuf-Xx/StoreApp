import {FirebaseDatabaseTypes} from '@react-native-firebase/database';
import {FIREBASE_ERROR, REQUEST_LIMIT} from '../config/Constants';
import {attemptFirebaseGet} from './firebase';
import {FirebaseError} from '../errors/FirebaseError';
import {Receipt} from './types';

export const getTodayProfit = async (
  database: FirebaseDatabaseTypes.Module,
): Promise<Number> => {
  const receipts = await attemptFirebaseGet(
    database,
    '/receipts',
    REQUEST_LIMIT,
  );
  if (receipts === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }

  let profit = 0;

  for (let key in receipts.val()) {
    const receipt = receipts.val()[key];
    if (receipt.createdAt && receipt.status === 'active') {
      const now = new Date();
      const receiptDate = new Date(receipt.createdAt);

      if (
        receiptDate.getFullYear() === now.getFullYear() &&
        receiptDate.getMonth() === now.getMonth() &&
        receiptDate.getDate() === now.getDate()
      ) {
        profit += receipt.totalPrice;
        profit -= receipt.totalBoughtPrice;
      }
    }
  }

  return profit;
};

export const getWeekProfit = async (
  database: FirebaseDatabaseTypes.Module,
): Promise<Number> => {
  const receipts = await attemptFirebaseGet(
    database,
    '/receipts',
    REQUEST_LIMIT,
  );
  if (receipts === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }

  let profit = 0;

  const now = new Date();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((now.getDay() + 1) % 7));
  const weekEnd = new Date();
  weekEnd.setDate(now.getDate() + 7 - ((now.getDay() + 1) % 7));

  for (let key in receipts.val()) {
    const receipt = receipts.val()[key];
    if (receipt.createdAt && receipt.status === 'active') {
      const receiptDate = new Date(receipt.createdAt);

      if (
        receiptDate.getFullYear() === now.getFullYear() &&
        receiptDate.getTime() >= weekStart.getTime() &&
        receiptDate.getTime() < weekEnd.getTime()
      ) {
        profit += receipt.totalPrice;
        profit -= receipt.totalBoughtPrice;
      }
    }
  }

  return profit;
};

export const getMonthProfit = async (
  database: FirebaseDatabaseTypes.Module,
): Promise<Number> => {
  const receipts = await attemptFirebaseGet(
    database,
    '/receipts',
    REQUEST_LIMIT,
  );
  if (receipts === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }

  let profit = 0;

  for (let key in receipts.val()) {
    const receipt = receipts.val()[key];
    if (receipt.createdAt && receipt.status === 'active') {
      const now = new Date();
      const receiptDate = new Date(receipt.createdAt);

      if (
        receiptDate.getFullYear() === now.getFullYear() &&
        receiptDate.getMonth() === now.getMonth()
      ) {
        profit += receipt.totalPrice;
        profit -= receipt.totalBoughtPrice;
      }
    }
  }

  return profit;
};

export const getLastMonthProfit = async (
  database: FirebaseDatabaseTypes.Module,
): Promise<Number> => {
  const receipts = await attemptFirebaseGet(
    database,
    '/receipts',
    REQUEST_LIMIT,
  );
  if (receipts === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }

  let profit = 0;

  for (let key in receipts.val()) {
    const receipt = receipts.val()[key];
    if (receipt.createdAt && receipt.status === 'active') {
      const now = new Date();
      const receiptDate = new Date(receipt.createdAt);

      if (
        receiptDate.getFullYear() === now.getFullYear() &&
        (receiptDate.getMonth() === now.getMonth() - 1 ||
          (receiptDate.getMonth() === (now.getMonth() - 1) % 12 &&
            receiptDate.getFullYear() === now.getFullYear() - 1))
      ) {
        profit += receipt.totalPrice;
        profit -= receipt.totalBoughtPrice;
      }
    }
  }

  return profit;
};

export const getAllProfit = async (
  database: FirebaseDatabaseTypes.Module,
): Promise<Number> => {
  const receipts = await attemptFirebaseGet(
    database,
    '/receipts',
    REQUEST_LIMIT,
  );
  if (receipts === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }

  let profit = 0;

  for (let key in receipts.val()) {
    const receipt = receipts.val()[key];
    if (receipt.status === 'active') {
      profit += receipt.totalPrice;
      profit -= receipt.totalBoughtPrice;
    }
  }

  return profit;
};

export const getTodaySales = async (
  database: FirebaseDatabaseTypes.Module,
): Promise<Number> => {
  const receipts = await attemptFirebaseGet(
    database,
    '/receipts',
    REQUEST_LIMIT,
  );
  if (receipts === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }

  let sales = 0;

  for (let key in receipts.val()) {
    const receipt = receipts.val()[key] as Receipt;
    if (receipt.createdAt && receipt.status === 'active') {
      const now = new Date();
      const receiptDate = new Date(receipt.createdAt);

      if (
        receiptDate.getFullYear() === now.getFullYear() &&
        receiptDate.getMonth() === now.getMonth() &&
        receiptDate.getDate() === now.getDate()
      ) {
        sales += receipt.totalPrice;
      }
    }
  }

  return sales;
};

export const getWeekSales = async (
  database: FirebaseDatabaseTypes.Module,
): Promise<Number> => {
  const receipts = await attemptFirebaseGet(
    database,
    '/receipts',
    REQUEST_LIMIT,
  );
  if (receipts === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }

  let sales = 0;

  const now = new Date();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((now.getDay() + 1) % 7));
  const weekEnd = new Date();
  weekEnd.setDate(now.getDate() + 7 - ((now.getDay() + 1) % 7));

  for (let key in receipts.val()) {
    const receipt = receipts.val()[key] as Receipt;
    if (receipt.createdAt && receipt.status === 'active') {
      const receiptDate = new Date(receipt.createdAt);

      if (
        receiptDate.getFullYear() === now.getFullYear() &&
        receiptDate.getTime() >= weekStart.getTime() &&
        receiptDate.getTime() < weekEnd.getTime()
      ) {
        sales += receipt.totalPrice;
      }
    }
  }

  return sales;
};

export const getMonthSales = async (
  database: FirebaseDatabaseTypes.Module,
): Promise<Number> => {
  const receipts = await attemptFirebaseGet(
    database,
    '/receipts',
    REQUEST_LIMIT,
  );
  if (receipts === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }

  let sales = 0;

  for (let key in receipts.val()) {
    const receipt = receipts.val()[key] as Receipt; 
    if (receipt.createdAt && receipt.status === 'active') {
      const now = new Date();
      const receiptDate = new Date(receipt.createdAt);

      if (
        receiptDate.getFullYear() === now.getFullYear() &&
        receiptDate.getMonth() === now.getMonth()
      ) {
        sales += receipt.totalPrice;
      }
    }
  }

  return sales;
};


export const getLastMonthSales = async (
  database: FirebaseDatabaseTypes.Module,
): Promise<Number> => {
  const receipts = await attemptFirebaseGet(
    database,
    '/receipts',
    REQUEST_LIMIT,
  );
  if (receipts === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }

  let sales = 0;

  for (let key in receipts.val()) {
    const receipt = receipts.val()[key] as Receipt;
    if (receipt.createdAt && receipt.status === 'active') {
      const now = new Date();
      const receiptDate = new Date(receipt.createdAt);

      if (
        receiptDate.getFullYear() === now.getFullYear() &&
        (receiptDate.getMonth() === now.getMonth() - 1 ||
          (receiptDate.getMonth() === (now.getMonth() - 1) % 12 &&
            receiptDate.getFullYear() === now.getFullYear() - 1))
      ) {
        sales += receipt.totalPrice;
      }
    }
  }

  return sales;
};

export const getAllSales = async (
  database: FirebaseDatabaseTypes.Module,
): Promise<Number> => {
  const receipts = await attemptFirebaseGet(
    database,
    '/receipts',
    REQUEST_LIMIT,
  );
  if (receipts === FIREBASE_ERROR) {
    throw new FirebaseError(FIREBASE_ERROR);
  }

  let sales = 0;

  for (let key in receipts.val()) {
    const receipt = receipts.val()[key] as Receipt;
    if (receipt.status === 'active') {
      sales += receipt.totalPrice;
    }
  }

  return sales;
};
