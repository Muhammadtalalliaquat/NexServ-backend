import app from "./app.js";
import connectDB from "./database/data.js";

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB not connected Server is not running:", err.message);
    process.exit(1);
  });
