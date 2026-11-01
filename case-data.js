import {calculateOperating} from './operating-plan.js?v=visualbrief20261101';
// Optional fictional cases; the page never applies these automatically.
export const DEMO_CASES = [
  {
    "id": "02",
    "model": "expansion",
    "title": "大鈞螺絲粉",
    "company": "大鈞螺絲粉（虛構案例）",
    "businessType": "加盟餐飲",
    "rm": "",
    "city": "新北市",
    "district": "新莊區",
    "address": "新北市新莊區幸福路168號1樓（示範門牌）",
    "contact": "大鈞（假名）",
    "brand": "大鈞螺絲粉（虛構品牌）",
    "stores": 1,
    "month": "2027-01",
    "time": "平日下午",
    "story": "20坪加盟店，廚房與前場各10坪、約20席。老闆補班不另支薪，3位正職、6位兼職。實收客單價300元，初期每日100筆交易，第6個月達170筆。自有資金300萬元、融資300萬元，開辦投入420萬元，剩餘180萬元留作營運資金。",
    "input": {
      "setup": 420,
      "reserve": 180,
      "equity": 300,
      "revenue": 153,
      "margin": 61.85,
      "fixed": 52.63,
      "ramp": 6,
      "interest": 2.25,
      "tenor": 5,
      "annualBudget": 222.05308086537568,
      "operating": {
        "kind": "luosifen-v1",
        "settlementDays": 7,
        "inventoryDays": 7,
        "payableDays": 0,
        "ticket": 300,
        "days": 30,
        "initialDaily": 100,
        "matureDaily": 170,
        "costPercent": 35,
        "fullTime": 3,
        "fullSalary": 4.5,
        "partTime": 6,
        "partHours": 150,
        "hourlyWage": 220,
        "personnelExtra": 10,
        "rent": 10,
        "misc": 3,
        "utilities": 3,
        "fixedAdjustment": 0,
        "feeShare": 70,
        "merchantRate": 4.5,
        "tax": 20,
        "monthlyBonus": 20,
        "yearEndBonus": 30,
        "fullTimeShare": 80,
        "depreciationMonths": 60
      }
    },
    "fields": [
      [
        "實收客單價",
        "300元（不再加服務費）"
      ],
      [
        "每日交易筆數",
        "100筆逐月增至170筆，第6個月成熟"
      ],
      [
        "營業成本率",
        "35%"
      ],
      [
        "正職／兼職",
        "3人×4.5萬；6人×150小時×220元"
      ],
      [
        "薪資含附加成本10%",
        "36.63萬元／月"
      ],
      [
        "租金／雜支／水電瓦斯",
        "10／3／3萬元／月"
      ],
      [
        "金流費用",
        "70%交易×4.5%"
      ],
      [
        "稅後月分紅",
        "正的稅後淨利20%"
      ],
      [
        "年終獎金",
        "月分紅後全年保留盈餘30%；正職80%、兼職20%"
      ],
      [
        "開辦／預備金／自有",
        "420／180／300萬元"
      ],
      [
        "貸款年利率／期數",
        "2.25%／5年"
      ],
      [
        "首年營收",
        "1,647萬元"
      ]
    ],
    "health": {
      "cash": 180,
      "receipts": null,
      "stock": null,
      "shortDebt": 57.3332910108565,
      "totalDebt": 300,
      "assets": 600,
      "sales": 1647,
      "profit": 303.1094999999999,
      "annualAvailable": 222.05308086537568,
      "annualDebt": 63.49444112929071
    },
    "services": [
      "loan",
      "cardAcquiring",
      "payroll",
      "accountOpening"
    ],
    "note": "【螺絲粉營運計畫預估】20坪新店，首年營收1,647萬元；融資300萬元、2.25%、5年本息均攤。月分紅20%，年終另提全年保留盈餘30%，正職80%、兼職20%。初期100筆／日，第6月達170筆。完整逐月數據附在本案規劃；修改後以最新計算結果為準。地址為示範門牌。",
    "routing": "依新北市新莊區與300萬元融資需求推薦承接單位；分行或區域中心由設定門檻與人工確認決定。",
    "insight": "每月本金列在現金流；折舊列在損益。年終獎金12月底發放。健檢使用開業資產負債與首年預估損益、本息，未填的存貨與應收不作推估。",
    "ask": "請確認實際開店支出、排班、付款時點與收單費率；本例為可修改的假設情境。",
    "shortName": "大鈞螺絲粉",
    "payrollEmployees": 9,
    "valueAssumptions": {"collectionShare":100,"feeShare":70,"merchantRate":4.5,"bankShare":50,"depositDays":30,"depositYield":0.5,"salary":3.7,"savingShare":100,"employeeYield":0.5,"utilization":100,"loanRate":2,"loanRateHigh":2.5}
  },
  {
    "id": "04",
    "model": "equipment",
    "title": "小愷螺絲粉連鎖｜食安央廚",
    "shortName": "小愷央廚",
    "company": "小愷螺絲粉連鎖（虛構案例）",
    "businessType": "中央廚房／食品製造",
    "rm": "",
    "city": "臺北市",
    "district": "中山區",
    "address": "臺北市中山區民權東路三段12號（示範地址）",
    "contact": "小愷（假名）",
    "brand": "小愷螺絲粉（虛構品牌）",
    "stores": 8,
    "month": "2027-03",
    "time": "平日下午",
    "story": "既有8間成熟螺絲粉直營店，每日合計銷售1,360碗、實收每碗350元，合併年營收17,136萬元。為統一食品安全管理、穩定各店口味與品質，規劃購置現成央廚房地5,000萬元、設備2,000萬元及初期營運資金1,000萬元。公司現金5,000萬元，保留2,000萬元營運水位，自有現金投入3,000萬元、股東增資2,000萬元，另申請銀行融資3,000萬元。冷凍包與加盟供貨僅列為未來發展方向，未計入本次營收。",
    "input": {
      "invest": 8000,
      "equity": 5000,
      "interest": 2.25,
      "tenor": 5,
      "grace": 0,
      "annualBudget": 2317.3756278148944,
      "repaymentMethod": "monthly_annuity"
    },
    "fields": [
      [
        "合併既有直營店",
        "8間，員工64人；另央廚規劃8人"
      ],
      [
        "合併成熟期銷售",
        "每日1,360碗 × 350元 × 30日"
      ],
      [
        "合併年營業收入",
        "17,136萬元；冷凍包／加盟新增收入不計入"
      ],
      [
        "營業成本率",
        "30%"
      ],
      [
        "央廚投資預算",
        "8,000萬元＝房地5,000＋設備2,000＋初期週轉1,000"
      ],
      [
        "公司現金安排",
        "現有5,000萬元，保留2,000萬元，投入3,000萬元"
      ],
      [
        "其他股東增資",
        "2,000萬元；列為權益，不列收入"
      ],
      [
        "銀行融資需求",
        "3,000萬元，5年，2.25%，月繳本息平均攤還"
      ],
      [
        "次年可用於償還本息現金",
        "約2,317萬元"
      ],
      [
        "次年本息合計",
        "約635萬元"
      ],
      [
        "營收金流導入玉山",
        "70%，全年約11,995萬元"
      ],
      [
        "薪轉合作",
        "32人（既有門市64人的一半）"
      ]
    ],
    "health": {
      "cash": 6170.946805124004,
      "receipts": 222.74419999999998,
      "stock": 99.96,
      "shortDebt": 1587.6876664638162,
      "totalDebt": 3427.987989654589,
      "assets": 12993.651005124004,
      "sales": 17136,
      "profit": 5068.216,
      "annualAvailable": 2317.3756278148944,
      "annualDebt": 634.9444112928842
    },
    "services": [
      "loan",
      "cardAcquiring",
      "payroll",
      "accountOpening",
      "deposit"
    ],
    "note": "【小愷央廚｜測試案例】投資8,000萬元，企業現金投入3,000萬元，其他股東增資2,000萬元，規劃新增融資3,000萬元。主要目的為食安控管與產品品質一致。既有8店合併年營收17,136萬元，試算次年可償債現金約2,317萬元、貸款年本息約635萬元。營收金流70%與門市員工32人薪轉願配合玉山；投資後公司存款及薪轉員工薪資全數留存玉山；冷凍包與加盟新增營收未納入。",
    "routing": "依臺北市中山區營業地址與3,000萬元融資需求推薦服務區域，由主管確認承接。",
    "insight": "既有8店合併現金流可支應央廚貸款；本情境用來展示融資、金流與薪轉的一站式帶入及後台派任。",
    "ask": "展示融資3,000萬元、合併營運健檢10項完整數字、70%收款導入與32名員工薪轉，並產生示範諮詢摘要。",
    "payrollEmployees": 32,
    "annualReceipts": 11995.2,
    "valueAssumptions": {
      "collectionShare": 70,
      "feeShare": 70,
      "merchantRate": 4.5,
      "bankShare": 50,
      "depositDays": 30,
      "depositYield": 0.5,
      "salary": 3.75,
      "savingShare": 100,
      "employeeYield": 0.5,
      "utilization": 100,
      "loanRate": 2,
      "loanRateHigh": 2.5
    }
  }
];

for (const item of DEMO_CASES) { if(item.input.operating) item.health=calculateOperating(item.input).extra.operating.health; }
