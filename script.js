const form = document.getElementById("drinkForm");
const dateInput = document.getElementById("date");

const shopSelect = document.getElementById("shop");
const drinkSelect = document.getElementById("drink");

const addShopBtn = document.getElementById("addShopBtn");
const addDrinkBtn = document.getElementById("addDrinkBtn");

const deleteShopBtn = document.getElementById("deleteShopBtn");
const deleteDrinkBtn = document.getElementById("deleteDrinkBtn");


// 預設日期
dateInput.valueAsDate = new Date();


// 頁面載入
init();

async function init() {
  await loadShopOptions();
}


// =========================
// 載入店家
// =========================

async function loadShopOptions() {

  const { data, error } =
    await supabaseClient
      .from("shop_drinks")
      .select("shop_name")
      .order("shop_name");


  if (error) {

    console.error(error);

    alert("讀取店家失敗");

    return;
  }


  const shops =
    [...new Set(
      data.map(item => item.shop_name)
    )];


  shopSelect.innerHTML = `
    <option value="">
      請選擇店家
    </option>
  `;


  shops.forEach(function (shop) {

    const option =
      document.createElement("option");

    option.value = shop;
    option.textContent = shop;

    shopSelect.appendChild(option);

  });

}


// =========================
// 店家改變 → 載入飲料
// =========================

shopSelect.addEventListener(
  "change",
  async function () {

    await loadDrinkOptions();

  }
);


async function loadDrinkOptions(
  selectedDrink = ""
) {

  const selectedShop =
    shopSelect.value;


  drinkSelect.innerHTML = "";


  if (!selectedShop) {

    drinkSelect.disabled = true;

    drinkSelect.innerHTML = `
      <option value="">
        請先選擇店家
      </option>
    `;

    return;
  }


  const { data, error } =
    await supabaseClient
      .from("shop_drinks")
      .select("drink_name")
      .eq("shop_name", selectedShop)
      .order("drink_name");


  if (error) {

    console.error(error);

    alert("讀取飲料失敗");

    return;
  }


  drinkSelect.disabled = false;


  drinkSelect.innerHTML = `
    <option value="">
      請選擇飲料
    </option>
  `;


  data.forEach(function (item) {

    const option =
      document.createElement("option");

    option.value = item.drink_name;
    option.textContent = item.drink_name;


    if (
      item.drink_name === selectedDrink
    ) {

      option.selected = true;

    }


    drinkSelect.appendChild(option);

  });

}


// =========================
// 新增店家
// =========================

addShopBtn.addEventListener(
    "click",
    async function () {
  
      const newShop =
        prompt("請輸入店家名稱");
  
      if (newShop === null) {
        return;
      }
  
      const cleanShop =
        newShop.trim();
  
      if (!cleanShop) {
  
        alert("店家名稱不能是空白");
  
        return;
      }
  
  
      // 因為目前 shop_drinks 表
      // 一定需要同時有 shop_name + drink_name
      // 所以新增店家時一起新增第一個飲料
  
      const newDrink =
        prompt(
          `請輸入「${cleanShop}」的第一個飲料品項`
        );
  
      if (newDrink === null) {
        return;
      }
  
      const cleanDrink =
        newDrink.trim();
  
      if (!cleanDrink) {
  
        alert("飲料名稱不能是空白");
  
        return;
      }
  
  
      try {
  
        const { data, error } =
          await supabaseClient
            .from("shop_drinks")
            .insert([
              {
                shop_name: cleanShop,
                drink_name: cleanDrink
              }
            ])
            .select();
  
  
        if (error) {
  
          console.error(
            "新增店家 Supabase error:",
            error
          );
  
  
          if (error.code === "23505") {
  
            alert(
              "這個店家與飲料已經存在"
            );
  
          } else {
  
            alert(
              "新增失敗：" +
              error.message
            );
  
          }
  
          return;
        }
  
  
        console.log(
          "新增成功：",
          data
        );
  
  
        // 重新讀取店家
        await loadShopOptions();
  
  
        // 自動選到剛新增的店家
        shopSelect.value =
          cleanShop;
  
  
        // 載入飲料並自動選取
        await loadDrinkOptions(
          cleanDrink
        );
  
  
        alert(
          `已新增：${cleanShop} - ${cleanDrink}`
        );
  
  
      } catch (error) {
  
        console.error(
          "新增店家發生錯誤：",
          error
        );
  
        alert(
          "新增失敗，請查看 Console"
        );
  
      }
  
    }
  );


