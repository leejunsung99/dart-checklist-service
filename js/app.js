// 화면 흐름: home() → render() (상황별 질문 5~7개) → result()
// 데이터: data.js (TOPICS·STAGES·EXPOSURE·METRICS 등) + items.js (공시 항목 ITEMS)

let answers = {}, step = 0;
const app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const item = () => ITEMS.find(x => x.id === answers.item);
const mkt = () => answers.market === 'kospi' ? 'kospi' : 'kosdaq';
const rule = it => it[mkt()] || null;
// 받침 유무에 맞는 조사 (예: josa('계약금액','이','가') → 계약금액이)
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return w + (c >= 0 && c <= 11171 && c % 28 ? a : b); };

// 선택한 시장·규모에 맞는 의무 비율(%)
function metricRate(it) {
  const m = METRICS[it.id];
  if (!m) return null;
  const r = m[mkt()];
  if (!r) return null;
  const idx = { small: 0, mid: 1, large: 2 }[answers.size];
  // 규모를 모르면 놓치지 않도록 해당 시장의 가장 낮은(엄격한) 비율 적용
  return idx === undefined ? Math.min(...(mkt() === 'kospi' ? [r[0], r[2]] : r)) : r[idx];
}

function questions() {
  const pre = answers.market === 'pre';
  const qs = [
    { id: 'market', title: '어느 시장의 회사인가요?', desc: '코스닥과 코스피는 공시 기준 비율과 예외 시한이 다릅니다.',
      options: [['kosdaq', '코스닥 상장사'], ['kospi', '유가증권시장(코스피) 상장사'], ['pre', '상장을 준비 중인 회사', '코스닥 상장예비심사 준비']] }
  ];
  if (!pre) qs.push({ id: 'size', title: '최근 사업연도말 자산총액은 어느 정도인가요?', desc: '대기업·대규모법인은 일부 항목의 공시 기준 비율이 완화됩니다. (연결 기준 여부는 시장 규정 확인)',
    options: answers.market === 'kosdaq'
      ? [['small', '2천억원 미만'], ['mid', '2천억원 이상 ~ 2조원 미만', '코스닥 「대기업」'], ['large', '2조원 이상', '「대규모법인」'], ['unknown', '잘 모르겠어요']]
      : [['small', '2조원 미만'], ['large', '2조원 이상', '「대규모법인」'], ['unknown', '잘 모르겠어요']] });
  if (!pre) qs.push({ id: 'topic', title: '지금 어떤 업무를 처리하고 있나요?', desc: '가장 가까운 업무 하나를 골라주세요.',
    options: Object.entries(TOPICS).map(([id, t]) => [id, id === 'listing' ? '자회사 상장(중복상장)' : t.name, id === 'listing' ? '모회사 이사회 의무·주주보호' : t.sub]) });
  const topic = pre ? 'listing' : answers.topic;
  const pool = ITEMS.filter(x => x.topic === topic && (pre ? x.pre : !x.pre) && x[pre ? 'kosdaq' : mkt()]); // 선택한 시장에 있는 항목만
  qs.push({ id: 'item', title: '구체적으로 어떤 사건인가요?', desc: '거래소 공시 항목 기준으로 나눴습니다.',
    options: pool.map(x => [x.id, x.name, x.when]) });
  if (!pre) qs.push({ id: 'stage', title: '지금 어느 단계인가요?', desc: '같은 사건도 시점에 따라 해야 할 일이 다릅니다.', options: Object.entries(STAGES) });
  const it = item();
  if (it && METRICS[it.id]) {
    const m = METRICS[it.id], rate = metricRate(it);
    qs.push({ id: 'scale', title: m.q ? m.q.replace('{rate}', rate) : `${josa(m.subject, '이', '가')} ${m.base}의 ${rate}% 이상인가요?`,
      desc: `${MARKET_NAME[mkt()]} ${{ mid: '대기업', large: '대규모법인', unknown: '(규모 미확인 → 가장 엄격한 비율 적용)' }[answers.size] || '일반'} 기준입니다. ${(m.hint || '').startsWith('코스닥') && mkt() === 'kospi' ? '' : m.hint || ''}`,
      options: [['over', `네, ${rate}% 이상이에요`], ['under', `아니요, ${rate}% 미만이에요`], ['calc', '아직 계산 전이에요']] });
  }
  if (!pre) qs.push({ id: 'exposure', title: '이 건이 외부에 알려진 상황인가요?', desc: '공정공시·조회공시 위험을 함께 점검합니다.',
    options: Object.entries(EXPOSURE).map(([id, e]) => [id, e.label, e.sub]) });
  return qs;
}

