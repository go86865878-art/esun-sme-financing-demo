// Local, deterministic document knowledge assistant. No API calls or stored chats.
(() => {
  'use strict';
  const sources = {
    documents: { label: '本頁文件準備清單', href: '#documents' },
    forms: { label: '本頁制式文件下載區', href: '#formDownloads' },
    official: { label: '玉山銀行官方表單下載', href: 'https://www.esunbank.com/zh-tw/about/customer-service/applications' },
    rm: { label: '專人聯繫', href: 'https://www.esunbank.com/zh-tw/about/services/customer/message-board' },
    cash: { label: '玉山收付通官方介紹', href: 'https://www.esunbank.com/zh-tw/business/corporate/cash-management/cash-flow' },
    gib: { label: '玉山全球智匯網官方入口', href: 'https://gib.esunbank.com' },
    models: { label: '本頁試算與模型假設', href: '#simulator' },
    health: { label: '本頁財務健檢與指標定義', href: '#health' },
    personal: { label: '附件：個人資料表', href: 'personal-info.pdf' },
    related: { label: '附件：法人同一關係企業資料表', href: 'related-enterprises.pdf' },
    application: { label: '附件：授信申請書（小型企業）', href: 'small-business-application.pdf' },
    entity: { label: '附件：非個人戶顧客身分資料表', href: 'entity-identity.pdf' },
    tax: { label: '附件：國稅局委託書', href: 'tax-authorization.pdf' }
  };
  const modelNames = { working: '營運週轉金', equipment: '廠房與設備', expansion: '展店與擴張', overseas: '海外投資' };
  const commonDocs = '可先準備：\n□ 公司／商業登記相關資料\n□ 負責人及保證人雙證件\n□ 近三年財報、最近一期自結資料；如有會計師查核或稅簽報告，一併備妥\n□ 近一年營業稅申報資料（例如 401 表，依實際申報類型）\n□ 營運模式說明、前十大進貨與銷貨明細\n□ 主要往來銀行、借款及存款往來資料';
  const purposeDocs = {
    working: '週轉金再補：收款、存貨及付款情形，主要訂單／合約，以及明年營收預估的依據。讓專員了解錢卡在哪個環節，比只說「想借多少」更有幫助。',
    equipment: '廠房與設備再補：興建／購置計畫、工程預算與進度、設備報價／合約、營運計畫、預估損益／資產負債／現金流量表及資金來源。土地建物權利資料、相關許可與抵押文件，依案件由銀行確認。',
    expansion: '展店再補：展店計畫、店面租約、裝修／設備預算、既有店營運資料、新店營收與損益預估、爬坡期資金安排及自備款來源。也可以一起討論收款、對帳與企業網銀的需求。',
    overseas: '海外投資再補：投資地點與股權架構、投資與營運計畫、台幣／美元支出明細、預估報表、自備款與借款來源，以及預計用什麼幣別的收入還款。相關投資核准或申報文件，請依實際案件確認。'
  };
  const answer = (title, body, refs) => ({ title, body, refs });
  function currentModel() {
    const key = document.querySelector('.model-card.active')?.dataset.model;
    return Object.hasOwn(modelNames, key) ? key : 'working';
  }
  function knowledge(question) {
    const q = question.toLowerCase().replace(/\s+/g, '');
    if (/專人聯繫|留言板|留言聯繫|聯絡|聯繫/.test(q)) return answer('專人聯繫：留言後等候銀行回覆', '請點選下方「專人聯繫」至玉山官方留言板，依官網表單指示留言，由銀行專人回覆。\n\n本頁試算結果、輸入資料與文件不會自動傳送；需要提供試算摘要時，請先與專人確認交付方式。留言不等同申貸送件或核貸。', ['rm']);
    if (/目前用途|現在.*準備|我.*需要.*文件|要準備哪些|文件清單|申貸.*文件|貸款.*文件|申請.*文件|準備.*文件/.test(q)) {
      const key = /建廠|擴廠|興建|廠房|設備/.test(q) ? 'equipment' : /展店|開店|新店|店面/.test(q) ? 'expansion' : /海外|雙幣|美元/.test(q) ? 'overseas' : /週轉|周轉/.test(q) ? 'working' : currentModel();
      return answer((key === currentModel() ? '您目前選擇：' : '您詢問的用途：') + modelNames[key], commonDocs + '\n\n' + purposeDocs[key] + '\n\n這是討論前的準備方向。實際應備文件、期間與適用表單，請先與服務銀行確認，再進行填寫。制式表單集中在右側下載區。', ['documents', 'forms', 'rm']);
    }
    if (/聯徵|同意書/.test(q)) return answer('聯徵與資料運用同意，先確認適用版本', '聯徵查詢及資料運用同意事項，請由服務銀行確認借款企業、負責人與保證人各自需要簽署的文件及方式。\n\n本頁右側提供已整理的授信相關表單；有些同意事項可能列在申請書內，仍須由銀行確認是否適用、是否另須文件。下載不代表已申請或同意查詢，請勿先自行判斷簽章範圍。', ['forms', 'application', 'official', 'rm']);
    if (/關係企業|關係人|股權/.test(q)) return answer('關係企業資料，先釐清企業之間的連結', '可先整理企業之間的持股、經營管理與主要交易關係，並由銀行協助確認申報範圍及認定方式。\n\n右側已提供「法人同一關係企業資料表」。不確定某家公司是否須列入時，請先詢問專員，再填寫適用表單。', ['related', 'forms', 'rm']);
    if (/個人資料表/.test(q)) return answer('個人資料表的填寫範圍，請先與銀行確認', '個人資料表與雙證件是不同的準備項目。負責人或保證人是否須填寫、填寫哪個版本及簽章方式，請由服務銀行依案件確認。\n\n本頁提供附件下載，建議確認後再填寫，並依銀行指定的方式交付文件。', ['personal', 'forms', 'rm']);
    if (/雙證件|身分證|身份證|證件|負責人|保證人/.test(q)) return answer('負責人、保證人都要準備雙證件', '左側文件清單以「負責人及保證人雙證件」列示。請先備妥身分證與另一項可辨識身分的證件，再向銀行確認可接受的證件種類、是否須攜帶正本及核驗方式。\n\n個人資料表、聯徵同意等制式文件放在右側下載區，適用版本和簽章方式請先與服務銀行確認。此小幫手不收取證件照片。', ['documents', 'forms', 'rm']);
    if (/企業資料表|制式|表單|申請書|下載文件|怎麼填|如何填/.test(q)) return answer('先下載參考，確認後再填寫', '這裡是文件下載與準備的參考入口。企業資料表、個人資料表、授信申請書、關係企業資料表及相關同意事項，請先與服務銀行確認適用版本、填寫範圍與簽章方式後，再進行填寫。\n\n企業資料表有不同授信金額級距的版本，請勿只依本次試算金額自行選用。右側也備有顧客身分資料表等附件，是否需要仍依案件確認。', ['forms', 'official', 'entity', 'rm']);
    if (/委託書|國稅局|稅務資料/.test(q)) return answer('國稅局委託書的用途與簽章，請先確認', '右側提供國稅局委託書附件。是否適用、委託範圍、需備資料與簽章方式，請先由服務銀行說明後再填寫。\n\n這份委託書不等同財報或營業稅申報表，也不代表本網站能代為調閱稅務資料。', ['tax', 'forms', 'rm']);
    if (/401|403|405|406|財報|稅簽|自結|營業稅|損益表|資產負債/.test(q)) return answer('財報、稅簽與 401 表，提供的是不同資訊', '財報：說明公司一段期間的經營成果，以及期末資產、負債與權益。可先備近三年及最近一期自結資料。\n\n查核／稅簽報告：如公司已有會計師查核或稅務簽證報告，可一併準備；是否必要由銀行依案件確認。\n\n401 等營業稅申報資料：協助了解近期銷售與進貨情形，依公司實際申報類型準備，並非每家公司都用同一張表，也不能直接取代完整財報。\n\n資料年度、月份、報表口徑及是否需補充其他文件，請先向銀行確認。', ['documents', 'rm']);
    if (/前十大|進銷貨|進貨明細|銷貨明細|營運模式|營運說明/.test(q)) return answer('把「怎麼做生意、怎麼收付款」說清楚', '營運說明可以用白話整理：賣什麼、向誰買、賣給誰、是否先備貨或接單生產，以及收款和付款大約隔多久。\n\n前十大進貨與銷貨明細，建議分別整理主要交易對象、金額／占比、交易期間及收付款條件；如有關係企業交易，也一併說明。是否須附合約、訂單或其他佐證，由銀行依案件確認。', ['documents', 'rm']);
    if (/建廠|擴廠|興建|建照|廠房|工程|設備/.test(q)) return answer('廠房與設備：計畫、資金與年度還款一起看', purposeDocs.equipment + '\n\n本頁試算先用總預算扣除自有資金，估計需安排的融資；再按假設利率、年限與寬限期列出每年本金及利息。目前採年繳等額本金，實際撥款、還款方式及抵押條件仍須由銀行評估。', ['documents', 'models', 'rm']);
    if (/收付通|網銀|智匯|金流|對帳|收款工具/.test(q)) return answer('資金安排之外，也能一起規劃收付款', '玉山收付通與企業網銀可作為進一步討論企業收付款及帳務管理需求的入口。\n\n如果有多店點、頻繁收款、付款或對帳需求，可以先整理目前的作業方式與痛點，再與專員確認適合的服務、申請條件、費用與導入方式。\n\n下方提供收付通介紹與全球智匯網官方入口。本頁不會自動替您申請、開通或連接銀行帳戶。', ['cash', 'gib', 'rm']);
    if (/展店|新店|開店|店面|爬坡/.test(q)) return answer('展店：把開幕前與開幕後的資金分開看', purposeDocs.expansion + '\n\n本頁把裝修設備等一次投入與營運準備金納入資金需求，再檢查穩定營收、變動成本與固定支出。還款採月繳本息攤還並按年彙總；爬坡期的簡化假設仍須按實際營運調整。', ['documents', 'models', 'cash', 'rm']);
    if (/海外|雙幣|台幣|美元|美金|匯率|幣別/.test(q)) return answer('海外投資：台幣、美元各算各的缺口', purposeDocs.overseas + '\n\n目前「雙幣別」指投資支出預算同時包含台幣與美元，各幣別的自有資金分別抵用。匯率情境只換算美元需求的台幣等值，並非美元借款金額變多，也不等同雙幣借款方案。實際借款主體、還款幣別與避險安排，請再與銀行討論。', ['documents', 'models', 'rm']);
    if (/週轉|周轉|收款天|存貨|付款天|營收|公式/.test(q)) return answer('週轉金：先看貨款回來前，要墊多少錢', '本頁以一年 365 天估算：\n應收貨款＝明年預估營收 × 收款天數 ÷ 365\n存貨占用＝明年預估營收 × 成本率 × 存貨賣出天數 ÷ 365\n可延後支付貨款＝明年預估營收 × 成本率 × 付款天數 ÷ 365\n\n三者加減後，估計明年營運資金占用，再扣除可投入的自有週轉金及已確認可使用的既有週轉融資。結果低於零時以零呈現；新增占用與總需求會分開看。\n\n季節性備貨、工程進度款或預收款等特殊情況，需要另外分析。試算缺口不是銀行核准額度。', ['models', 'rm']);
    if (/利率|報價|核貸|額度|保證通過|一定.*貸|可以.*貸/.test(q)) return answer('試算利率是情境假設，額度仍須審查', '本頁利率由使用者自行輸入，只供規劃與比較，並非銀行報價。資金缺口也不等同可核貸額度。\n\n銀行仍須了解實際資金用途、還款來源、企業與保證人情況及擔保條件，才能討論合適的額度、利率、年限與費用。您可以先至官方留言板留言，等候專人回覆；本頁試算摘要不會自動傳送。', ['models', 'rm']);
    if (/健檢|紅燈|黃燈|綠燈|財務健康/.test(q)) return answer('紅黃綠是提醒，請搭配指標定義一起看', '本頁用白話輸入估計付款能力、負債負擔、獲利與還款餘裕，分為警示（紅）、注意（黃）及健康（綠）。\n\n請先確認資料期間、金額與可動用範圍一致，再閱讀各指標定義。門檻是本測試網的參考規則，不是玉山銀行授信標準，也不代表授信評分或核貸結果。', ['health', 'rm']);
    if (/資料.*(送|存)|上傳|隱私|安全|後台|ai|人工智慧|機器人|知識庫/.test(q)) return answer('本版是文件知識庫示範', '我依預先整理的知識庫與關鍵字回覆，尚未串接生成式 AI。試算與這段對話在本頁處理，不會由此小幫手傳送至銀行或外部 AI 服務，也不會保存對話供下次使用。\n\n本版不收取證件照片或財報檔案，請勿在問題中貼上身分證字號、帳號或客戶機密。正式申貸與文件交付，請依銀行指定的管道辦理。', ['rm']);
    if (/你好|您好|哈囉|hi|hello/.test(q)) return answer('您好，從文件或資金用途開始都可以', '我能協助整理申貸文件、說明四種資金試算，並提供收付通與企業網銀的官方入口。\n\n您可以問：「目前用途要準備哪些文件？」或「財報、稅簽、401 表有什麼不同？」', ['documents', 'models']);
    return answer('這個問題還不在本版知識庫範圍內', '目前能提供申貸文件、四種試算與金流服務的基本說明，無法判斷個案核貸、法律稅務或即時產品條件。\n\n您可以換成更具體的文件問題，或點選「專人聯繫」至玉山官方留言板，等候專人回覆；本頁試算不會自動傳送。', ['forms', 'rm']);
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function chatAvatar() {
    const avatar = el('span', 'esun-assistant-avatar'); avatar.setAttribute('aria-hidden', 'true');
    const image = el('img'); image.src = 'esun-meow.png'; image.alt = ''; image.width = 448; image.height = 602;
    avatar.append(image); return avatar;
  }
  function init() {
    if (document.getElementById('esun-assistant')) return;
    const root = el('aside', 'esun-assistant'); root.id = 'esun-assistant'; root.setAttribute('aria-label', 'AI 顧問小幫手｜文件知識庫示範');
    const launcher = el('button', 'esun-assistant-launch'); launcher.id = 'esun-assistant-toggle'; launcher.type = 'button';
    launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-controls', 'esun-assistant-panel');
    launcher.append(chatAvatar()); const launchText = el('span', 'esun-assistant-launch-text', 'AI 顧問小幫手'); launchText.append(el('small', '', '文件・試算問答')); launcher.append(launchText);
    const panel = el('section', 'esun-assistant-panel'); panel.id = 'esun-assistant-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'esun-assistant-title');
    const head = el('div', 'esun-assistant-head'); const heading = el('div'); const title = el('h2', '', 'AI 顧問小幫手'); title.id = 'esun-assistant-title'; heading.append(title, el('p', '', '文件知識庫示範'));
    const close = el('button', 'esun-assistant-close', '×'); close.type = 'button'; close.setAttribute('aria-label', '關閉問答助手'); head.append(heading, close);
    const notice = el('p', 'esun-assistant-notice', '本版依知識庫回覆，未串接生成式 AI。文件請先與服務銀行確認。');
    const context = el('div', 'esun-assistant-context');
    const log = el('div', 'esun-assistant-log'); log.id = 'esun-assistant-log'; log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite'); log.setAttribute('aria-relevant', 'additions'); log.setAttribute('aria-label', '問答對話');
    const quick = el('div', 'esun-assistant-quick'); quick.setAttribute('aria-label', '常見問題');
    const questions = ['目前用途要準備哪些文件？', '雙證件要準備什麼？', '財報、稅簽、401 怎麼準備？', '制式表單怎麼填？'];
    const form = el('form', 'esun-assistant-form'); const label = el('label', '', '輸入您的問題'); label.htmlFor = 'esun-assistant-input';
    const entry = el('div', 'esun-assistant-entry'); const input = el('textarea'); input.id = 'esun-assistant-input'; input.rows = 2; input.maxLength = 500; input.placeholder = '例如：建廠還需要哪些資料？'; input.setAttribute('aria-describedby', 'esun-assistant-privacy');
    const send = el('button', 'esun-assistant-send', '送出'); send.id = 'esun-assistant-send'; send.type = 'submit'; entry.append(input, send);
    const status = el('p', 'esun-assistant-status'); status.setAttribute('role', 'status');
    const foot = el('div', 'esun-assistant-foot'); const privacy = el('p', '', '對話僅留在本頁，不會送至銀行。'); privacy.id = 'esun-assistant-privacy'; const clear = el('button', '', '清除對話'); clear.type = 'button'; foot.append(privacy, clear);
    form.append(label, entry, status, foot); panel.append(head, notice, context, log, quick, form); root.append(panel, launcher); document.body.append(root);
    function appendMessage(who, data) {
      const msg = el('article', 'esun-assistant-message ' + (who === 'user' ? 'is-user' : 'is-assistant'));
      msg.append(el('small', 'esun-assistant-speaker', who === 'user' ? '您' : '知識庫回覆'));
      if (who === 'user') msg.append(el('p', 'esun-assistant-message-body', data));
      else {
        msg.append(el('strong', 'esun-assistant-message-title', data.title), el('p', 'esun-assistant-message-body', data.body));
        if (data.refs?.length) {
          const details = el('details', 'esun-assistant-sources'); details.append(el('summary', '', '查看依據與相關入口'));
          const list = el('ul');
          [...new Set(data.refs)].forEach(key => {
            const src = sources[key]; if (!src) return;
            const li = el('li'); const link = el('a', '', src.label); link.href = src.href;
            if (!src.href.startsWith('#')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
            li.append(link); list.append(li);
          }); details.append(list); msg.append(details);
        }
      }
      log.append(msg); log.scrollTop = log.scrollHeight;
    }
    function welcome() {
      appendMessage('assistant', answer('先把文件準備方向弄清楚', '您好！我能協助整理申貸文件與說明本頁試算。點選下方常見問題，或直接輸入想問的內容。\n\n目前用途：' + modelNames[currentModel()] + '。', ['documents', 'forms']));
    }
    function ask(question) {
      const text = question.trim().slice(0, 500);
      if (!text) { status.textContent = '請先輸入問題。'; input.focus(); return; }
      status.textContent = ''; appendMessage('user', text); appendMessage('assistant', knowledge(text)); input.value = ''; input.focus({ preventScroll: true });
    }
    function setOpen(open) {
      panel.hidden = !open; root.classList.toggle('is-open', open); launcher.setAttribute('aria-expanded', String(open));
      if (open) { context.textContent = '目前用途：' + modelNames[currentModel()]; log.scrollTop = log.scrollHeight; input.focus({ preventScroll: true }); }
      else launcher.focus({ preventScroll: true });
    }
    questions.forEach(question => { const button = el('button', '', question); button.type = 'button'; button.addEventListener('click', () => ask(question)); quick.append(button); });
    launcher.addEventListener('click', () => setOpen(panel.hidden)); close.addEventListener('click', () => setOpen(false));
    form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
    input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); ask(input.value); } });
    panel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } });
    clear.addEventListener('click', () => { log.replaceChildren(); input.value = ''; status.textContent = '本頁對話已清除。'; welcome(); input.focus({ preventScroll: true }); });
    const modelTitle = document.getElementById('modelTitle');
    if (modelTitle) new MutationObserver(() => { context.textContent = '目前用途：' + modelNames[currentModel()]; }).observe(modelTitle, { childList: true, characterData: true, subtree: true });
    context.textContent = '目前用途：' + modelNames[currentModel()]; welcome();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
