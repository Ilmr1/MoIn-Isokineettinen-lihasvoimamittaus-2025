const dbRequest = window.indexedDB.open("CTMDatabase", 3);
let ctmDb;
dbRequest.onerror = (event) => {
    console.error(event.target.error?.message)
}

dbRequest.onsuccess = (event) => {
    ctmDb = event.target.result;
}