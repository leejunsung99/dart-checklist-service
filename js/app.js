// 화면 흐름: home() → render() (질문 6개) → result()

let answers = {}, step = 0;
const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function questions() {
  return [
    { id: 'market', title: '어느 시장의 회사인가요?', desc: '시장에 맞는 업무 안내와 외부 확인 경로를 맞춥니다.',
      options: [['kosdaq', '코스닥'], ['kospi', '코스피'], ['unknown', '시장·적용 여부부터 확인']] },
    { id: 'topic', title: '지금 어떤 업무를 처리하고 있나요?', desc: '가장 가까운 상황 하나를 골라주세요.',
      options: Object.entries(TOPICS).map(([id, t]) => [id, t.name, t.sub]) },
    { id: 'detail', title: '구체적으로 어떤 상황인가요?', desc: '결과에 표시할 세부 점검 항목을 선택합니다.',
      options: (DETAILS[answers.topic] || []).map(x => [x, x]) },
    { id: 'stage', title: '지금 어느 단계인가요?', desc: '같은 업무도 진행 시점에 따라 준비 순서가 달라집니다.',
      options: Object.entries(STAGES) },
    { id: 'certainty', title: '필요한 사실과 숫자가 확인됐나요?', desc: '금액·발생 시점·조건·서류의 확인 상태입니다.',
      options: [['yes', '근거 자료까지 확인했어요'], ['partial', '일부가 미확정이거나 부족해요'], ['unknown', '무엇부터 확인할지 모르겠어요']] },
    { id: 'public', title: answers.topic === 'ir' ? '이 정보가 외부에 전달됐나요?' : '이 건의 정보를 외부에 공개할 예정인가요?',
      desc: 'IR·보도자료·기자·투자자 응대까지 포함합니다.',
      options: [['planned', '아직 공개 전이고, 공개 예정이에요'], ['done', '일부 또는 전부 외부에 전달됐어요'], ['none', '현재 외부 공개 계획은 없어요'], ['unknown', '공개 여부·범위를 확인해야 해요']] }
  ];
}

function home() {
  app.innerHTML = `<div class="fade-in"><div class="hero"><div><div class="eyebrow">공시담당자의 다음 단계</div><h1>지금 내 업무,<br>무엇부터 확인할까요?</h1><p class="lead">상황에 맞는 질문 6개에 답하면<br>준비자료와 검토 경로를 한 장으로 정리합니다.</p><button class="primary" id="start">내 업무 확인하기<span class="arrow">↗</span></button><p class="meta">약 1분 · 회사명·계약금액 입력 없이 사용</p></div><div class="art" aria-hidden="true"><div class="tile"><b>01</b>상황을 고르고</div><div class="tile"><b>02</b>확인 상태를 체크하고</div><div class="tile"><b>03</b>나의 업무 가이드 완성</div></div></div><div class="note">교육 시리즈 연계 시안입니다. 결과는 준비·검토 경로 안내이며, 개별 건의 공시의무·법정 시한은 해당 시장의 현행 규정과 사실관계로 확인하세요.</div></div>`;
  document.getElementById('start').onclick = () => { answers = {}; step = 0; render(); };
}

function render() {
  const qs = questions(), q = qs[step], total = qs.length;
  app.innerHTML = `<div class="row"><div class="eyebrow">MY DISCLOSURE GUIDE</div><span class="counter"><b>${step + 1}</b> / ${total}</span></div><div class="progress"><div style="width:${(step + 1) / total * 100}%"></div></div><section class="panel fade-in"><h2 tabindex="-1">${q.title}</h2><p>${q.desc}</p><div class="options">${q.options.map(([v, l, d], i) => `<button class="option${answers[q.id] === v ? ' selected' : ''}" data-value="${esc(v)}"><span class="num">${String(i + 1).padStart(2, '0')}</span><span>${esc(l)}${d ? `<small>${esc(d)}</small>` : ''}</span></button>`).join('')}</div></section><div class="actions"><button class="ghost" id="back">← ${step ? '이전 질문' : '시작 화면'}</button></div>`;
  app.querySelectorAll('[data-value]').forEach(b => b.onclick = () => {
    if (q.id === 'topic' && answers.topic !== b.dataset.value) delete answers.detail;
    answers[q.id] = b.dataset.value;
    if (step < total - 1) { step++; render(); } else result();
    window.scrollTo(0, 0);
  });
  document.getElementById('back').onclick = () => { if (step) { step--; render(); } else home(); };
  app.querySelector('h2').focus();
}

