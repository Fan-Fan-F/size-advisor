/**
 * SizeEngine — 智能尺码推荐引擎（纯逻辑）
 * 输入：性别/身高/体重/脚长/偏好 → 输出：上装/下装/鞋码推荐 + 国际尺码换算 + 置信度
 */
"use strict";

const SizeEngine = (() => {

  // 男装身体尺寸基准表（身高段 → 推荐尺码，配合 BMI 修正）
  const TOPS_TABLE = {
    male: [
      { hMax: 163, sizes: ["XS", "S", "S", "M"] },
      { hMax: 168, sizes: ["S", "S", "M", "L"] },
      { hMax: 173, sizes: ["S", "M", "L", "XL"] },
      { hMax: 178, sizes: ["M", "L", "XL", "2XL"] },
      { hMax: 183, sizes: ["L", "XL", "2XL", "3XL"] },
      { hMax: 188, sizes: ["XL", "2XL", "3XL", "4XL"] },
      { hMax: 999, sizes: ["2XL", "3XL", "4XL", "5XL"] },
    ],
    female: [
      { hMax: 153, sizes: ["XS", "XS", "S", "M"] },
      { hMax: 158, sizes: ["XS", "S", "S", "M"] },
      { hMax: 163, sizes: ["S", "S", "M", "L"] },
      { hMax: 168, sizes: ["S", "M", "L", "XL"] },
      { hMax: 173, sizes: ["M", "L", "XL", "XL"] },
      { hMax: 999, sizes: ["L", "XL", "2XL", "3XL"] },
    ],
  };

  // BMI 分桶（决定选 sizes 数组里的哪一档）
  function bmiBand(bmi) {
    if (bmi < 18.5) return 0;   // 偏瘦
    if (bmi < 24) return 1;     // 标准
    if (bmi < 28) return 2;     // 偏胖
    return 3;                    // 肥胖
  }

  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

  // 国际尺码映射（上装）
  const INTL_TOPS = {
    XS:  { US: "XS",  EU: "44", UK: "34", CN: "160/80A" },
    S:   { US: "S",   EU: "46", UK: "36", CN: "165/84A" },
    M:   { US: "M",   EU: "48", UK: "38", CN: "170/88A" },
    L:   { US: "L",   EU: "50", UK: "40", CN: "175/92A" },
    XL:  { US: "XL",  EU: "52", UK: "42", CN: "180/96A" },
    "2XL": { US: "2XL", EU: "54", UK: "44", CN: "185/100A" },
    "3XL": { US: "3XL", EU: "56", UK: "46", CN: "190/104A" },
    "4XL": { US: "4XL", EU: "58", UK: "48", CN: "195/108A" },
    "5XL": { US: "5XL", EU: "60", UK: "50", CN: "200/112A" },
  };

  // 腰围（cm）→ 裤码（英寸）与字母码
  function pantsSize(waistCm) {
    const inch = Math.round(waistCm / 2.54);
    const letter = waistCm < 68 ? "XS" : waistCm < 74 ? "S" : waistCm < 80 ? "M"
      : waistCm < 87 ? "L" : waistCm < 94 ? "XL" : waistCm < 102 ? "2XL" : "3XL";
    return { inch, letter };
  }

  // 脚长（mm）→ 各国鞋码
  function shoeSize(footMm, gender) {
    const cm = footMm / 10;
    const eu = Math.round(cm * 1.5 + 2);           // 欧码近似
    const us = gender === "female" ? eu - 31.5 : eu - 33; // 美码近似
    const uk = us - 0.5;
    return {
      EU: String(eu),
      US: (Math.round(us * 2) / 2).toString(),
      UK: (Math.round(uk * 2) / 2).toString(),
      JP: cm.toFixed(1),
    };
  }

  // 由身高体重估算腰围（粗略模型，仅演示）
  function estimateWaist(heightCm, weightKg, gender) {
    const base = gender === "female" ? 0.42 : 0.47;
    const bmiAdj = (weightKg / ((heightCm / 100) ** 2) - 21) * 1.6;
    return Math.round(heightCm * base + bmiAdj);
  }

  /**
   * 主推荐函数
   * input: { gender, height, weight, footMm, fit: "slim"|"regular"|"loose" }
   */
  function recommend({ gender = "male", height, weight, footMm, fit = "regular" }) {
    if (!height || !weight) throw new Error("身高与体重必填");
    const bmi = weight / ((height / 100) ** 2);
    const band = bmiBand(bmi);

    const table = TOPS_TABLE[gender];
    const row = table.find(r => height <= r.hMax);
    let sizeIdx = SIZE_ORDER.indexOf(row.sizes[band]);

    // 版型偏好修正
    if (fit === "slim") sizeIdx = Math.max(0, sizeIdx - (band >= 2 ? 0 : 1));
    if (fit === "loose") sizeIdx += 1;
    sizeIdx = Math.min(SIZE_ORDER.length - 1, sizeIdx);

    const top = SIZE_ORDER[sizeIdx];
    const waist = estimateWaist(height, weight, gender);
    const pants = pantsSize(waist);
    const shoes = footMm ? shoeSize(footMm, gender) : null;

    // 置信度：BMI 越极端越低
    const confidence = Math.round(96 - Math.abs(bmi - 21.5) * 4);

    return {
      bmi: +bmi.toFixed(1),
      bmiLabel: ["偏瘦", "标准", "偏胖", "肥胖"][band],
      top,
      topIntl: INTL_TOPS[top],
      pants,
      shoes,
      waist,
      confidence: Math.max(60, confidence),
      notes: buildNotes(bmi, fit, band),
    };
  }

  function buildNotes(bmi, fit, band) {
    const notes = [];
    if (band === 0) notes.push("体型偏瘦，修身款更显利落");
    if (band === 2) notes.push("建议选常规或微宽松版型，避免紧绷");
    if (band === 3) notes.push("优先选宽松版型与深色系，面料选挺括不贴身的");
    if (fit === "oversize") notes.push("已按偏好上调一码");
    if (bmi > 27) notes.push("裤装建议选松紧腰或带弹面料");
    return notes;
  }

  return { recommend, shoeSize, pantsSize, estimateWaist, SIZE_ORDER, INTL_TOPS };
})();

// Node 兼容
if (typeof module !== "undefined") module.exports = SizeEngine;
