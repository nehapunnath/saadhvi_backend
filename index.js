// // /**
// //  * Import function triggers from their respective submodules:
// //  *
// //  * const {onCall} = require("firebase-functions/v2/https");
// //  * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
// //  *
// //  * See a full list of supported triggers at https://firebase.google.com/docs/functions
// //  */

// // const {setGlobalOptions} = require("firebase-functions");
// // const {onRequest} = require("firebase-functions/https");
// // const logger = require("firebase-functions/logger");

// // // For cost control, you can set the maximum number of containers that can be
// // // running at the same time. This helps mitigate the impact of unexpected
// // // traffic spikes by instead downgrading performance. This limit is a
// // // per-function limit. You can override the limit for each function using the
// // // `maxInstances` option in the function's options, e.g.
// // // `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// // // NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// // // functions should each use functions.runWith({ maxInstances: 10 }) instead.
// // // In the v1 API, each function can only serve one request per container, so
// // // this will be the maximum concurrent request count.
// // setGlobalOptions({ maxInstances: 10 });

// // // Create and deploy your first functions
// // // https://firebase.google.com/docs/functions/get-started

// // // exports.helloWorld = onRequest((request, response) => {
// // //   logger.info("Hello logs!", {structuredData: true});
// // //   response.send("Hello from Firebase!");
// // // });

// const { onRequest } = require("firebase-functions/v2/https");
// const express = require('express');
// const cors = require('cors');

// const app = express();

// // 🔥 FIX 1: Handle OPTIONS preflight FIRST
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.header('Access-Control-Allow-Credentials', 'true');
  
//   if (req.method === 'OPTIONS') {
//     return res.status(200).send('OK');
//   }
//   next();
// });

// // 🔥 FIX 2: Express CORS as backup
// app.use(cors({
//   origin: 'http://localhost:5173',
//   credentials: true
// }));

// app.use(express.json());

// // 🔥 LOGIN - YOUR CREDENTIALS
// app.post('/login', (req, res) => {
//   console.log('🚀 Login attempt:', req.body);
  
//   const { email, password } = req.body;
  
//   if (email === 'admin.team@saadhvisilks.com' && password === 'Sa@dhv1Silks#2025!') {
//     return res.json({
//       success: true,
//       message: 'Login successful',
//       token: 'mock-jwt-admin-team-2025',
//       user: { uid: 'admin123', email, role: 'admin' }
//     });
//   }
  
//   res.status(401).json({
//     success: false,
//     message: 'Invalid email or password'
//   });
// });

// exports.api = onRequest(app);
require('dotenv').config();
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const routes = require('./Routes/Routes');

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/', routes);

// LOCAL SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});

// ALSO export for Firebase (future)
exports.api = functions.https.onRequest(app);
