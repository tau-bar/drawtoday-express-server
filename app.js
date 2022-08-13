const express = require("express");
const app = express();
const db = require("./services/db");
var cors = require("cors");

const bcrypt = require("bcrypt");

app.use(cors());
app.use(express.json());

const utils = require("./utils");
const { initScheduledJobs } = require("./services/cron");
const generateAccessToken = utils.generateAccessToken;
const authenticateToken = utils.authenticateToken;

const INCORRECT_USERNAME_PASSWORD = "Incorrect username/password";

/** Utility functions */
function formatDateTime(string) {
  const datetime = string.slice(0, 19).replace("T", " ");
  return datetime;
}

/** Endpoints */
/**
 * Get the word of the day
 */
app.get("/api/getWordOfDay", async (req, res) => {
  const drawingCount = await db
    .count("id")
    .from("drawings")
    .where("user_id", req.query.userId)
    .then((data) => {
      const count = JSON.parse(JSON.stringify(data))[0]["count(`id`)"];
      return count;
    });

  await db("words")
    .select(["id", "word"])
    .from("words")
    .orderBy("date", "desc")
    .limit(1)
    .then((word) => {
      res.send({
        word: word,
        postedToday: drawingCount === 1 && req.query.userId !== 0,
      });
    });
});

app.get("/api/getDrawing", (req, res) => {
  const { userId, wordId } = req.query;
  db("drawings")
    .select("drawing")
    .where("word_id", wordId)
    .where("user_id", userId)
    .then((data) => {
      const parsedData = JSON.parse(JSON.stringify(data));
      if (parsedData.length > 0) {
        res.send({
          drawing: parsedData[0].drawing,
        });
      } else {
        res.status(404).send({
          message: "No drawing found for this word id.",
        });
      }
    });
});

app.post("/api/postDrawing", authenticateToken, (req, res) => {
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
        message: "Successfully posted drawing.",
      })
    )
    .catch((err) => {
      res.status(403).send({
        message: "Could not post drawing.",
      });
    });
});

app.post("/api/login", async (req, res) => {
  const username = req.body.username;
  const user = await db("users")
    .select("id", "username", "password_digest", "salt")
    .where("username", username)
    .then((data) => JSON.parse(JSON.stringify(data))[0]);

  if (user === undefined) {
    res.status(403).send({ message: INCORRECT_USERNAME_PASSWORD });
    return;
  }

  const userSalt = user.salt;
  const passwordDigest = user.password_digest;
  const passwordDigestChallenge = await bcrypt.hash(
    req.body.password,
    userSalt
  );
  if (passwordDigest === passwordDigestChallenge) {
    const token = generateAccessToken({ username: req.body.username });
    res.send({ token: token, userId: user.id });
  } else {
    res.status(403).send({ message: INCORRECT_USERNAME_PASSWORD });
    return;
  }
});

app.post("/api/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const userCount = await db
    .count("id")
    .from("users")
    .where("username", username)
    .then((data) => {
      const userCount = JSON.parse(JSON.stringify(data))[0]["count(`id`)"];
      return userCount;
    });
  if (userCount === 0) {
    const salt = await bcrypt.genSalt(10);
    const passwordDigest = await bcrypt.hash(password, salt);
    const token = generateAccessToken({ username: username });
    db("users")
      .insert({
        username: username,
        password_digest: passwordDigest,
        salt: salt,
      })
      .then((data) =>
        res.send({
          token: token,
          userId: data[0],
        })
      )
      .catch((err) =>
        res
          .status(400)
          .send({ message: "Something went wrong. Please try again." })
      );
  } else {
    res.status(409).send({ message: "Username is taken." });
  }
});

// app.post("/api/getPosts", async (req, res) => {
//   const page = req.body.page;
//   db("drawings").
// })

const port = process.env.PORT || 3001;

initScheduledJobs();

app.listen(port, () => {
  console.log("Listening on port " + port);
});

module.exports = app;
