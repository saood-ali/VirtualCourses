
module.exports = async (req, res) => {
  try {
    // Dynamically load your Express app
    const appModule = await import("../index.js");
    const app = appModule.default;
    
    // Pass the request to the app
    return app(req, res);
  } catch (error) {
    console.error("Bypassed Error:", error);
    res.status(500).send("Server Loading Error: " + error.message);
  }
};