// scripts/deploy.js
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");
require("dotenv").config(); // 读取并写回 .env

async function main() {
  // 1. 获取合约工厂并部署
  const VotingPlatform = await ethers.getContractFactory("VotingPlatform");
  const votingPlatform = await VotingPlatform.deploy();
  await votingPlatform.waitForDeployment(); // 等待部署完成
  console.log("VotingPlatform deployed to:", votingPlatform.target);

  // 2. 将合约地址写入 .env 的 REACT_APP_VOTING_CONTRACT_ADDRESS
  const envFilePath = path.join(__dirname, "..", "..", ".env");
  let envContent = fs.readFileSync(envFilePath, "utf8");

  if (envContent.match(/REACT_APP_VOTING_CONTRACT_ADDRESS=/)) {
    // 替换已有行
    envContent = envContent.replace(
      /REACT_APP_VOTING_CONTRACT_ADDRESS=.*/,
      `REACT_APP_VOTING_CONTRACT_ADDRESS=${votingPlatform.target}`
    );
  } else {
    // 文件末尾追加
    envContent += `\nREACT_APP_VOTING_CONTRACT_ADDRESS=${votingPlatform.target}`;
  }

  fs.writeFileSync(envFilePath, envContent, "utf8");
  console.log(`合约地址已写入 .env => ${votingPlatform.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
