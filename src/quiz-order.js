// Shuffle copies so each run is independent of the original quiz content.
function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createQuizOrder(source, random = Math.random) {
  return shuffle(source, random).map(question => {
    const choices = shuffle(question.a.map((text, index) => ({ text, index })), random);
    return {
      ...question,
      a: choices.map(choice => choice.text),
      correct: choices.findIndex(choice => choice.index === question.correct),
    };
  });
}
