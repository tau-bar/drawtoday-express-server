const express = require("express");
const app = express();
const db = require("./services/db");

/**
 * Get the word of the day
 */
app.get("/api/getWordOfDay", (req, res) => {
  db("words")
    .select("word")
    .from("words")
    .orderBy("date", "desc")
    .limit(1)
    .then((word) => res.send(word));
});

app;
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log("Listening on port " + port);
});
