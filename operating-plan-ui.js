import {OPERATING_FIELDS,OPERATING_TITLE} from './operating-plan.js?v=luosifen2';
const f=n=>Number.isFinite(n)?n.toLocaleString('zh-TW',{maximumFractionDigits:2}):'—';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function operatingEditor(o){return `<details id="operatingEditor" class="operating-panel"><summary>螺絲粉營運假設｜點開修改</summary><p>20坪、廚房與前場各半、約20席；老闆補班不另支薪。客單價為實收金額。調整後請按更新試算。</p><div class="fields">${OPERATING_FIELDS.map(([key,label,unit,min,max])=>`<div class="field"><label for="op_${key}">${label}</label><div class="input-wrap"><input id="op_${key}" data-operating="${key}" type="number" inputmode="decimal" step="any" min="${min}" max="${max}" value="${esc(o[key])}" required><span>${unit}</span></div></div>`).join('')}</div><p class="tiny">正職與兼職年終比例合計100%；兼職自動取剩餘比例。薪資附加10%為本例概估。每人兼職150小時為可修改假設。</p></details>`;}
export function operatingSummary(plan){const p=plan?.out?.extra?.operating;if(!p)return '';const a=p.annual,o=p.assumptions;return [
 OPERATING_TITLE,'客單價 '+f(o.ticket)+' 元；營業 '+f(o.days)+' 天／月；初期 '+f(o.initialDaily)+' → 成熟期 '+f(o.matureDaily)+' 筆／日；第 '+f(plan.inputs.ramp)+' 月成熟。',
 '員工：正職 '+f(o.fullTime)+' 人×'+f(o.fullSalary)+' 萬元；兼職 '+f(o.partTime)+' 人×'+f(o.partHours)+' 小時×'+f(o.hourlyWage)+' 元；薪資含附加 '+f(o.personnelExtra)+'%＝'+f(p.salary)+' 萬元／月。',
 '成本 '+f(o.costPercent)+'%；租金／雜支／水電瓦斯 '+[o.rent,o.misc,o.utilities].map(f).join('／')+' 萬元；其他固定調整 '+f(o.fixedAdjustment)+' 萬元；金流 '+f(o.feeShare)+'%×'+f(o.merchantRate)+'%；稅金預留 '+f(o.tax)+'%。',
 '首年營收 '+f(a.revenue)+'；稅後淨利 '+f(a.net)+'；月分紅 '+f(a.bonus)+'；年終 '+f(a.yearEnd)+'；全年分紅後保留 '+f(a.retainedFinal)+'（萬元）。',
 '年終另提全年月分紅後保留盈餘 '+f(o.yearEndBonus)+'%；正職 '+f(o.fullTimeShare)+'%、兼職 '+f(100-o.fullTimeShare)+'%。正職每人 '+f(p.fullEach)+' 萬元；兼職每人 '+f(p.partEach)+' 萬元。',
 '全年還本 '+f(a.principal)+'、利息 '+f(a.interest)+'；年底現金 '+f(a.cashClose)+' 萬元。年終12月底付；本金不列損益費用。',
 '健檢口徑：開業資產負債＋首年預估損益／本息；應收與存貨未提供。',
 ...p.monthly.map(m=>m.month+'月｜營收 '+f(m.revenue)+'／稅後淨利 '+f(m.net)+'／月分紅 '+f(m.bonus)+'／年終 '+f(m.yearEnd)+'／淨現金流 '+f(m.cashChange)+'／期末現金 '+f(m.cashClose))
 ].join('\n');}
export function operatingResults(plan){const p=plan?.out?.extra?.operating;if(!p)return '';const a=p.annual;
 const table=(head,keys)=>`<div class="operating-scroll" tabindex="0" role="region" aria-label="${head[1]}逐月明細"><table><thead><tr>${head.map(h=>'<th>'+h+'</th>').join('')}</tr></thead><tbody>${p.monthly.map(m=>'<tr><th>'+m.month+'月</th>'+keys.map(k=>'<td>'+f(m[k])+'</td>').join('')+'</tr>').join('')}</tbody><tfoot><tr><th>全年</th>${keys.map(k=>'<td>'+f(a[k])+'</td>').join('')}</tr></tfoot></table></div>`;
 return `<section class="operating-panel" data-operating-result><h3>${OPERATING_TITLE}</h3><p>金額：新臺幣萬元。每月薪資含附加成本 ${f(p.salary)} 萬元；年終12月底另發。</p><details><summary>逐月損益與月分紅</summary>${table(['月份','營收','營業成本','毛利','薪資含附加','其他費用含折舊','利息','稅金預留','稅後淨利','月分紅'],['revenue','cost','grossProfit','salary','otherExpense','interest','tax','net','bonus'])}</details><details><summary>逐月現金流｜已扣還本及年終</summary>${table(['月份','月初現金','月分紅後保留','加回折舊','減還本','減年終','淨現金流','月底現金'],['cashOpen','retained','depreciation','principal','yearEnd','cashChange','cashClose'])}</details><details><summary>年終獎金與完整計算假設</summary><p>年終總額 <b>${f(a.yearEnd)}</b> 萬元；正職合計 ${f(p.fullBonus)}、每人 ${f(p.fullEach)} 萬元；兼職合計 ${f(p.partBonus)}、每人 ${f(p.partEach)} 萬元。按全年在職、同組均分。</p><pre style="white-space:pre-wrap;font:inherit;font-size:13px">${esc(operatingSummary(plan).split('\n').slice(0,8).join('\n'))}</pre></details><p class="tiny">分紅按稅後分配假設，不回推減稅。未另拆營業稅；公司活存採收款停留估算，並非本表月底現金。</p></section>`;
}

