# 尺码顾问 · Size Advisor

服饰电商退货率头号杀手是尺码不合。这个工具用身高体重等基础数据
推荐上装 / 裤装 / 鞋码，并给出国际尺码换算，降低「买错码」的概率。

## 推荐逻辑（`size-engine.js`，纯逻辑层，Node/浏览器通用）

1. **BMI 分桶**：偏瘦 / 标准 / 偏胖 / 肥胖四档
2. **身高段基准表**：男女各 7 个身高段 × 4 档 BMI → 基础尺码
3. **版型偏好修正**：修身降档、宽松升档
4. **裤装**：身高体重估算腰围 → 牛仔裤英寸码 + 字母码
5. **鞋码**：脚长（mm）→ EU / US / UK / JP 四制换算
6. **置信度评分**：BMI 越偏离标准区间置信度越低，提示用户实测

## 输出示例

```js
SizeEngine.recommend({ gender: "male", height: 172, weight: 65, footMm: 260, fit: "regular" })
// => { top: "M", topIntl: {US:"M",EU:"48",UK:"38",CN:"170/88A"},
//      pants: { inch: 32, letter: "L" }, shoes: { EU:"41",US:"8",UK:"7.5",JP:"26.0" },
//      bmi: 22, bmiLabel: "标准", confidence: 94, notes: [...] }
```

## 运行

浏览器直接打开 `index.html`；引擎也可在 Node 中 `require("./size-engine.js")` 使用。

## License

MIT
