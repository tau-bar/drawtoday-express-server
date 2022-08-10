const express = require("express");
const app = express();
const db = require("./services/db");
var cors = require("cors");

app.use(cors());
app.use(express.json());

/** Utility functions */
function formatDateTime(string) {
  const datetime = string.slice(0, 19).replace("T", " ");
  return datetime;
}

/** Endpoints */
/**
 * Get the word of the day
 */
app.get("/api/getWordOfDay", (req, res) => {
  db("words")
    .select(["id", "word"])
    .from("words")
    .orderBy("date", "desc")
    .limit(1)
    .then((word) => res.send(word));
});

app.post("/api/postDrawing", (req, res) => {
  const { userId, wordId, drawing, date } = req.body;
  db("drawings")
    .insert({
      user_id: userId,
      word_id: wordId,
      drawing: drawing,
      date_posted: formatDateTime(date),
    })
    .then(() =>
      res.send({
        ok: true,
        message: "Successfully posted drawing.",
      })
    )
    .catch((err) => {
      console.log(err.sqlMessage);
      res.send({
        ok: false,
        message: "Could not post drawing.",
      });
    });
});

app;
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log("Listening on port " + port);
});
