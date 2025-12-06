// backend/server.js 
require("dotenv").config();  // 👈 load .env first

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const app = express();

/* -------------------------------------------
   GLOBAL MIDDLEWARE
--------------------------------------------*/
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/* -------------------------------------------
   MONGO CONNECTION
--------------------------------------------*/
const mongoURL = process.env.MONGO_URI || "mongodb://localhost:27017";

if (process.env.MONGO_URI) {
  console.log("🌍 MongoDB MODE: ATLAS (Cloud)");
} else {
  console.log("💻 MongoDB MODE: LOCAL (Compass)");
}

console.log(
  "🔗 MongoDB URL:",
  mongoURL.includes("mongodb+srv") ? "MongoDB Atlas SRV" : mongoURL
);

// 🔐 Admin JWT Secret (from .env)
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
if (!ADMIN_JWT_SECRET) {
  console.error("❌ ADMIN_JWT_SECRET missing in .env");
  process.exit(1);
}

const dbName = "mysterysmile";
let db;


MongoClient.connect(mongoURL)
  .then(async (client) => {
    console.log("✅ Connected to MongoDB");
    db = client.db(dbName);

    await initializePaymentSettings();
    await initializeAdminUser();  // 🔐 create/check admin user
  })
  .catch((error) => console.error("MongoDB error:", error));


