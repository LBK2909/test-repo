require("dotenv").config({ path: ".env.development" });
const app = require("./app");
// Start the local server
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log("Press Ctrl+C to quit.");
});