function resultData() {
  const t = TOPICS[answers.topic];
  const detail = answers.detail || '';
  let docs = [...t.docs];
  let checks = ['해당 시장·공시 항목·관련 보고의무 확인', '발생 시점·제출 시한·담당자 확인', '공시 수치·문안·근거 문서 대조'];
  let priority = '근거 자료를 모아 적용 의무와 처리 일정을 확인하세요.';
  let actions = [];

  if (answers.stage === 'plan') actions = ['유관부서에서 안건·계약·일정 초안을 받기', '관련 의무·발생 시점·기준 재무값을 사전 검토하기', '결정일에 확정할 자료와 내부 검토 담당자를 지정하기'];
  if (answers.stage === 'event') actions = ['결정·체결·확인된 사실과 정확한 시점을 기록하기', '현행 규정에서 의무·제출처·시한을 확인하기', '문안·첨부자료를 검토하고 제출 일정을 확정하기'];
  if (answers.stage === 'filed') actions = ['실제 게시본과 첨부파일 확인하기', '조건 변경·완료·결과 보고 등 후속 일정을 등록하기', '담당부서별 재확인 시점과 증빙을 기록하기'];
  if (answers.stage === 'changed') {
    docs.unshift('최초 공시·정정 이력과 변경 전후 대비표');
    checks.unshift('변경 사실·오류·미확정 사항의 확정·완료를 구분');
    actions = ['변경 내용과 확인 시점을 원문 자료로 정리하기', '최초 공시와 대조해 정정·재공시·별도 후속 보고를 검토하기', '현행 규정상 시한을 확인하고 담당 검토자와 처리하기'];
    priority = '최초 공시와 달라진 내용 및 확인 시점부터 정리하세요.';
  }
  if (answers.certainty !== 'yes') {
    docs.unshift('미확인 정보 목록·확인 담당자·회신 예정 시각');
    actions.unshift('부족한 사실을 확인하면서 의무·시한 검토를 병행하기');
    checks.push('자료 미확정 여부와 별개로 사유 발생 시점을 검토');
    priority = '부족한 정보와 확인 담당자를 정리하고 시한 검토를 병행하세요.';
  }
  if (answers.public !== 'none') {
    docs.push('기존 공개 자료·공개 시각·수신 대상·추가 공개 계획');
    checks.push('미공개 중요정보·공정공시 및 공개 순서 검토');
  }
  if (answers.public === 'done') {
    actions.unshift('실제 공개 내용·시각·대상을 확보해 공시책임자와 대응 검토하기');
    priority = '외부 전달 내용을 확보하고 공개 시점과 관련 공시를 대조하세요.';
  }
  if (detail === '소각') checks.push('소각 결의·변경상장 등 후속 절차 검토');
  if (detail.includes('임원') || detail.includes('전환')) checks.push('임원·주요주주 소유보고·대량보유 등 별도 보고의무와 의무자 검토');
  if (detail === '종료·해지') checks.push('정상 이행 종료와 계약 해지를 구분해 의무 검토');
  if (answers.topic === 'results' && detail === '사업·반기·분기보고서') checks.push('부서별 변경사항·서명·첨부 및 XBRL 적용 범위 확인');
  if (answers.topic === 'meeting') checks.push('회사 정관·기준일·표결결과 및 후속 신고 확인');
  if (answers.topic === 'funding') checks.push('공모·사모 등 발행 구조별 추가 서류 검토');
  if (answers.market === 'unknown') actions.unshift('상장시장과 회사에 적용되는 규정부터 확인하기');
  return { t, docs, checks, actions, priority };
}

const list = x => '<ul>' + x.map(v => `<li>${esc(v)}</li>`).join('') + '</ul>';