/* ============================================
   INITIAL PAYMENT SETTINGS (ARRAYS VERSION)
============================================*/
async function initializePaymentSettings() {
  const col = db.collection("paymentSettings");
  const doc = await col.findOne({});

  if (!doc) {
    await col.insertOne({
      PAYPAL: [],
      ESEWA: [],
      BANK: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✅ Payment settings initialized (arrays)");
    return;
  }

  const needsMigration =
    !Array.isArray(doc.PAYPAL) ||
    !Array.isArray(doc.ESEWA) ||
    !Array.isArray(doc.BANK);

  if (!needsMigration) return;

  const migrated = {
    PAYPAL: [],
    ESEWA: [],
    BANK: [],
    createdAt: doc.createdAt || new Date(),
    updatedAt: new Date(),
  };

  if (doc.PAYPAL && !Array.isArray(doc.PAYPAL)) {
    const hasData = doc.PAYPAL.email || doc.PAYPAL.qrImageUrl;
    if (hasData) {
      migrated.PAYPAL.push({
        _id: new ObjectId(),
        email: doc.PAYPAL.email || "",
        qrImageUrl: doc.PAYPAL.qrImageUrl || "",
        qrImageSize: doc.PAYPAL.qrImageSize ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  if (doc.ESEWA && !Array.isArray(doc.ESEWA)) {
    const hasData =
      doc.ESEWA.esewaId || doc.ESEWA.esewaName || doc.ESEWA.qrImageUrl;
    if (hasData) {
      migrated.ESEWA.push({
        _id: new ObjectId(),
        esewaId: doc.ESEWA.esewaId || "",
        esewaName: doc.ESEWA.esewaName || "",
        qrImageUrl: doc.ESEWA.qrImageUrl || "",
        qrImageSize: doc.ESEWA.qrImageSize ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  if (doc.BANK && !Array.isArray(doc.BANK)) {
    const hasData =
      doc.BANK.bankName ||
      doc.BANK.bankAccountName ||
      doc.BANK.bankAccountNumber ||
      doc.BANK.qrImageUrl;

    if (hasData) {
      migrated.BANK.push({
        _id: new ObjectId(),
        bankName: doc.BANK.bankName || "",
        bankAccountName: doc.BANK.bankAccountName || "",
        bankAccountNumber: doc.BANK.bankAccountNumber || "",
        qrImageUrl: doc.BANK.qrImageUrl || "",
        qrImageSize: doc.BANK.qrImageSize ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  await col.updateOne(
    { _id: doc._id },
    { $set: migrated }
  );

  console.log("✅ Payment settings migrated to arrays");
}

/* ============================================
   INITIAL ADMIN USER
============================================ */
async function initializeAdminUser() {
  const col = db.collection("adminSettings");
  const existing = await col.findOne({ username: "admin" });

  if (existing) {
    console.log("✅ Admin user already exists");
    return;
  }

  const defaultPassword = "MysteryAdmin@123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  await col.insertOne({
    username: "admin",
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("✅ Admin user created");
  console.log("🔐 Default admin password:", defaultPassword);
  console.log("⚠️ CHANGE THIS PASSWORD AFTER LOGIN");
}


/* Helper to always retrieve the one settings document */
async function getPaymentSettingsDoc() {
  const col = db.collection("paymentSettings");
  let doc = await col.findOne({});
  if (!doc) {
    await initializePaymentSettings();
    doc = await col.findOne({});
  }
  return doc;
}

/* ============================================
   ADMIN AUTH HELPERS
============================================ */
function generateAdminToken() {
  return jwt.sign(
    { role: "admin" },
    ADMIN_JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function adminAuthMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* ============================================
   ADMIN LOGIN
============================================ */
app.post("/api/admin/login", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    const admin = await db
      .collection("adminSettings")
      .findOne({ username: "admin" });

    if (!admin) {
      return res.status(500).json({ error: "Admin not initialized" });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const token = generateAdminToken();
    res.json({ token });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================
   ADMIN CHANGE PASSWORD
============================================ */
app.post(
  "/api/admin/change-password",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ error: "Both current and new password required" });
      }

      const col = db.collection("adminSettings");
      const admin = await col.findOne({ username: "admin" });

      if (!admin) {
        return res.status(500).json({ error: "Admin not initialized" });
      }

      const match = await bcrypt.compare(
        currentPassword,
        admin.passwordHash
      );

      if (!match) {
        return res
          .status(401)
          .json({ error: "Current password is incorrect" });
      }

      const newHash = await bcrypt.hash(newPassword, 10);

      await col.updateOne(
        { _id: admin._id },
        {
          $set: {
            passwordHash: newHash,
            updatedAt: new Date(),
          },
        }
      );

      res.json({ success: true });
    } catch (err) {
      console.error("Change admin password error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);


/* ============================================
   GET PAYMENT METHODS
============================================*/
app.get("/api/payment-methods", async (req, res) => {
  try {
    const doc = await getPaymentSettingsDoc();
    res.json({
      PAYPAL: doc.PAYPAL || [],
      ESEWA: doc.ESEWA || [],
      BANK: doc.BANK || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================
   ADD PAYMENT METHOD
============================================*/
app.post("/api/payment-methods/:type", async (req, res) => {
  try {
    const type = req.params.type.toUpperCase();
    const allowed = ["PAYPAL", "ESEWA", "BANK"];
    if (!allowed.includes(type)) {
      return res.status(400).json({ error: "Invalid payment type" });
    }

    const data = req.body || {};
    const now = new Date();

    let newMethod = {
      _id: new ObjectId(),
      isActive: false,
      qrImageUrl: "",
      qrImageSize: null,
      createdAt: now,
      updatedAt: now,
    };

    if (type === "PAYPAL") {
      newMethod.email = data.email || "";
    }

    if (type === "ESEWA") {
      newMethod.esewaId = data.esewaId || "";
      newMethod.esewaName = data.esewaName || "";
    }

    if (type === "BANK") {
      newMethod.bankName = data.bankName || "";
      newMethod.bankAccountName = data.bankAccountName || "";
      newMethod.bankAccountNumber = data.bankAccountNumber || "";
    }

    if (data.qrImage) {
      newMethod.qrImageUrl = data.qrImage;
      newMethod.qrImageSize = data.qrImageSize;
    }

    const col = db.collection("paymentSettings");
    const doc = await getPaymentSettingsDoc();

    await col.updateOne(
      { _id: doc._id },
      {
        $push: { [type]: newMethod },
        $set: { updatedAt: now },
      }
    );

    res.json(newMethod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================
   UPDATE PAYMENT METHOD
============================================*/
app.put("/api/payment-methods/:type/:id", async (req, res) => {
  try {
    const type = req.params.type.toUpperCase();
    const id = req.params.id;

    const allowed = ["PAYPAL", "ESEWA", "BANK"];
    if (!allowed.includes(type)) {
      return res.status(400).json({ error: "Invalid payment type" });
    }

    const col = db.collection("paymentSettings");
    const doc = await getPaymentSettingsDoc();
    const arr = doc[type];
    const data = req.body;
    const now = new Date();

    const updatedArr = arr.map((item) => {
      if (String(item._id) !== id) return item;

      const updated = { ...item, updatedAt: now };

      if (type === "PAYPAL") {
        if ("email" in data) updated.email = data.email;
      }

      if (type === "ESEWA") {
        if ("esewaId" in data) updated.esewaId = data.esewaId;
        if ("esewaName" in data) updated.esewaName = data.esewaName;
      }

      if (type === "BANK") {
        if ("bankName" in data) updated.bankName = data.bankName;
        if ("bankAccountName" in data)
          updated.bankAccountName = data.bankAccountName;
        if ("bankAccountNumber" in data)
          updated.bankAccountNumber = data.bankAccountNumber;
      }

      if (data.qrImage) {
        updated.qrImageUrl = data.qrImage;
        updated.qrImageSize = data.qrImageSize;
      }

      return updated;
    });

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          [type]: updatedArr,
          updatedAt: now,
        },
      }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================
   DELETE PAYMENT METHOD
============================================*/
app.delete("/api/payment-methods/:type/:id", async (req, res) => {
  try {
    const type = req.params.type.toUpperCase();
    const id = req.params.id;

    const allowed = ["PAYPAL", "ESEWA", "BANK"];
    if (!allowed.includes(type)) {
      return res.status(400).json({ error: "Invalid payment type" });
    }

    const col = db.collection("paymentSettings");
    const doc = await getPaymentSettingsDoc();

    const filtered = doc[type].filter((m) => String(m._id) !== id);

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          [type]: filtered,
          updatedAt: new Date(),
        },
      }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================
   OPTION B – TRUE ON/OFF
   - If ON → turn OFF
   - If OFF → turn ON (and turn others OFF)
   - Allows 0 active methods
============================================*/
app.put("/api/payment-methods/:type/:id/toggle", async (req, res) => {
  try {
    const type = req.params.type.toUpperCase();
    const id = req.params.id;
    const allowed = ["PAYPAL", "ESEWA", "BANK"];

    if (!allowed.includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const col = db.collection("paymentSettings");
    const doc = await getPaymentSettingsDoc();
    const arr = doc[type];

    const clicked = arr.find((m) => String(m._id) === id);

    if (!clicked) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    const now = new Date();

    // Desired new state
    const newState = !clicked.isActive;

    let updated;

    if (newState === false) {
      // Turning OFF → only this one becomes false, others stay as they are
      updated = arr.map((m) =>
        String(m._id) === id ? { ...m, isActive: false, updatedAt: now } : m
      );
    } else {
      // Turning ON → exclusive ON (others OFF)
      updated = arr.map((m) => ({
        ...m,
        isActive: String(m._id) === id,
        updatedAt: now,
      }));
    }

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          [type]: updated,
          updatedAt: now,
        },
      }
    );

    res.json({
      success: true,
      id,
      isActive: newState,
      mode: newState ? "turned_on" : "turned_off",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ============================================
   AVAILABILITY ROUTES
============================================*/
app.get("/api/availability/:category", async (req, res) => {
  try {
    const docs = await db
      .collection("categoryAvailability")
      .find({ category: req.params.category.toUpperCase() })
      .sort({ date: 1 })
      .toArray();

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/availability", async (req, res) => {
  try {
    const { category, date } = req.body;

    if (!category || !date)
      return res.status(400).json({ error: "category & date required" });

    const exists = await db
      .collection("categoryAvailability")
      .findOne({ category: category.toUpperCase(), date });

    if (exists)
      return res.status(400).json({ error: "Already exists" });

    const result = await db.collection("categoryAvailability").insertOne({
      category: category.toUpperCase(),
      date,
      createdAt: new Date(),
    });

    res.json({ id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/availability/:id", async (req, res) => {
  try {
    await db.collection("categoryAvailability").deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================
   BOOKINGS ROUTES
============================================*/
app.post("/api/bookings", async (req, res) => {
  try {
    const now = new Date();

    const doc = {
      ...req.body,
      clientImages: req.body.clientImages || [],
      paymentProofImages: req.body.paymentProofImages || [],
      status: "Pending",
      createdAt: now,
    };

    const bookingsCol = db.collection("bookings");
    const servicesCol = db.collection("services");
    const snapshotsCol = db.collection("bookingSnapshots");

    // 1) Insert the main booking
    const result = await bookingsCol.insertOne(doc);

    // 2) Build snapshot row
    let serviceName = doc?.service?.name || "";
    let category = "";
    let priceUsd = null;
    let priceNpr = null;
    let priceInr = null;

    try {
      if (doc.service?.id) {
        const svc = await servicesCol.findOne({
          _id: new ObjectId(doc.service.id),
        });

        if (svc) {
          serviceName = svc.name || serviceName;
          category = svc.category || "";
          priceUsd = svc.priceUsd ?? null;
          priceNpr = svc.priceNpr ?? null;
          priceInr = svc.priceInr ?? null;
        }
      }
    } catch (e) {
      console.error("Snapshot service lookup failed:", e.message);
    }

    const bookedFor =
      doc.selectedDate || doc.date || doc.bookingDate || null;

    const snapshot = {
      bookingId: result.insertedId,
      createdAt: now,
      bookedFor,
      fullName: doc.fullName || "",
      whatsapp: doc.whatsapp || "",
      email: doc.email || "",
      instaId: doc.instaId || "",
      serviceName,
      category,
      priceUsd,
      priceNpr,
      priceInr,
      status: doc.status,
    };

    await snapshotsCol.insertOne(snapshot);

    res.json({ id: result.insertedId });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/booking-snapshots", async (req, res) => {
  try {
    const snaps = await db
      .collection("bookingSnapshots")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json(snaps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await db
      .collection("bookings")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/bookings/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status required" });
    }

    const bookingId = new ObjectId(req.params.id);

    // 1) Update main booking
    await db.collection("bookings").updateOne(
      { _id: bookingId },
      { $set: { status } }
    );

    // 2) Update snapshot row also
    await db.collection("bookingSnapshots").updateOne(
      { bookingId },
      { $set: { status } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({ error: err.message });
  }
});


app.delete("/api/bookings/:id", async (req, res) => {
  try {
    await db.collection("bookings").deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================
   SERVICES ROUTES
============================================*/

// GET all services
app.get("/api/services", async (req, res) => {
  try {
    const services = await db.collection("services").find().toArray();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// CREATE service
app.post("/api/services", async (req, res) => {
  try {
    const data = req.body;
    const result = await db.collection("services").insertOne({
      ...data,
      createdAt: new Date(),
    });

    res.json({ id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create service" });
  }
});

// UPDATE service + sync all bookings for that service
app.put("/api/services/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const servicesCol = db.collection("services");
    const bookingsCol = db.collection("bookings");

    // 1) Update the service itself
    await servicesCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );

    // 2) Load updated service (fresh data)
    const svc = await servicesCol.findOne({ _id: new ObjectId(id) });

    if (svc) {
      const updateFields = {
        "service.name": svc.name || "",
        "service.category": svc.category || "",
        "service.description": svc.description || "",
        priceUsd: svc.priceUsd ?? null,
        priceNpr: svc.priceNpr ?? null,
        priceInr: svc.priceInr ?? null,
      };

      // Update all bookings linked to this service
      await bookingsCol.updateMany(
        { "service.id": String(svc._id) },
        { $set: updateFields }
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to update service & sync bookings:", err);
    res.status(500).json({ error: "Failed to update service" });
  }
});


// DELETE service
app.delete("/api/services/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await db.collection("services").deleteOne({
      _id: new ObjectId(id),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete service" });
  }
});


/* ============================================
   START SERVER
============================================*/
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
