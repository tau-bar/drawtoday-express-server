const CronJob = require("node-cron");
const randomWords = require("random-words");
const db = require("./db");

exports.initScheduledJobs = () => {
  const scheduledJobFunction = CronJob.schedule("*/01 08 * * *", () => {
    const newWord = randomWords();
    db("words")
      .insert({
        date: new Date(),
        word: newWord,
      })
      .then(() => {
        console.log("Word added");
      })
      .catch((err) => {
        console.log(err);
      });
  });

  scheduledJobFunction.start();
};
