import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();

// bridges
// import sepoliaBridge from "./bridges/sepolia";
import allfeatBridge from "./bridges/allfeat.js";

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);

  //   sepoliaBridge();
  allfeatBridge();
});
