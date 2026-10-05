// HUD and result panels render snapshots; they never change gameplay state.
export function createGameView(document) {
  const scoreEl = document.getElementById('score');
  const progressEl = document.getElementById('progress');
  const percentEl = document.getElementById('percent');
  const resultPanel = document.getElementById('result');
  const resultTitle = document.getElementById('resultTitle');
  const resultText = document.getElementById('resultText');
  const restartBtn = document.getElementById('restartBtn');
  return {
    update({ hearts, collected, combo, camera, levelEnd, score }) {
      document.getElementById('hearts').textContent='♥'.repeat(hearts)+'♡'.repeat(3-hearts);
      document.getElementById('hearts').ariaLabel=`남은 하트 ${hearts}개`;
      document.getElementById('collectCount').textContent=`모은 별 ${collected}개`;
      const pct = Math.max(0,Math.min(100,Math.floor(camera/levelEnd*100)));
      scoreEl.textContent = `${score}점 / 100`;
      progressEl.style.width = pct + "%";
      percentEl.textContent = pct + "%";
    },
    finish(success, { score, starPenalty, quizPenalty, collected, missed, quizIndex, nickname }) {
      resultPanel.style.display="block";
      document.getElementById('successMessage').hidden = !success;
      if(success) {
        resultTitle.textContent=nickname ? `${nickname}, 고생했어!! 🎉` : "모험 성공! 🎉";
        resultText.innerHTML="끝까지 정말 잘했어요!<br>솔솔바람이 함께 응원했어요 💙";
      } else {
        resultTitle.textContent="괜찮아, 다시 해보자! 🌱";
        resultText.innerHTML="하트를 모두 소진하면 게임을 다시 시작해야 돼요.<br><b>이중점프</b>도 활용해보세요!";
      }
      resultText.innerHTML+=`<br><b>총 ${score}점 / 100점</b><br>별 감점 −${starPenalty.toFixed(1)}점 · 퀴즈 감점 −${quizPenalty}점<br>모은 별 ${collected}개 · 놓친 별 ${missed}개<br>통과한 퀴즈 ${quizIndex}/3`;
      restartBtn.focus();

    },
  };
}
