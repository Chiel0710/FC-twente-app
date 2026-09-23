// Start de lokale server. In fase 2 (Vercel) wordt dit bestand niet gebruikt —
// daar exporteert app.js direct als serverless function.
require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`FC Twente backend draait op http://localhost:${PORT}`);
});
