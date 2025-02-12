import React, { useState, useEffect } from "react";
import Popup from "./Popup";
import Modal from "./Modal";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { ethers } from "ethers"; // 引入 ethers.js
import VotingPlatformABI from "./VotingPlatformABI.json";
import "./App.css";

function App() {
  // ================== React 状态管理 ==================
  const [items, setItems] = useState([]); // 存储从合约中读取的投票信息
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [fingerprint, setFingerprint] = useState("");

  // MetaMask 相关
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);

  // ================== 合约地址（从环境变量中读取） ==================
  // 请在 .env 文件中配置：REACT_APP_VOTING_CONTRACT_ADDRESS=0xYourContractAddress
  const contractAddress = process.env.REACT_APP_VOTING_CONTRACT_ADDRESS;

  // ================== useEffect 初始化 ==================
  useEffect(() => {
    const init = async () => {
      // 获取浏览器指纹
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setFingerprint(result.visitorId);
      console.log("User Fingerprint:", result.visitorId);

      // 检查钱包并（若已连接）从合约加载投票
      const connected = await checkIfWalletIsConnected();
      if (connected) {
        await loadPollsFromContract();
      }
    };

    init();
    setupEventListeners();
    return () => removeEventListeners();
  }, []);

  // 当 items 更新时，存入 sessionStorage（演示用）
  useEffect(() => {
    sessionStorage.setItem("modalData", JSON.stringify(items));
  }, [items]);

  // ================== MetaMask 事件监听 ==================
  const setupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("connect", handleConnect);
      window.ethereum.on("disconnect", handleDisconnect);
    }
  };

  const removeEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.removeListener("connect", handleConnect);
      window.ethereum.removeListener("disconnect", handleDisconnect);
    }
  };

  // 事件处理
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setWalletAddress("");
      console.log("请连接 MetaMask.");
    } else {
      setWalletAddress(accounts[0]);
      setIsConnected(true);
      // 账户变更后自动加载投票
      loadPollsFromContract();
    }
  };

  const handleChainChanged = (chainId) => {
    setChainId(chainId);
    // 为了确保状态刷新，可以强制刷新
    window.location.reload();
  };

  const handleConnect = (connectInfo) => {
    console.log("MetaMask 已连接!", connectInfo);
  };

  const handleDisconnect = (error) => {
    console.log("MetaMask 已断开连接!", error);
    setIsConnected(false);
    setWalletAddress("");
  };

  // ================== 检查/连接/断开钱包 ==================
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("请安装 MetaMask!");
        return false;
      }
      const currentChainId = await ethereum.request({ method: "eth_chainId" });
      setChainId(currentChainId);
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        console.log("找到已授权账户:", accounts[0]);
        return true;
      }
      console.log("未找到授权账户");
      return false;
    } catch (error) {
      console.error("检查钱包连接状态时出错:", error);
      return false;
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("请安装 MetaMask!");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setWalletAddress(accounts[0]);
      setIsConnected(true);
      console.log("已连接到钱包:", accounts[0]);
      const currentChainId = await ethereum.request({ method: "eth_chainId" });
      setChainId(currentChainId);

      // 连接完成后自动加载投票
      await loadPollsFromContract();
    } catch (error) {
      console.error("连接钱包时出错:", error);
      if (error.code === 4001) {
        alert("用户拒绝连接钱包");
      } else {
        alert("连接钱包时出错");
      }
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setIsConnected(false);
    setChainId(null);
    setItems([]); // 清空界面数据
  };

  // ================== 连接合约的帮助函数 ==================
  const getContract = async () => {
    if (!contractAddress) {
      alert(
        "合约地址未设置，请在 .env 中配置 REACT_APP_VOTING_CONTRACT_ADDRESS！"
      );
      return null;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);

    const signer = await provider.getSigner(); // 一定要 await
    return new ethers.Contract(contractAddress, VotingPlatformABI.abi, signer);
  };

  // ================== 从合约加载已有投票列表 ==================
  const loadPollsFromContract = async () => {
    try {
      const contract = await getContract();
      if (!contract) return;

      const [ids, titles] = await contract.getPollSummaries();
      let loadedPolls = [];

      for (let i = 0; i < ids.length; i++) {
        const pollId = Number(ids[i]);
        const pollData = await contract.getPoll(pollId);
        const title = pollData[0];
        const details = pollData[1];
        const options = pollData[2]; // string[] 选项文本
        const votes = pollData[3]; // uint256[] 选项票数

        let optionObjects = options.map((optText, idx) => ({
          text: optText,
          number: Number(votes[idx]),
        }));

        loadedPolls.push({
          id: pollId,
          title,
          details,
          options: optionObjects,
        });
      }
      setItems(loadedPolls);
    } catch (error) {
      console.error("加载投票失败:", error);
    }
  };

  // ================== 创建投票（在 Modal 中操作） ==================
  // ================== 创建投票（在 Modal 中操作） ==================
  const createPollOnChain = async (title, details, optionsArray) => {
    try {
      const contract = await getContract();
      if (!contract) return;

      // 提取选项文本
      const optionTexts = optionsArray.map((opt) => opt.text);

      // 检查选项数组是否非空，并确保所有选项都有内容
      if (
        optionTexts.length === 0 ||
        optionTexts.some((text) => text.trim() === "")
      ) {
        alert("请确保所有选项都有内容");
        return;
      }

      // 可选：使用 callStatic 进行模拟调用以捕获错误（调试时可打开）
      // await contract.callStatic.createPoll(title, details, optionTexts);

      // 指定 gasLimit，防止 gas 估算失败
      const tx = await contract.createPoll(title, details, optionTexts, {
        gasLimit: 300000,
      });
      await tx.wait(); // 等待交易上链

      alert("投票已创建成功!");
      // 重新加载链上投票数据
      await loadPollsFromContract();
    } catch (error) {
      console.error("createPollOnChain 出错:", error);
      alert("创建投票时出错，请查看控制台日志");
    }
  };

  // ================== 进行投票（单选） ==================
  const voteOnChain = async (pollId, optionIndex) => {
    try {
      const contract = await getContract();
      if (!contract) return;

      const tx = await contract.vote(pollId, optionIndex);
      await tx.wait();
      alert("投票成功!");
      // 更新当前投票的票数
      await loadPollsFromContract();
    } catch (error) {
      console.error("voteOnChain 出错:", error);
    }
  };

  // ================== 原有弹窗等 UI 逻辑 ==================
  const openModal = () => setIsModalOpen(true);
  const openPopup = (item) => {
    setSelectedItem(item);
    setIsPopupOpen(true);
  };
  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedItem(null);
    setInputValue("");
  };
  const closeModal = async () => {
    setIsModalOpen(false);
    setInputValue("");
    // 如果仍要保留本地存储，可在此加载 sessionStorage
    const storedItems = JSON.parse(sessionStorage.getItem("modalData")) || [];
    setItems(storedItems);
  };

  // 投票操作（弹窗内点击）
  const handleOptionClick = (option, pollId, index) => {
    console.log("选中的投票 ID:", pollId, "选项序号:", index);
    // 调用合约投票
    voteOnChain(pollId, index);
  };

  // ================== 页面渲染 ==================
  return (
    <div className="App" style={{ position: "relative" }}>
      <h1>去中心化投票 Demo</h1>

      {/* ========== MetaMask 连接状态和操作 ========== */}
      <div className="wallet-section" style={{ margin: "20px 0" }}>
        {!isConnected ? (
          <button onClick={connectWallet} className="wallet-button">
            连接 MetaMask
          </button>
        ) : (
          <div className="wallet-info">
            <p>
              已连接钱包: {walletAddress.slice(0, 6)}...
              {walletAddress.slice(-4)}
            </p>
            <p>当前网络 ChainId: {chainId}</p>
            <button onClick={disconnectWallet} className="wallet-button">
              断开连接
            </button>
          </div>
        )}
      </div>

      {/* ========== 创建投票按钮 ========== */}
      <button onClick={openModal}>添加投票</button>

      <div>
        <h3>当前链上已有投票:</h3>
        <ul>
          {items.length > 0 ? (
            items.map((item, index) => (
              <li key={index} onClick={() => openPopup(item)}>
                {item.title}
              </li>
            ))
          ) : (
            <p>没有任何投票</p>
          )}
        </ul>
      </div>

      {/* ========== 弹出新建投票的 Modal ========== */}
      {isModalOpen && (
        <Modal closeModal={closeModal} createPollOnChain={createPollOnChain} />
      )}

      {/* ========== 投票详情弹窗 ========== */}
      {isPopupOpen && selectedItem && (
        <Popup
          title={selectedItem.title}
          details={selectedItem.details}
          options={selectedItem.options}
          closePopup={closePopup}
          pollId={selectedItem.id}
          handleOptionClick={handleOptionClick}
        />
      )}

      {/* 指纹信息显示 */}
      <div>{fingerprint && <p>User Fingerprint: {fingerprint}</p>}</div>
    </div>
  );
}

export default App;
