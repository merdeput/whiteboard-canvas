const mongoose = require("mongoose");
const env = require("./env");
const models = require("../models");

async function connectDatabase() {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is required to start the server");
  }

  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });

    await Promise.all(Object.values(models).map((model) => model.init()));

    const { host, port, name } = mongoose.connection;
    const location = [host, port].filter(Boolean).join(":");
    console.log(`[database] connected to ${location || "mongodb"} / ${name}`);
  } catch (error) {
    console.error(`[database] failed to connect: ${error.message}`);
    throw error;
  }
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.close();
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
};
