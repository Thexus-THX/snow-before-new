import { readFileSync, writeFileSync, readdirSync } from "fs";

const d = readFileSync("src/content/game-data.json", "utf8");

// 角色立绘文件名映射（从 public/assets/characters/ 目录扫描）
const charFiles = readdirSync("public/assets/characters")
  .filter(f => f.endsWith("_transparent.png"))
  .reduce((acc, f) => {
    acc[f] = true;
    return acc;
  }, {});

console.log("Available char files:", Object.keys(charFiles));

// 角色定义中的 portrait 映射
const portraitMap = {
  shen: {
    neutral: "char_shen_huaiyuan_neutral_transparent.png",
    focused: "char_shen_huaiyuan_focused_transparent.png",
    tired: "char_shen_huaiyuan_tired_transparent.png",
    hesitant: "char_shen_huaiyuan_hesitant_transparent.png",
    determined: "char_shen_huaiyuan_determined_transparent.png",
  },
  chen: {
    neutral: "char_chen_shaoheng_neutral_transparent.png",
    friendly: "char_chen_shaoheng_friendly_transparent.png",
    tense: "char_chen_shaoheng_tense_transparent.png",
    resolved: "char_chen_shaoheng_resolved_transparent.png",
  },
  nadya: {
    neutral: "char_nadya_neutral_transparent.png",
    warm: "char_nadya_warm_transparent.png",
    concerned: "char_nadya_concerned_transparent.png",
    farewell: "char_nadya_farewell_transparent.png",
  },
  belov: {
    neutral: "char_belov_neutral_transparent.png",
    approving: "char_belov_approving_transparent.png",
    disappointed: "char_belov_disappointed_transparent.png",
  },
  ivan: {
    neutral: "char_ivan_neutral_transparent.png",
    skeptical: "char_ivan_skeptical_transparent.png",
    approving: "char_ivan_approving_transparent.png",
  },
};

// 修复所有 /assets/characters/.png 引用
// 策略：解析 JSON，遍历 characters 定义和场景中的 portraitAsset
const data = JSON.parse(d);

// 1. 修复 characters 定义
for (const [charId, portraits] of Object.entries(portraitMap)) {
  if (data.characters[charId]) {
    for (const [key, filename] of Object.entries(portraits)) {
      data.characters[charId].portraits[key] = `/assets/characters/${filename}`;
    }
  }
}

// 2. 修复场景中的 portraitAsset
const scenePortraits = {
  d1_lab_intro: "/assets/characters/char_nadya_neutral_transparent.png",
  d1_reported_result: "/assets/characters/char_belov_approving_transparent.png",
  d1_team_repair_result: "/assets/characters/char_nadya_warm_transparent.png",
  d2_full_reinspect_result: "/assets/characters/char_ivan_approving_transparent.png",
  d2_risk_based_result: "/assets/characters/char_ivan_approving_transparent.png",
  d3_chen_night: "/assets/characters/char_chen_shaoheng_friendly_transparent.png",
  d4_k1_invitation: "/assets/characters/char_belov_approving_transparent.png",
  d5_c1_showcase: "/assets/characters/char_nadya_warm_transparent.png",
};

for (const [sceneId, asset] of Object.entries(scenePortraits)) {
  if (data.scenes[sceneId]?.content) {
    data.scenes[sceneId].content.portraitAsset = asset;
  }
}

writeFileSync("src/content/game-data.json", JSON.stringify(data, null, 2) + "\n", "utf8");

// 验证
const fixed = JSON.parse(readFileSync("src/content/game-data.json", "utf8"));
const badRefs = JSON.stringify(fixed).match(/\/assets\/characters\/\.png/g) || [];
console.log("Fixed. Remaining bad refs:", badRefs.length);
if (badRefs.length === 0) console.log("SUCCESS - All character asset paths fixed.");
