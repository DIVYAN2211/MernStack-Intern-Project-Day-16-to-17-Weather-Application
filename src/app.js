const express = require("express");
const hbs = require("hbs"); // rendering html
const path = require("path"); // handling directory ps
const weatherData = require("../utils/weatherData");
const History = require("../utils/historyModel"); // Import the history model
require("./db/mongoose"); // Connect MongoDB

const app = express();
const port = process.env.PORT || 4000;

// Set up public directory for static files
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

// Set up views and partials for Handlebars
const viewsPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");

app.set("view engine", "hbs");
app.set("views", viewsPath);
hbs.registerPartials(partialsPath);

// Middleware to parse JSON requests
app.use(express.json());  // Add this line to allow POST data parsing

// Render the home page
app.get("", (req, res) => {
  res.render("index", { title: "Weather App" });
});

// Weather API endpoint
app.get("/weather", async (req, res) => {
  if (!req.query.address) {
    return res.send("Address is required");
  }

  weatherData(req.query.address, async (error, result) => {
    if (error) {
      return res.send(error);
    }

    if (result.cod === 200) {
      // Save search history in MongoDB
      try {
        await History.create({
          city: result.name,
          temperature: (result.main.temp - 273.15).toFixed(2) + "°C",
          weatherCondition: result.weather[0].description.toUpperCase(),
        });
        console.log("Search history saved.");
      } catch (err) {
        console.error("Error saving history:", err);
      }
    }

    res.send(result);
  });
});

// Fetch Search History
app.get("/history", async (req, res) => {
  try {
    const history = await History.find().sort({ timestamp: -1 }).limit(10);
    res.json(history);
  } catch (err) {
    res.status(500).send("Error fetching search history");
  }
});

// Edit search history entry
app.put("/history/edit/:id", async (req, res) => {
  try {
    const historyId = req.params.id;//objrct parameter of url
    const { city } = req.body;

    // Fetch the latest weather data for the city
    weatherData(city, async (error, result) => {
      if (error) {
        return res.status(500).send("Error fetching weather data");
      }

      if (result.cod === 200) {
        const updatedHistory = await History.findByIdAndUpdate(
          historyId,
          {
            city: result.name,
            temperature: (result.main.temp - 273.15).toFixed(2) + "°C",
            weatherCondition: result.weather[0].description.toUpperCase(),
          },
          { new: true } // updated document is returned.
        );
        if (!updatedHistory) {
          return res.status(404).send("History not found");
        }
        res.json({ success: true, updatedHistory });
      } else {
        return res.status(404).send("City not found");
      }
    });
  } catch (err) {
    res.status(500).send("Error updating history");
  }
});

// Delete search history
app.delete("/history/:id", async (req, res) => {
  try {
    const historyId = req.params.id; // extract id from url
    const historyEntry = await History.findByIdAndDelete(historyId);
    if (!historyEntry) {
      return res.status(404).send("History not found");
    }
    res.status(200).send("History deleted successfully");
  } catch (err) {
    res.status(500).send("Error deleting history");
  }
});

// Handle 404 errors
app.get("*", (req, res) => {
  res.render("404", { title: "Page not found" });
});

app.listen(port, () => {
  console.log("Server is listening on port " + port);
});
