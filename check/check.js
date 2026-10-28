const fs = require('fs');
const src = fs.readFileSync(process.argv[2] || require('path').join(__dirname, '..', '1', 'index.html'), 'utf8');
const deckSrc = src.slice(src.indexOf('const DECK = {'), src.indexOf('/* ===================== ENGINE'));
const engSrc = src.slice(src.indexOf('/*ENGINE-START*/'), src.indexOf('/*ENGINE-END*/'));
const { DECK, totalOf, roomOf, isComplete } = new Function(deckSrc + engSrc + 'return {DECK,totalOf,roomOf,isComplete};')();
const N = DECK.chup.length, MAX = DECK.scale.max;
let ok = true; const fail = m => { ok = false; console.log('FAIL', m); };
if (N !== 22) fail('문항 수 ' + N);
// 1) 전 구간 빈틈·겹침
for (let t = N; t <= N * MAX; t++) {
  const hit = DECK.rooms.filter(r => t >= r.min && t <= r.max);
  if (hit.length !== 1) fail(`총점 ${t}: 방 ${hit.length}개`);
}
// 2) 최저·최고·경계
const all = v => Array(N).fill(v);
const expect = (a, id) => { const r = roomOf(DECK, totalOf(a)); if (!r || r.id !== id) fail(`${totalOf(a)} → ${r && r.id}, 기대 ${id}`); };
expect(all(1), 'milun'); expect(all(5), 'janun');
const withTotal = t => { const a = all(1); let rest = t - N; for (let i = 0; i < N && rest > 0; i++) { const add = Math.min(MAX - 1, rest); a[i] += add; rest -= add; } return a; };
[[30,'milun'],[31,'sanun'],[70,'sanun'],[71,'janun']].forEach(([t, id]) => expect(withTotal(t), id));
// 3) 무작위 1,000회 + 분포
const cnt = { milun: 0, sanun: 0, janun: 0 };
for (let k = 0; k < 1000; k++) {
  const a = Array.from({ length: N }, () => 1 + Math.floor(Math.random() * MAX));
  if (!isComplete(a, N)) fail('완료 판정');
  const r = roomOf(DECK, totalOf(a)); if (!r) fail('방 없음 ' + totalOf(a)); else cnt[r.id]++;
}
// 정확한 분포(각 첩 1–5 균등) — 합의 확률을 합성곱으로
let dist = [1]; for (let i = 0; i < N; i++) { const nd = Array(dist.length + MAX).fill(0); dist.forEach((p, s) => { for (let v = 1; v <= MAX; v++) nd[s + v] += p / MAX; }); dist = nd; }
const P = r => dist.reduce((s, p, t) => s + (t >= r.min && t <= r.max ? p : 0), 0);
console.log(ok ? 'CHECK 통과' : 'CHECK 실패');
console.log('무작위 1,000회:', cnt);
console.log('균등 응답일 때 방 확률:', DECK.rooms.map(r => `${r.name} ${(P(r) * 100).toFixed(3)}%`).join(' / '));
console.log('밀운방에 닿는 총점 수:', DECK.rooms[0].max - N + 1, '/ 가능한 총점', N * MAX - N + 1);
