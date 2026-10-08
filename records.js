const tableBody =
  document.getElementById("recordsTableBody");

const searchInput =
  document.getElementById("searchInput");

const userFilter =
  document.getElementById("userFilter");

const shopFilter =
  document.getElementById("shopFilter");

const dateFilter =
  document.getElementById("dateFilter");

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
// 篩選事件
// =========================

searchInput.addEventListener(
  "input",
  displayRecords
);

userFilter.addEventListener(
  "change",
  displayRecords
);

shopFilter.addEventListener(
  "change",
  displayRecords
);

dateFilter.addEventListener(
  "change",
  displayRecords
);


clearFilterBtn.addEventListener(
  "click",
  function () {

    searchInput.value = "";
    userFilter.value = "";
    shopFilter.value = "";
    dateFilter.value = "";

    displayRecords();

  }
);


// =========================
// 更新篩選選單
// =========================

function refreshFilters() {

  const currentUser =
    userFilter.value;

  const currentShop =
    shopFilter.value;


  userFilter.innerHTML = `
    <option value="">
      全部使用者
    </option>
  `;


  shopFilter.innerHTML = `
    <option value="">
      全部店家
    </option>
  `;


  const users =
    [...new Set(
      records.map(
        record => record.user
      )
    )].sort();


  const shops =
    [...new Set(
      records.map(
        record => record.shop
      )
    )].sort();


  users.forEach(function (user) {

    const option =
      document.createElement("option");

    option.value = user;
    option.textContent = user;

    userFilter.appendChild(option);

  });


  shops.forEach(function (shop) {

    const option =
      document.createElement("option");

    option.value = shop;
    option.textContent = shop;

    shopFilter.appendChild(option);

  });


  if (
    [...userFilter.options]
      .some(
        option =>
          option.value === currentUser
      )
  ) {

    userFilter.value =
      currentUser;

  }


  if (
    [...shopFilter.options]
      .some(
        option =>
          option.value === currentShop
      )
  ) {

    shopFilter.value =
      currentShop;

  }

}


// =========================
// 顯示紀錄
// =========================

function displayRecords() {

  tableBody.innerHTML = "";


  const keyword =
    searchInput.value
      .trim()
      .toLowerCase();

  const selectedUser =
    userFilter.value;

  const selectedShop =
    shopFilter.value;

  const selectedDate =
    dateFilter.value;


  let filteredRecords =
    records.filter(
      function (record) {

        return (
          (
            !keyword ||
            record.drink
              .toLowerCase()
              .includes(keyword)
          )
          &&
          (
            !selectedUser ||
            record.user === selectedUser
          )
          &&
          (
            !selectedShop ||
            record.shop === selectedShop
          )
          &&
          (
            !selectedDate ||
            record.date === selectedDate
          )
        );

      }
    );


  filteredRecords.sort(
    function (a, b) {

      const dateCompare =
        new Date(b.date)
        -
        new Date(a.date);


      if (dateCompare !== 0) {

        return dateCompare;

      }


      return b.id - a.id;

    }
  );


  if (
    filteredRecords.length === 0
  ) {

    tableBody.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="empty-table"
        >
          沒有符合條件的紀錄
        </td>
      </tr>
    `;

    return;

  }


  filteredRecords.forEach(
    function (record) {

      if (
        record.id === editingId
      ) {

        renderEditRow(record);

      } else {

        renderNormalRow(record);

      }

    }
  );

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