function home() {
  app.innerHTML = `<div class="fade-in"><div class="hero"><div><div class="eyebrow">공시담당자의 다음 단계</div><h1>지금 내 업무,<br>무엇부터 확인할까요?</h1><p class="lead">시장·규모·사건을 고르면<br>공시 기준과 시한, 체크포인트를 한 장으로 정리합니다.</p><button class="primary" id="start">내 업무 확인하기<span class="arrow">↗</span></button><p class="meta">약 1분 · 회사명·계약금액 입력 없이 사용</p></div><div class="art" aria-hidden="true"><div class="tile"><b>01</b>시장·규모·사건 선택</div><div class="tile"><b>02</b>공시 기준·시한 판정</div><div class="tile"><b>03</b>체크리스트·후속 공시</div></div></div><div class="note">거래소 「코스닥시장 공시·상장관리 해설」, 「유가증권시장 공시·상장 업무해설서」 등을 바탕으로 정리했습니다. 해설서는 개정될 수 있으므로 최종 판단은 현행 규정과 거래소 확인을 거치세요.</div></div>`;
  document.getElementById('start').onclick = () => { answers = {}; step = 0; render(); };
}

function render() {
  const qs = questions(), q = qs[step], total = qs.length;
  app.innerHTML = `<div class="row"><div class="eyebrow">MY DISCLOSURE GUIDE</div><span class="counter"><b>${step + 1}</b> / ${total}</span></div><div class="progress"><div style="width:${(step + 1) / total * 100}%"></div></div><section class="panel fade-in"><h2 tabindex="-1">${esc(q.title)}</h2><p>${esc(q.desc)}</p><div class="options">${q.options.map(([v, l, d], i) => `<button class="option${answers[q.id] === v ? ' selected' : ''}" data-value="${esc(v)}"><span class="num">${String(i + 1).padStart(2, '0')}</span><span>${esc(l)}${d ? `<small>${esc(d)}</small>` : ''}</span></button>`).join('')}</div></section><div class="actions"><button class="ghost" id="back">← ${step ? '이전 질문' : '시작 화면'}</button></div>`;
  app.querySelectorAll('[data-value]').forEach(b => b.onclick = () => {
    const v = b.dataset.value;
    if (answers[q.id] !== v) {
      // 앞 답이 바뀌면 그 답에 의존하는 뒤 답을 지움
      const deps = { market: ['size', 'topic', 'item', 'scale'], size: ['scale'], topic: ['item', 'scale'], item: ['scale'] }[q.id] || [];
      deps.forEach(k => delete answers[k]);
    }
    answers[q.id] = v;
    if (step < questions().length - 1) { step++; render(); } else result();
    window.scrollTo(0, 0);
  });
  document.getElementById('back').onclick = () => { if (step) { step--; render(); } else home(); };
  app.querySelector('h2').focus();
}

function verdict(it) {
  const r = rule(it), m = METRICS[it.id], rate = metricRate(it);
  if (!r) return { level: 'check', label: '확인 필요', title: `${MARKET_NAME[mkt()]} 해설서에는 별도 항목이 없어요`, text: '다른 시장 기준을 참고로 보여드립니다. 적용 여부는 거래소에 확인하세요.' };
  if (answers.market === 'pre') return { level: 'info', label: '상장 준비', title: '심사 전에 미리 갖출 사항입니다', text: r.duty };
  if (m) {
    if (answers.scale === 'over') return { level: 'must', label: '의무공시', title: '공시의무 대상으로 보입니다', text: r.duty };
    if (answers.scale === 'under') {
      const note = m.underNote && !(m.underNote.startsWith('코스닥') && mkt() === 'kospi') ? ` 단, ${m.underNote}` : '';
      return { level: 'voluntary', label: '자율공시 검토', title: '비율 기준으로는 의무공시 대상이 아닙니다', text: (r.voluntary ? `자율공시 가능: ${r.voluntary}` : '투자판단에 중요한 정보라면 자율공시 여부를 검토하고, 외부에 먼저 알릴 때는 공정공시를 확인하세요.') + note };
    }
    return { level: 'check', label: '기준 산정', title: '공시 기준 비율부터 계산하세요', text: `${m.calc || `${m.subject} ÷ ${m.base}`} 결과가 ${rate}% 이상이면 공시의무 대상입니다. 기준: ${r.duty}` };
  }
  if (it.id === 'voluntary_contract_disclosure' || it.id === 'voluntary_clarification') return { level: 'voluntary', label: '자율공시', title: '의무는 아니지만, 내면 책임도 같습니다', text: r.duty };
  if (it.topic === 'ir') return { level: 'info', label: '대응 기준', title: '시한과 대응 기준부터 확인하세요', text: r.duty };
  if (it.topic === 'listing') return { level: 'info', label: '사전 절차', title: '상장 신청 전에 거쳐야 할 절차입니다', text: r.duty };
  return { level: 'must', label: '의무공시', title: '사실이 확정되면 공시해야 하는 항목입니다', text: r.duty };
}

