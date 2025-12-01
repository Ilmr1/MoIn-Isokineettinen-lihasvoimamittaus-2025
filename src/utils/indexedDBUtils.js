// const dbRequest = window.indexedDB.open("CTMDatabase", 3);
// let ctmDb;
// dbRequest.onerror = (event) => {
//     console.error(event.target.error?.message)
// }
//
// dbRequest.onsuccess = (event) => {
//     ctmDb = event.target.result;
// }

import { asserts } from "../collections/collections";

const createDbStore = (db, storeName, key) => {
  if (!db.objectStoreNames.contains(storeName)) {
    db.createObjectStore(storeName, key);
  }
};

export const openStore = (storeName, mode) => {
  const request = indexedDB.open("innovation-project-2025", 1);

  request.onupgradeneeded = (evt) => {
    console.log("tarvitsee päivitystä");
    const db = evt.target.result;
    switch (evt.oldVersion) {
      case 0: {
        createDbStore(db, "file-handlers");
      }
    }
  };

  return new Promise((res, rej) => {
    request.onerror = rej;
    request.onsuccess = (evt) => {
      const db = evt.target.result;
      asserts.assertTruthy(
        db.objectStoreNames.contains(storeName),
        `Unknown store name "${storeName}"`,
      );
      const transaction = db.transaction(storeName, mode);

      res(transaction.objectStore(storeName));
    };
  });
};

export const setValue = (storeName, key, value) => {
  return new Promise(async (res, rej) => {
    const store = await openStore(storeName, "readwrite");
    const putReq = store.put(value, key);
    putReq.onerror = rej;
    putReq.onsuccess = res;
  });
};

export const getValue = async (storeName, key) => {
  const store = await openStore(storeName, "readonly");
  return await storeGet(store, key);
};

export const deleteKey = async (storeName, key) => {
  const store = await openStore(storeName, "readwrite");
  store.delete(key);
};

export const mutateValue = (storeName, key, mutate) => {
  return new Promise(async (res, rej) => {
    const getStore = await openStore(storeName, "readwrite");
    const value = await storeGet(getStore, key);

    const result = await mutate(value);
    const setStore = await openStore(storeName, "readwrite");
    const setRequest = setStore.put(result, key);
    setRequest.onerror = rej;
    setRequest.onsuccess = () => res(result);
  });
};

const storeGet = (store, key) => {
  return new Promise((res, rej) => {
    const getRequest = store.get(key);

    getRequest.onsuccess = (evt) => res(evt.target.result);
    getRequest.onerror = rej;
  });
};
