const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://saadhvi-silks-default-rtdb.firebaseio.com`,
    storageBucket: `saadhvi-silks.firebasestorage.app` 
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