function consultingCard() {
  return `<section class="card wide consulting"><div><img class="consult-logo" src="assets/logo.png" alt="Luminaire IR"><h3>IR/PR 컨설팅 문의</h3><p>투자자 커뮤니케이션과 IR/PR 운영에 도움이 필요하신가요?<br>${CONTACT.company}에 상담을 문의해 주세요.</p><a class="contact-button" href="${CONTACT.formUrl}" target="_blank" rel="noopener">IR서비스 상담 신청하기 <span>↗</span></a><small>버튼을 누르면 상담 신청서가 새 창으로 열립니다.</small></div><dl class="contact-info"><dt>이메일</dt><dd><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></dd><dt>주소</dt><dd>${CONTACT.address}</dd></dl></section>`;
}

function result() {
  const { t, docs, checks, actions, priority } = resultData();
  const market = MARKETS[answers.market];
  app.innerHTML = `<div class="fade-in"><div class="eyebrow">YOUR WORKFLOW CARD</div><h1 tabindex="-1">${t.name}<br>다음 단계가 정리됐어요.</h1>
<div class="chips"><span class="chip">${market}</span><span class="chip">${esc(answers.detail)}</span><span class="chip">${STAGES[answers.stage]}</span></div>
<div class="note priority"><strong>지금 먼저 할 일</strong>${priority}</div>
<div class="actions"><button class="primary" id="print">결과 인쇄 / PDF 저장</button><button id="copy">결과 텍스트 복사</button><button id="edit">답변 수정</button><button class="ghost" id="restart">처음부터</button><span id="status" role="status"></span></div>
<div class="grid">
<section class="card wide"><h3><span class="num">01</span>권장 확인 순서</h3><div class="steps">${actions.map((v, i) => `<div class="step"><b>${i + 1}</b><span>${esc(v)}</span></div>`).join('')}</div></section>
<section class="card"><h3><span class="num">02</span>준비할 자료</h3>${list(docs)}</section>
<section class="card"><h3><span class="num">03</span>내부 검토부서</h3>${list(t.teams)}<p class="hint">부서명·승인권자는 회사의 조직과 내부규정에 맞춰 조정하세요.</p></section>
<section class="card"><h3><span class="num">04</span>외부 확인 경로</h3>${list(t.external)}<p class="hint">문의·사실 확인 경로입니다. 일률적인 사전 승인·보증 기관을 의미하지 않습니다.</p></section>
<section class="card"><h3><span class="num">05</span>점검 체크리스트</h3>${checks.map(x => `<label class="check"><input type="checkbox"><span>${esc(x)}</span></label>`).join('')}</section>
<section class="card links"><h3><span class="num">06</span>공식 참고 사이트</h3>${OFFICIAL_LINKS.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${l}<span>↗</span></a>`).join('')}</section>
<section class="card series"><h3><span class="num">07</span>교육 시리즈 연결</h3><p>${t.ep} · 10편 공시 후 관리${answers.public !== 'none' && answers.topic !== 'ir' ? ' · 9편 정보 공개' : ''}</p><small>영상은 기획 단계입니다. 공개 후 해당 편의 링크를 연결할 영역입니다.</small></section>
${consultingCard()}
</div>
<div class="note">이 결과는 규칙 기반으로 구성한 업무 준비 가이드입니다. 회사 규모·거래금액·조건·사유 발생일을 입력받지 않으므로 공시 대상 여부나 제출기한을 확정하지 않습니다. 근거 자료와 현행 규정에 따라 내부 검토 및 필요한 외부 확인을 진행하세요.</div></div>`;

  document.getElementById('print').onclick = () => window.print();
  document.getElementById('edit').onclick = () => { step = 0; render(); };
  document.getElementById('restart').onclick = home;
  document.getElementById('copy').onclick = async () => {
    const status = document.getElementById('status');
    const text = [market, t.name, answers.detail, STAGES[answers.stage], priority,
      '확인 순서', ...actions, '준비자료', ...docs, '내부 검토', ...t.teams, '외부 확인', ...t.external, '체크리스트', ...checks,
      '공식 자료 https://dart.fss.or.kr/info/main.do', '공시 원문 https://kind.krx.co.kr/',
      `IR서비스 상담 신청 · ${CONTACT.company}`, CONTACT.formUrl, CONTACT.email, CONTACT.address].join('\n');
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