function plan(it, v) {
  const r = rule(it) || it.kosdaq || it.kospi || {};
  const dl = r.deadline ? `${it.topic === 'ir' ? '대응' : '제출'} 시한 확인: ${r.deadline}` : '시한을 현행 규정으로 확인';
  if (answers.market === 'pre') return ['상장주선인(주관사)과 신청 일정과 형식요건 충족 여부부터 점검하기', '지정감사·재무제표 준비 일정을 신청 시점에서 역산하기', '정관·지배구조·내부통제 정비 과제를 목록으로 만들기', '상장 일정에 맞춰 IR Book·기업설명회 준비 일정을 함께 잡기'];
  const s = answers.stage, fss = it.fss ? [`함께 챙길 제출·보고: ${it.fss}`] : [];
  if (s === 'plan' && it.topic === 'ir') return ['공개할 정보 범위와 대응 창구(공시책임자·IR)를 미리 정하기', dl, '아래 체크포인트를 공시책임자와 함께 확인하기', '예상 질의와 답변 문안을 공시책임자 검토를 거쳐 준비하기'];
  if (s === 'plan') return ['결정 이사회일·계약 체결일 등 「사유 발생일」을 미리 특정하기', dl, '아래 체크포인트를 담당부서와 하나씩 확인하기', '공시 문안 초안과 첨부 근거자료를 결정 전에 준비하기'];
  if (s === 'event') return [v.level === 'check' ? '기준 금액·비율을 오늘 바로 산정하기' : '사유 발생 시각을 기록하고 시한을 역산하기', dl, '아래 체크포인트로 공시 문안·첨부를 점검하기', ...fss, '공시책임자 검토 후 시한 안에 제출하기'];
  if (s === 'filed') return ['게시된 공시 원문·첨부를 사내 근거자료와 대조하기', '아래 후속 공시 중 해당하는 것을 일정표에 등록하기', '금액·기간·일정 등 바뀔 수 있는 조건을 담당부서와 정기 점검하기'];
  return ['변경 전·후 대비표와 변경 확정일을 정리하기', '정정·변경 공시 시한 확인 (대부분 사유 발생일 당일)', ...(it.penalty ? [`번복·변경 리스크 점검: ${it.penalty}`] : []), '정정 사유를 문안에 명확히 적기'];
}

const list = x => '<ul>' + x.map(v => `<li>${esc(v)}</li>`).join('') + '</ul>';

function consultingCard(t) {
  return `<section class="card wide consulting"><div><img class="consult-logo" src="assets/logo.png" alt="Luminaire IR"><h3>IR/PR 컨설팅 문의</h3><p>${esc(t.pitch || '투자자 커뮤니케이션과 IR/PR 운영에 도움이 필요하신가요?')}<br>${CONTACT.company}에 상담을 문의해 주세요.</p><a class="contact-button" href="${CONTACT.formUrl}" target="_blank" rel="noopener">IR서비스 상담 신청하기 <span>↗</span></a><small>버튼을 누르면 상담 신청서가 새 창으로 열립니다.</small></div><dl class="contact-info"><dt>이메일</dt><dd><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></dd><dt>주소</dt><dd>${CONTACT.address}</dd></dl></section>`;
}

