const f=(n,d=0)=>Number.isFinite(n)?n.toLocaleString('zh-TW',{maximumFractionDigits:d}):'待補資料';
export function healthForecastMarkup(plan,linked=true){
 const p=plan?.out?.extra?.operating,q=p?.forecast;if(!q)return '';
 const o=p.assumptions,h=q.health;
 const rows=[['現金與銀行存款',h.cash],['一年內可收貨款',h.receipts],['存貨成本',h.stock],['一年內應付款',h.shortDebt],['全部負債',h.totalDebt],['資產帳面總額',h.assets],['首年全年營收',h.sales],['首年營業利益',h.profit],['次年可還本息現金',h.annualAvailable],['次年應還借款本息',h.annualDebt]];
 return `<b>${linked?'已連結：大鈞首年年底預估健檢':'推估對照：健檢已改為自行填寫'}</b>
 <p>電子支付 ${f(o.settlementDays)} 天入帳、備料 ${f(o.inventoryDays)} 天、供應商付款 ${f(o.payableDays)} 天。顯示金額四捨五入至整數萬元，計算保留精度。這是新增可修改假設，非PDF既載數字；餘額以首年12月底估算。</p>
 <details><summary>查看完整推估與計算依據</summary>
 <table class="health-forecast-table"><tbody>${rows.map(([title,value])=>`<tr><th scope="row">${title}</th><td>${f(value)} 萬元</td></tr>`).join('')}</tbody></table>
 <p>應收款＝12月營收 ${f(p.monthly[11].revenue)} × 電子支付 ${f(o.feeShare,2)}% × 扣商戶費後 ${f(100-o.merchantRate,2)}% × ${f(o.settlementDays)}／30。這是待撥淨額，現金收款部分不形成應收。</p>
 <p>存貨＝12月營業成本 × 備料天數／30；應付貨款＝相同成本 × 付款帳期／30。以完整成本金額計算後，才將結果四捨五入顯示。</p>
 <p>PDF年底可用現金約 ${f(q.pdfAvailableCash)}，扣除應收與備貨占用、加回應付貨款後，依原始精度計算為可用現金約 ${f(q.availableCash)}。另有所得稅預留 ${f(q.taxReserve)}，假設尚未繳納，併入銀行存款及應付稅款兩邊，不重複算收入。</p>
 <p>資產由銀行存款、應收、存貨與設備淨額組成，總計約 ${f(q.assets)}；資金來源為負債約 ${f(q.totalDebt)}、權益約 ${f(q.equity)}。單項整數加總可能有尾差。</p>
 <p>一年內應付款包含次年本金 ${f(q.next.principal)}、應付貨款 ${f(q.payables)} 與首年預留稅款 ${f(q.taxReserve)}；未來利息列次年本息，不重複列入年底負債。</p>
 <p>次年延續既定爬坡至成熟營收，按原成本、薪資、稅率、分紅與剩餘攤還表估算，無新增設備、股東分配或借款。還款現金扣除次年營運、稅金、月分紅、年終及新增週轉需求；首年稅款由既有預留款支付。</p>
 ${q.fundingGap>0?`<p class="error">新增週轉假設下，可用現金缺口 ${f(q.fundingGap)} 萬元，須另行安排；未假設已取得額外融資。</p>`:''}
 <small>原PDF逐月現金流保留為原始基準，這份健檢另列新增週轉假設。自行修改健檢欄位後，以您填入的值為準。</small></details>`;
}
