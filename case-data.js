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
    "contact": "陳店長（假名）",
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
    "payrollEmployees": 9
  },
  {
    "id": "04",
    "model": "equipment",
    "title": "小愷央廚",
    "shortName": "小愷央廚",
    "company": "小愷央廚（虛構案例）",
    "businessType": "中央廚房／食品製造",
    "rm": "",
    "city": "新北市",
    "district": "五股區",
    "address": "新北市五股區五工路88號（示範門牌）",
    "contact": "店長（假名）",
    "brand": "小愷央廚（虛構）",
    "stores": 1,
    "month": "2027-03",
    "time": "平日下午",
    "story": "中央廚房希望提升製程與冷鏈產能，設備及場地改善總投入1,200萬元，自有資金400萬元，融資800萬元。假設5年期、年利率2.5%，不設本金寬限，每年可支應本案本息240萬元。",
    "input": {
      "invest": 1200,
      "equity": 400,
      "interest": 2.5,
      "tenor": 5,
      "grace": 0,
      "annualBudget": 240
    },
    "fields": [
      [
        "設備及場地改善",
        "1,200萬元"
      ],
      [
        "自有資金",
        "400萬元"
      ],
      [
        "融資需求",
        "800萬元"
      ],
      [
        "假設年利率／年期",
        "2.5%／5年"
      ],
      [
        "本金寬限期",
        "0年"
      ],
      [
        "每年可支付本案本息",
        "240萬元"
      ]
    ],
    "health": {
      "cash": null,
      "receipts": null,
      "stock": null,
      "shortDebt": null,
      "totalDebt": null,
      "assets": null,
      "sales": null,
      "profit": null,
      "annualAvailable": 240,
      "annualDebt": 180
    },
    "services": [
      "loan"
    ],
    "note": "【小愷央廚】設備及場地改善總投入1,200萬元、自有400萬元、融資800萬元。假設年利率2.5%、5年，年繳等額本金且無寬限期。首年本息180萬元，每年可支應240萬元。健檢僅示範本案還款現金與本息，其他公司財務未提供；地址為示範門牌。",
    "routing": "依營業地址與800萬元資金需求推薦分行或區域中心，由主管確認承接。",
    "insight": "首年本金160萬元、利息20萬元；後續利息隨本金下降。未填的公司財務不補零，也不當成整體健康。",
    "ask": "確認設備報價、驗收、付款期程與投產後接單能力；本例不假設已取得銀行核准。",
    "payrollEmployees": null
  }
];
