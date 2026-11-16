// 尺码顾问 UI 逻辑
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);

  const state = { gender: "male", height: 172, weight: 65, footMm: 0, fit: "regular" };

  function recalc() {
    const r = SizeEngine.recommend(state);

    // BMI
    $("#bmiBox").innerHTML = `
      <div><div class="bmi-num">${r.bmi}</div><small style="color:var(--muted)">BMI</small></div>
      <span class="bmi-label b${["0","1","2","3"][["偏瘦","标准","偏胖","肥胖"].indexOf(r.bmiLabel)]}">${r.bmiLabel}</span>`;

    // 上装
    $("#topSize").textContent = r.top;
    $("#confidence").textContent = `置信度 ${r.confidence}%`;
    $("#intlGrid").innerHTML = Object.entries(r.topIntl).map(([k, v]) =>
      `<div class="intl-cell"><b>${k}</b><span>${v}</span></div>`).join("");

    // 裤装
    $("#pantsRow").innerHTML = `
      <div class="pants-cell"><b>腰围（估算）</b><span>${r.waist} cm</span></div>
      <div class="pants-cell"><b>牛仔裤码</b><span>${r.pants.inch}</span></div>
      <div class="pants-cell"><b>字母码</b><span>${r.pants.letter}</span></div>`;
    $("#waistNote").textContent = "腰围为身高体重估算值，有软尺实测会更准。";

    // 鞋码
    if (r.shoes) {
      $("#shoeCard").hidden = false;
      $("#shoeGrid").innerHTML = Object.entries(r.shoes).map(([k, v]) =>
        `<div class="shoe-cell"><b>${k}</b><span>${v}</span></div>`).join("");
    } else {
      $("#shoeCard").hidden = true;
    }

    // 建议
    $("#tipsList").innerHTML = (r.notes.length ? r.notes : ["尺码处于标准区间，按常规购买即可"])
      .map(n => `<li>${n}</li>`).join("");
  }

  // 事件
  $("#genderRow").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-g]");
    if (!btn) return;
    state.gender = btn.dataset.g;
    document.querySelectorAll(".g-btn").forEach(b => b.classList.toggle("active", b === btn));
    recalc();
  });
  $("#fitRow").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fit]");
    if (!btn) return;
    state.fit = btn.dataset.fit;
    document.querySelectorAll(".fit-btn").forEach(b => b.classList.toggle("active", b === btn));
    recalc();
  });

  $("#height").addEventListener("input", (e) => { state.height = +e.target.value; $("#hOut").textContent = state.height; recalc(); });
  $("#weight").addEventListener("input", (e) => { state.weight = +e.target.value; $("#wOut").textContent = state.weight; recalc(); });
  $("#foot").addEventListener("input", (e) => {
    state.footMm = +e.target.value;
    $("#fOut").textContent = state.footMm ? state.footMm + " mm" : "--";
    recalc();
  });

  recalc();
})();
