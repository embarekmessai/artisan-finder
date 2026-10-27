require("dotenv").config();

const express = require("express");

const app = express();

app.use(express.json({ limit: "100kb" }));

app.use("/api/artisans", require("./src/routes/artisans"));
app.use("/api/search", require("./src/routes/search"));
app.use("/api/export.csv", require("./src/routes/export"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`API démarrée sur http://localhost:${port}`);
});