// =========================
// 新增飲料
// =========================

addDrinkBtn.addEventListener(
  "click",
  async function () {

    const selectedShop =
      shopSelect.value;


    if (!selectedShop) {

      alert("請先選擇店家");

      return;
    }


    const newDrink =
      prompt(
        `請輸入「${selectedShop}」的飲料名稱`
      );


    if (!newDrink) {
      return;
    }


    const cleanDrink =
      newDrink.trim();


    if (!cleanDrink) {
      return;
    }


    const { error } =
      await supabaseClient
        .from("shop_drinks")
        .insert([
          {
            shop_name: selectedShop,
            drink_name: cleanDrink
          }
        ]);


    if (error) {

      if (
        error.code === "23505"
      ) {

        alert("這個飲料已經存在");

      } else {

        console.error(error);

        alert("新增飲料失敗");

      }

      return;
    }


    await loadDrinkOptions(
      cleanDrink
    );

});


// =========================
// 刪除店家
// =========================

deleteShopBtn.addEventListener(
  "click",
  async function () {

    const selectedShop =
      shopSelect.value;


    if (!selectedShop) {

      alert("請先選擇店家");

      return;
    }


    const confirmed =
      confirm(
        `確定要刪除「${selectedShop}」嗎？\n\n這個店家的飲料品項會一起移除。\n歷史紀錄不會被刪除。`
      );


    if (!confirmed) {
      return;
    }


    const { error } =
      await supabaseClient
        .from("shop_drinks")
        .delete()
        .eq(
          "shop_name",
          selectedShop
        );


    if (error) {

      console.error(error);

      alert("刪除店家失敗");

      return;
    }


    await loadShopOptions();


    drinkSelect.disabled = true;

    drinkSelect.innerHTML = `
      <option value="">
        請先選擇店家
      </option>
    `;

});


// =========================
// 刪除飲料
// =========================

deleteDrinkBtn.addEventListener(
  "click",
  async function () {

    const selectedShop =
      shopSelect.value;

    const selectedDrink =
      drinkSelect.value;


    if (!selectedShop) {

      alert("請先選擇店家");

      return;
    }


    if (!selectedDrink) {

      alert("請先選擇飲料");

      return;
    }


    const confirmed =
      confirm(
        `確定要刪除「${selectedDrink}」嗎？\n\n歷史紀錄不會被刪除。`
      );


    if (!confirmed) {
      return;
    }


    const { error } =
      await supabaseClient
        .from("shop_drinks")
        .delete()
        .eq(
          "shop_name",
          selectedShop
        )
        .eq(
          "drink_name",
          selectedDrink
        );


    if (error) {

      console.error(error);

      alert("刪除飲料失敗");

      return;
    }


    await loadDrinkOptions();

});


// =========================
// 新增飲用紀錄
// =========================

form.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    const user =
      document.getElementById("user").value;

    const shop =
      shopSelect.value;

    const drink =
      drinkSelect.value;

    const date =
      dateInput.value;


    if (
      !user ||
      !shop ||
      !drink ||
      !date
    ) {

      alert("請完整填寫資料");

      return;
    }


    const { error } =
      await supabaseClient
        .from("drink_records")
        .insert([
          {
            user_name: user,
            shop_name: shop,
            drink_name: drink,
            drank_at: date
          }
        ]);


    if (error) {

      console.error(error);

      alert("新增紀錄失敗");

      return;
    }


    alert("已新增飲料紀錄");


    form.reset();


    dateInput.valueAsDate =
      new Date();


    drinkSelect.disabled = true;

    drinkSelect.innerHTML = `
      <option value="">
        請先選擇店家
      </option>
    `;

});