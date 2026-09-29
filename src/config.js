// Level content and quiz copy. No DOM or runtime state.
export const LEVEL_END = 4700;
export const questions = [
    {q:'공중에서 한 번 더 점프하려면?', a:['아무것도 누르지 않기','화면 또는 점프 키를 한 번 더 누르기','속도만 바꾸기'], correct:1, hint:'점프는 공중에서도 한 번 더 할 수 있어요.'},
    {q:'반짝이는 별을 모으면 무엇을 얻을까요?', a:['점수와 연속 획득 보너스','장애물이 더 생겨요','하트가 줄어요'], correct:0, hint:'별을 모으면 위쪽 점수판의 숫자가 올라가요.'},
    {q:'퀴즈를 틀렸을 때는 어떻게 하면 될까요?', a:['처음부터 다시 시작하기','게임을 끝내기','힌트를 읽고 다른 답 고르기'], correct:2, hint:'몽글이는 정답을 찾을 때까지 기다려줘요.'}
  ];
export const obstacleNames = ["알약","주사기","약병","반창고","비타민"];
export const obstaclePositions = [
    620, 910, 1200, 1500, 1790, 2070, 2380, 2670,
    2950, 3240, 3520, 3790, 4070, 4350
  ];
export const obstacleStyles = ["capsule","syringe","vial","bandage","vitamin"];

