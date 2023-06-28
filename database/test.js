module.exports = () => {
  const Quiz = require("./schema").questions;
  const quiz = new Quiz({
    title: "What is the largest city in the world?",
    answer: [
      {
        id: 1,
        name: "Tokyo",
        correct: true,
      },
      {
        id: 2,
        name: "New York",
        correct: false,
      },
      {
        id: 3,
        name: "Shanghai",
        correct: false,
      },
      {
        id: 4,
        name: "São Paulo",
        correct: false,
      },
      {
        id: 5,
        name: "Mexico City",
        correct: false,
      },
    ],
  });

  quiz.save().then(() => console.log("meow"));
};
