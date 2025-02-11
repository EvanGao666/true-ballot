// scripts/copyABI.js
const fs = require("fs");
const path = require("path");

// 根据你的项目目录结构修改以下路径：
// 假设 Hardhat 编译后的 ABI 位于 contracts/artifacts/contracts/VotingPlatform.sol/VotingPlatform.json
const sourcePath = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "VotingPlatform.sol",
  "VotingPlatform.json"
);
// 将 ABI 复制到前端 src 文件夹中，文件名为 VotingPlatformABI.json
const destPath = path.join(
  __dirname,
  "..",
  "..",
  "src",
  "VotingPlatformABI.json"
);

fs.copyFile(sourcePath, destPath, (err) => {
  if (err) {
    console.error("复制 ABI 文件时出错：", err);
    process.exit(1);
  }
  console.log("ABI 文件已复制到 src 文件夹");
});
