const totalDrinks =
  document.getElementById("totalDrinks");

const monthDrinks =
  document.getElementById("monthDrinks");

const userStats =
  document.getElementById("userStats");

const shopRanking =
  document.getElementById("shopRanking");

const drinkRanking =
  document.getElementById("drinkRanking");


let records = [];


init();


async function init() {

  const { data, error } =
    await supabaseClient
      .from("drink_records")
      .select("*");


  if (error) {

    console.error(error);

    alert("讀取統計資料失敗");

    return;

  }


  records =
    data.map(function (item) {

      return {

        id: item.id,

        user: item.user_name,

        shop: item.shop_name,

        drink: item.drink_name,

        date: item.drank_at

      };

    });


  displayStats();

}


// =========================
// 顯示統計
// =========================

function displayStats() {

  displayTotal();

  displayThisMonth();

  displayUserStats();

  displayShopRanking();

  displayDrinkRanking();

}


// =========================
// 總數
// =========================

function displayTotal() {

  totalDrinks.textContent =
    records.length;

}


// =========================
// 本月
// =========================

function displayThisMonth() {

  const now =
    new Date();

  const currentYear =
    now.getFullYear();

  const currentMonth =
    now.getMonth() + 1;


  const count =
    records.filter(
      function (record) {

        const parts =
          record.date.split("-");

        return (
          Number(parts[0])
            === currentYear
          &&
          Number(parts[1])
            === currentMonth
        );

      }
    ).length;


  monthDrinks.textContent =
    count;

}


// =========================
// 使用者
// =========================

function displayUserStats() {

  userStats.innerHTML = "";

  const counts = {};


  records.forEach(function (record) {

    counts[record.user] =
      (counts[record.user] || 0)
      + 1;

  });


  const users =
    Object.entries(counts)
      .sort(
        (a, b) =>
          b[1] - a[1]
      );


  if (users.length === 0) {

    userStats.innerHTML = `
      <div class="stats-empty">
        還沒有飲料紀錄
      </div>
    `;

    return;

  }


  users.forEach(
    function ([user, count]) {

      const card =
        document.createElement("div");

      card.className =
        "user-stat-card";


      card.innerHTML = `

        <div class="user-name">
          ${escapeHTML(user)}
        </div>

        <div class="user-count">
          ${count}
          <span>杯</span>
        </div>

      `;


      userStats.appendChild(card);

    }
  );

}


// =========================
// 店家排行
// =========================

function displayShopRanking() {

  renderRanking(
    shopRanking,
    createRanking(
      records.map(
        record => record.shop
      )
    )
  );

}


// =========================
// 飲料排行
// =========================

function displayDrinkRanking() {

  renderRanking(
    drinkRanking,
    createRanking(
      records.map(
        record => record.drink
      )
    )
  );

}


// =========================
// 建立排行
// =========================

function createRanking(items) {

  const counts = {};


  items.forEach(function (item) {

    counts[item] =
      (counts[item] || 0)
      + 1;

  });


  return Object.entries(counts)
    .sort(
      (a, b) =>
        b[1] - a[1]
    )
    .slice(0, 5);

}


// =========================
// 顯示排行
// =========================

function renderRanking(
  container,
  ranking
) {

  container.innerHTML = "";


  if (ranking.length === 0) {

    container.innerHTML = `
      <div class="stats-empty">
        還沒有資料
      </div>
    `;

    return;

  }


  ranking.forEach(
    function (
      [name, count],
      index
    ) {

      const item =
        document.createElement("div");

      item.className =
        "ranking-item";


      item.innerHTML = `

        <div class="ranking-left">

          <div class="ranking-number">
            ${index + 1}
          </div>

          <div class="ranking-name">
            ${escapeHTML(name)}
          </div>

        </div>

        <div class="ranking-count">
          ${count} 杯
        </div>

      `;


      container.appendChild(item);

    }
  );

}


// =========================
// HTML 安全
// =========================

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text ?? "";

  return div.innerHTML;

}