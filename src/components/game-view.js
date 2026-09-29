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
      document.getElementById('collectCount').textContent=`별 ${collected} · 콤보 ${combo}`;
      const pct = Math.max(0,Math.min(100,Math.floor(camera/levelEnd*100)));
      scoreEl.textContent = "⭐ " + score;
      progressEl.style.width = pct + "%";
      percentEl.textContent = pct + "%";
    },
    finish(success, { score, camera, starPoints, quizPoints, collected, quizIndex }) {
      resultPanel.style.display="block";
      document.getElementById('successMessage').hidden = !success;
      if(success) {
        resultTitle.textContent="모험 성공! 🎉";
        resultText.innerHTML="끝까지 정말 잘했어요!<br>솔솔바람이 함께 응원했어요 💙";
      } else {
        resultTitle.textContent="괜찮아, 다시 해보자! 🌱";
        resultText.innerHTML="조금씩 익숙해지면 더 멀리 갈 수 있어요.<br><b>이중점프</b>도 활용해보세요!";
      }
      resultText.innerHTML+=`<br><b>총 ${score}점</b><br>달리기 ${Math.floor(camera/12)} · 별/콤보 ${starPoints} · 퀴즈 ${quizPoints}<br>모은 별 ${collected}개 · 통과한 퀴즈 ${quizIndex}/3`;
      restartBtn.focus();

    },
  };
}
