const tableBody =
  document.getElementById("recordsTableBody");

const drinkFilter = document.getElementById("drinkFilter");
const userFilter = document.getElementById("userFilter");
const shopFilter = document.getElementById("shopFilter");
const yearFilter = document.getElementById("yearFilter");
const monthFilter = document.getElementById("monthFilter");
const sortFilter = document.getElementById("sortFilter");

const clearFilterBtn =
  document.getElementById("clearFilterBtn");


let records = [];

let shopDrinks = {};

let editingId = null;


// 初始化
init();


async function init() {

  await loadShopDrinks();

  await loadRecords();

}


// =========================
// 載入店家 / 飲料
// =========================

async function loadShopDrinks() {

  const { data, error } =
    await supabaseClient
      .from("shop_drinks")
      .select("*")
      .order("shop_name")
      .order("drink_name");


  if (error) {

    console.error(error);

    return;

  }


  shopDrinks = {};


  data.forEach(function (item) {

    if (!shopDrinks[item.shop_name]) {

      shopDrinks[item.shop_name] = [];

    }


    shopDrinks[item.shop_name]
      .push(item.drink_name);

  });

}


// =========================
// 載入紀錄
// =========================

async function loadRecords() {

  const { data, error } =
    await supabaseClient
      .from("drink_records")
      .select("*")
      .order("drank_at", {
        ascending: false
      })
      .order("id", {
        ascending: false
      });


  if (error) {

    console.error(error);

    alert("讀取紀錄失敗");

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


  refreshFilters();

  displayRecords();

}


// =========================
// 篩選與排序
// =========================
userFilter.addEventListener("change", displayRecords);
shopFilter.addEventListener("change", () => {
  refreshDrinkFilter(false);
  displayRecords();
});
drinkFilter.addEventListener("change", displayRecords);
yearFilter.addEventListener("change", displayRecords);
monthFilter.addEventListener("change", displayRecords);
sortFilter.addEventListener("change", displayRecords);

clearFilterBtn.addEventListener("click", () => {
  userFilter.value = "";
  shopFilter.value = "";
  yearFilter.value = "";
  monthFilter.value = "";
  sortFilter.value = "newest";
  refreshDrinkFilter(false);
  displayRecords();
});

function setOptions(select, values, label, previous = "") {
  select.replaceChildren(new Option(label, ""));
  values.forEach(value => select.add(new Option(String(value), String(value))));
  select.value = values.map(String).includes(String(previous)) ? String(previous) : "";
}

function refreshDrinkFilter(keepSelection = true) {
  const previous = keepSelection ? drinkFilter.value : "";
  const shop = shopFilter.value;
  const names = shop
    ? (shopDrinks[shop] || [])
    : Object.values(shopDrinks).flat();
  // Keep historic drinks available even if removed from the shop menu.
  const historic = records
    .filter(record => !shop || record.shop === shop)
    .map(record => record.drink);
  const values = [...new Set([...names, ...historic].filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));
  setOptions(drinkFilter, values, "全部飲料", previous);
}

function refreshFilters() {
  const users = [...new Set(records.map(r => r.user).filter(Boolean))].sort();
  const shops = [...new Set([
    ...Object.keys(shopDrinks),
    ...records.map(r => r.shop)
  ].filter(Boolean))].sort();
  const years = [...new Set(records.map(r => String(r.date || "").slice(0, 4))
    .filter(y => /^\\d{4}$/.test(y)))].sort((a, b) => b.localeCompare(a));
  const months = Array.from({length: 12}, (_, i) => String(i + 1));
  setOptions(userFilter, users, "全部使用者", userFilter.value);
  setOptions(shopFilter, shops, "全部店家", shopFilter.value);
  setOptions(yearFilter, years, "全部年份", yearFilter.value);
  setOptions(monthFilter, months, "全部月份", monthFilter.value);
  [...monthFilter.options].slice(1).forEach(o => { o.textContent = `${o.value} 月`; });
  refreshDrinkFilter(true);
}

function displayRecords() {
  tableBody.innerHTML = "";
  const filteredRecords = records.filter(record => {
    const date = String(record.date || "").slice(0, 10);
    const [year, month] = date.split("-");
    return (!userFilter.value || record.user === userFilter.value)
      && (!shopFilter.value || record.shop === shopFilter.value)
      && (!drinkFilter.value || record.drink === drinkFilter.value)
      && (!yearFilter.value || year === yearFilter.value)
      && (!monthFilter.value || Number(month) === Number(monthFilter.value));
  });
  const ascending = sortFilter.value === "oldest";
  filteredRecords.sort((a, b) => {
    const dateOrder = String(a.date).localeCompare(String(b.date));
    if (dateOrder) return ascending ? dateOrder : -dateOrder;
    const idOrder = Number(a.id) - Number(b.id);
    return ascending ? idOrder : -idOrder;
  });
  if (!filteredRecords.length) {
    tableBody.innerHTML = '<tr><td colspan="5" class="empty-table">沒有符合條件的紀錄</td></tr>';
    return;
  }
  filteredRecords.forEach(record => {
    if (record.id === editingId) renderEditRow(record);
    else renderNormalRow(record);
  });
}

// =========================
// 一般列
// =========================

function renderNormalRow(record) {

  const row =
    document.createElement("tr");


  row.innerHTML = `

    <td class="date-cell">
      ${formatDate(record.date)}
    </td>

    <td>
      <div class="table-pill who-pill">
        ${escapeHTML(record.user)}
      </div>
    </td>

    <td>
      <div class="table-pill">
        ${escapeHTML(record.shop)}
      </div>
    </td>

    <td>
      <div class="table-pill">
        ${escapeHTML(record.drink)}
      </div>
    </td>

    <td class="action-cell">

      <button
        class="edit-record-btn"
        onclick="startEdit(${record.id})"
      >
        編輯
      </button>

      <button
        class="table-delete-btn"
        onclick="deleteRecord(${record.id})"
      >
        ×
      </button>

    </td>

  `;


  tableBody.appendChild(row);

}


// =========================
// 開始編輯
// =========================

function startEdit(id) {

  editingId = id;

  displayRecords();

}


// =========================
// 取消編輯
// =========================

function cancelEdit() {

  editingId = null;

  displayRecords();

}


// =========================
// 編輯列
// =========================

function renderEditRow(record) {

  const row =
    document.createElement("tr");


  const users =
    [...new Set(
      records.map(
        item => item.user
      )
    )];


  if (
    !users.includes(record.user)
  ) {

    users.push(record.user);

  }


  let userOptions = "";

  users.forEach(function (user) {

    userOptions += `
      <option
        value="${escapeAttribute(user)}"
        ${
          user === record.user
            ? "selected"
            : ""
        }
      >
        ${escapeHTML(user)}
      </option>
    `;

  });


  const shops =
    Object.keys(shopDrinks);


  if (
    !shops.includes(record.shop)
  ) {

    shops.push(record.shop);

  }


  let shopOptions = "";

  shops.forEach(function (shop) {

    shopOptions += `
      <option
        value="${escapeAttribute(shop)}"
        ${
          shop === record.shop
            ? "selected"
            : ""
        }
      >
        ${escapeHTML(shop)}
      </option>
    `;

  });


  row.innerHTML = `

    <td>

      <input
        type="date"
        id="editDate-${record.id}"
        class="edit-table-input"
        value="${record.date}"
      >

    </td>

    <td>

      <select
        id="editUser-${record.id}"
        class="edit-table-input"
      >
        ${userOptions}
      </select>

    </td>

    <td>

      <select
        id="editShop-${record.id}"
        class="edit-table-input"
        onchange="updateEditDrinks(${record.id})"
      >
        ${shopOptions}
      </select>

    </td>

    <td>

      <select
        id="editDrink-${record.id}"
        class="edit-table-input"
      >
      </select>

    </td>

    <td class="action-cell">

      <button
        class="save-edit-btn"
        onclick="saveEdit(${record.id})"
      >
        儲存
      </button>

      <button
        class="cancel-edit-btn"
        onclick="cancelEdit()"
      >
        取消
      </button>

    </td>

  `;


  tableBody.appendChild(row);


  updateEditDrinks(
    record.id,
    record.drink
  );

}


// =========================
// 編輯時店家 → 飲料
// =========================

function updateEditDrinks(
  id,
  currentDrink = ""
) {

  const shopSelect =
    document.getElementById(
      `editShop-${id}`
    );

  const drinkSelect =
    document.getElementById(
      `editDrink-${id}`
    );


  if (
    !shopSelect ||
    !drinkSelect
  ) {

    return;

  }


  const selectedShop =
    shopSelect.value;


  let drinks =
    shopDrinks[selectedShop]
    || [];


  if (
    currentDrink &&
    !drinks.includes(currentDrink)
  ) {

    drinks =
      [...drinks, currentDrink];

  }


  drinkSelect.innerHTML = "";


  drinks.forEach(function (drink) {

    const option =
      document.createElement("option");

    option.value = drink;
    option.textContent = drink;


    if (
      drink === currentDrink
    ) {

      option.selected = true;

    }


    drinkSelect.appendChild(option);

  });

}


// =========================
// 儲存編輯
// =========================

async function saveEdit(id) {

  const date =
    document.getElementById(
      `editDate-${id}`
    ).value;

  const user =
    document.getElementById(
      `editUser-${id}`
    ).value;

  const shop =
    document.getElementById(
      `editShop-${id}`
    ).value;

  const drink =
    document.getElementById(
      `editDrink-${id}`
    ).value;


  if (
    !date ||
    !user ||
    !shop ||
    !drink
  ) {

    alert("請完整填寫資料");

    return;

  }


  const { error } =
    await supabaseClient
      .from("drink_records")
      .update({
        user_name: user,
        shop_name: shop,
        drink_name: drink,
        drank_at: date
      })
      .eq("id", id);


  if (error) {

    console.error(error);

    alert("修改失敗");

    return;

  }


  editingId = null;


  await loadRecords();

}


// =========================
// 刪除紀錄
// =========================

async function deleteRecord(id) {

  const confirmed =
    confirm(
      "確定要刪除這筆紀錄嗎？"
    );


  if (!confirmed) {
    return;
  }


  const { error } =
    await supabaseClient
      .from("drink_records")
      .delete()
      .eq("id", id);


  if (error) {

    console.error(error);

    alert("刪除失敗");

    return;

  }


  await loadRecords();

}


// =========================
// 日期
// =========================

function formatDate(dateString) {

  const parts =
    dateString.split("-");


  return (
    Number(parts[1])
    +
    "/"
    +
    Number(parts[2])
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


function escapeAttribute(text) {

  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

}