// Quiz presentation only; rewards and progression belong to the controller.
export function createQuizView(document) {
  const panel = document.getElementById('quiz');
  const choices = document.getElementById('quizChoices');
  const feedback = document.getElementById('quizFeedback');
  const next = document.getElementById('quizContinue');

  return {
    show(question, index, onAnswer) {
      panel.style.display = 'block';
      next.style.display = 'none';
      document.getElementById('quizQuestion').textContent = `${index + 1}/3 · ${question.q}`;
      feedback.textContent = '달리기는 잠시 멈췄어요. 천천히 골라 보세요!';
      choices.replaceChildren();
      question.a.forEach((text, answerIndex) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${['①','②','③'][answerIndex]} ${text}`;
        button.addEventListener('click', () => onAnswer(answerIndex));
        choices.appendChild(button);
      });
      choices.children[0].focus();
    },
    showHint(hint, index) {
      feedback.textContent = `괜찮아요! ${hint} 다른 답을 골라보세요.`;
      choices.children[index].disabled = true;
      Array.from(choices.children).find(button => !button.disabled).focus();
    },
    showSuccess(explanation) {
      feedback.textContent = `정답이에요! ${explanation}`;
      Array.from(choices.children).forEach(button => { button.disabled = true; });
      next.style.display = 'inline-block';
      next.focus();
    },
    hide() {
      next.blur();
      panel.style.display = 'none';
    },
  };
}