function result() {
  const it = item(), t = TOPICS[it.topic], v = verdict(it), steps = plan(it, v);
  const ex = answers.market === 'pre' ? PRE_EXPOSURE : EXPOSURE[answers.exposure];
  const r = rule(it) || it.kosdaq || it.kospi || {};
  const other = answers.market === 'pre' ? null : it[mkt() === 'kospi' ? 'kosdaq' : 'kospi'];
  const sizeName = answers.market === 'pre' ? '' : ({ small: '일반', mid: '대기업', large: '대규모법인', unknown: '규모 미확인' }[answers.size]);
  const exposureNotes = [...ex.notes, ...(it.penalty ? [it.penalty] : [])];
  const L = answers.market === 'pre' ? { dl: '심사 기간', checks: '준비 체크포인트', next: '이후 일정' }
    : it.topic === 'listing' ? { dl: '제출 시한', checks: '절차 체크포인트', next: '단계별 공시·후속 절차' }
    : it.topic === 'ir' ? { dl: '대응 시한', checks: '대응 전 체크포인트', next: '후속 공시 일정' }
    : { dl: '제출 시한', checks: '공시 전 체크포인트', next: '후속 공시 일정' };

  app.innerHTML = `<div class="fade-in"><div class="eyebrow">YOUR DISCLOSURE CARD</div><h1 tabindex="-1">${esc(it.name)}</h1>
<div class="chips"><span class="chip">${answers.market === 'pre' ? '상장 준비' : MARKET_NAME[mkt()]}</span>${sizeName ? `<span class="chip">${sizeName}</span>` : ''}${answers.stage ? `<span class="chip">${STAGES[answers.stage]}</span>` : ''}</div>
<section class="verdict lv-${v.level}"><div class="v-head"><span class="v-label">${v.label}</span><h2>${esc(v.title)}</h2><p>${esc(v.text)}</p></div>
<dl class="v-facts"><div><dt>${L.dl}</dt><dd>${esc(r.deadline || '현행 규정 확인')}</dd></div>${it.fss ? `<div><dt>관련 제출·보고</dt><dd>${esc(it.fss)}</dd></div>` : ''}</dl>
${other && other.duty && other.duty !== r.duty ? `<p class="v-compare"><b>${josa(MARKET_NAME[mkt() === 'kospi' ? 'kosdaq' : 'kospi'], '은', '는')} 다릅니다</b> ${esc(other.duty)}</p>` : ''}</section>
<div class="actions"><button class="primary" id="print">결과 인쇄 / PDF 저장</button><button id="copy">결과 텍스트 복사</button><button id="edit">답변 수정</button><button class="ghost" id="restart">처음부터</button><span id="status" role="status"></span></div>
<div class="grid">
<section class="card wide"><h3><span class="num">01</span>지금 할 일</h3><div class="steps">${steps.map((x, i) => `<div class="step"><b>${i + 1}</b><span>${esc(x)}</span></div>`).join('')}</div></section>
<section class="card"><h3><span class="num">02</span>${L.checks}</h3>${(it.checks || []).map(x => `<label class="check"><input type="checkbox"><span>${esc(x)}</span></label>`).join('')}</section>
<section class="card"><h3><span class="num">03</span>자주 틀리는 부분</h3>${list(it.pitfalls || [])}</section>
<section class="card"><h3><span class="num">04</span>${L.next}</h3>${list(it.followups || ['후속 공시 사항 없음 — 변경 발생 시 정정 여부 검토'])}</section>
<section class="card ${ex.level === 'high' ? 'alert' : ''}"><h3><span class="num">05</span>${answers.market === 'pre' ? '상장 전 정보 관리' : '외부 공개·불성실공시 리스크'}</h3><p class="hint strong">${esc(ex.head)}</p>${list(exposureNotes)}</section>
<section class="card"><h3><span class="num">06</span>준비자료</h3>${list(t.docs)}</section>
<section class="card"><h3><span class="num">07</span>내부 검토·외부 확인</h3>${list([...t.teams, ...t.external])}<p class="hint">부서명·승인권자는 회사 조직에 맞춰 조정하세요.</p></section>
<section class="card links wide"><h3><span class="num">08</span>공식 참고 사이트</h3>${OFFICIAL_LINKS.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l}<span>↗</span></a>`).join('')}</section>
${consultingCard(t)}
</div>
<div class="note">거래소 해설서 내용을 요약한 업무 가이드입니다. 해설서와 규정이 다르면 규정이 우선하며, 개별 건의 공시 여부·시한은 사실관계에 따라 달라질 수 있으니 거래소 공시 담당에 확인하세요.</div></div>`;

  document.getElementById('print').onclick = () => window.print();
  document.getElementById('edit').onclick = () => { step = 0; render(); };
  document.getElementById('restart').onclick = home;
  document.getElementById('copy').onclick = async () => {
    const status = document.getElementById('status');
    const text = [`[${it.name}] ${answers.market === 'pre' ? '상장 준비' : MARKET_NAME[mkt()]} ${sizeName} · ${STAGES[answers.stage] || '상장 준비'}`,
      `판정: ${v.label} — ${v.title}`, v.text, `${it.topic === 'ir' ? '대응' : '제출'} 시한: ${r.deadline || '현행 규정 확인'}`, ...(it.fss ? [`관련 제출·보고: ${it.fss}`] : []),
      '', '■ 지금 할 일', ...steps.map((x, i) => `${i + 1}. ${x}`), '', '■ 체크포인트', ...(it.checks || []).map(x => `- ${x}`),
      '', '■ 자주 틀리는 부분', ...(it.pitfalls || []).map(x => `- ${x}`), '', '■ 후속 공시', ...(it.followups || []).map(x => `- ${x}`),
      '', '■ 외부 공개 리스크', ex.head, ...exposureNotes.map(x => `- ${x}`),
      '', `IR서비스 상담 신청 · ${CONTACT.company} ${CONTACT.formUrl}`].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = '복사했습니다.';
    } catch (e) {
      const area = document.createElement('textarea');
      area.className = 'copy-fallback';
      area.value = text;
      app.append(area);
      area.select();
      status.textContent = '아래 텍스트를 선택해 복사하세요.';
    }
  };
  app.querySelector('h1').focus();
  window.scrollTo(0, 0);
}

home();
