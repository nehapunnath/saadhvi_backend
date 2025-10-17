const admin = require('firebase-admin');
// const serviceAccount = require('./serviceAccount.json');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: `https://saadhvi-silks-default-rtdb.firebaseio.com`,
    // storageBucket: `saadhvi-silks.firebasestorage.app` 
    databaseURL: process.env.FIREBASE_DATABASE ,
    storageBucket: process.env.FIREBASE_STORAGE
  });
}

const db = admin.firestore();
const rtdb = admin.database(); 
const auth = admin.auth();
const storage = admin.storage(); 

db.settings({ ignoreUndefinedProperties: true });

module.exports = {
  admin,
  db,
  rtdb,
  auth,
  storage
};