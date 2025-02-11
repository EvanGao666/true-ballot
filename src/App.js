// App.js
import React, { useState, useEffect } from 'react';
import Popup from './Popup';
import Modal from './Modal';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import './App.css';

function App() {
    // 状态管理
    const [items, setItems] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [fingerprint, setFingerprint] = useState('');
    // MetaMask 相关状态
    const [walletAddress, setWalletAddress] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [chainId, setChainId] = useState(null);

    // 初始化加载
    useEffect(() => {
        const init = async () => {
            // 加载存储的数据
            const storedItems = JSON.parse(sessionStorage.getItem('modalData')) || [];
            setItems(storedItems);

            // 初始化指纹
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            setFingerprint(result.visitorId);
            console.log('User Fingerprint:', result.visitorId);

            // 检查钱包连接状态
            await checkIfWalletIsConnected();
        };

        init();
        setupEventListeners();

        // 清理事件监听器
        return () => removeEventListeners();
    }, []);

    // 监听项目更新
    useEffect(() => {
        console.log("Items updated:", items.length);
        // 保存到 sessionStorage
        sessionStorage.setItem('modalData', JSON.stringify(items));
    }, [items]);

    // 设置 MetaMask 事件监听器
    const setupEventListeners = () => {
        if (window.ethereum) {
            // 账户变化监听
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            // 链变化监听
            window.ethereum.on('chainChanged', handleChainChanged);
            // 连接事件监听
            window.ethereum.on('connect', handleConnect);
            // 断开连接事件监听
            window.ethereum.on('disconnect', handleDisconnect);
        }
    };

    // 移除事件监听器
    const removeEventListeners = () => {
        if (window.ethereum) {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
            window.ethereum.removeListener('connect', handleConnect);
            window.ethereum.removeListener('disconnect', handleDisconnect);
        }
    };

    // MetaMask 事件处理函数
    const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
            // 用户断开连接
            setIsConnected(false);
            setWalletAddress('');
            console.log('请连接 MetaMask.');
        } else {
            // 更新当前账户
            setWalletAddress(accounts[0]);
            setIsConnected(true);
        }
    };

    const handleChainChanged = (chainId) => {
        setChainId(chainId);
        // 页面刷新以确保所有状态同步
        window.location.reload();
    };

    const handleConnect = (connectInfo) => {
        console.log('MetaMask 已连接!', connectInfo);
    };

    const handleDisconnect = (error) => {
        console.log('MetaMask 已断开连接!', error);
        setIsConnected(false);
        setWalletAddress('');
    };

    // 检查钱包连接状态
    const checkIfWalletIsConnected = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                console.log("请安装 MetaMask!");
                return false;
            }

            // 获取当前链 ID
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            setChainId(chainId);

            // 检查是否已授权连接
            const accounts = await ethereum.request({ method: 'eth_accounts' });
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

    // 连接钱包
    const connectWallet = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                alert("请安装 MetaMask!");
                return;
            }

            // 请求用户授权
            const accounts = await ethereum.request({
                method: 'eth_requestAccounts'
            });

            setWalletAddress(accounts[0]);
            setIsConnected(true);
            console.log("已连接到钱包:", accounts[0]);

            // 获取当前链 ID
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            setChainId(chainId);
        } catch (error) {
            console.error("连接钱包时出错:", error);
            if (error.code === 4001) {
                // 用户拒绝连接
                alert("用户拒绝连接钱包");
            } else {
                alert("连接钱包时出错");
            }
        }
    };

    // 断开钱包连接
    const disconnectWallet = () => {
        setWalletAddress('');
        setIsConnected(false);
        setChainId(null);
    };

    // 原有功能相关函数
    const openModal = () => setIsModalOpen(true);
    const openPopup = (item) => {
        setSelectedItem(item);
        setInputValue(item);
        setIsPopupOpen(true);
    };
    const closePopup = () => {
        setIsPopupOpen(false);
        setSelectedItem(null);
        setInputValue('');
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setInputValue('');
        const storedItems = JSON.parse(sessionStorage.getItem('modalData')) || [];
        setItems(storedItems);
    };

    const handleInputChange = (e) => setInputValue(e.target.value);

    const handleSubmit = () => {
        if (inputValue.trim()) {
            if (selectedItem) {
                setItems(items.map(item => item === selectedItem ? inputValue : item));
            } else {
                setItems([...items, inputValue]);
            }
            setInputValue('');
            closePopup();
            closeModal();
        }
    };

    const handleOptionClick = (option) => {
        console.log(typeof (option));
        option.number += 1;
        console.log("完成了选择" + option);
        console.log("此时的票数：" + option.number);
    };

    // 渲染界面
    return (
        <div className="App" style={{ position: 'relative' }}>
            <h1>列表展示</h1>

            {/* MetaMask 连接状态和操作 */}
            <div className="wallet-section" style={{ margin: '20px 0' }}>
                {!isConnected ? (
                    <button 
                        onClick={connectWallet}
                        className="wallet-button"
                    >
                        连接 MetaMask
                    </button>
                ) : (
                    <div className="wallet-info">
                        <p>已连接钱包: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                        <p>当前网络: {chainId}</p>
                        <button 
                            onClick={disconnectWallet}
                            className="wallet-button"
                        >
                            断开连接
                        </button>
                    </div>
                )}
            </div>

            {/* 原有功能界面 */}
            <button onClick={openModal}>添加项目</button>

            <div>
                <h3>目前已有的项目:</h3>
                <ul>
                    {items.length > 0 ? (
                        items.map((item, index) => (
                            <li key={index} onClick={() => openPopup(item)}>
                                {item.title}
                            </li>
                        ))
                    ) : (
                        <p>没有任何项目</p>
                    )}
                </ul>
            </div>

            {isModalOpen && (
                <Modal
                    inputValue={inputValue}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    closeModal={closeModal}
                    selectedItem={selectedItem}
                />
            )}

            {isPopupOpen && (
                <Popup
                    title={selectedItem.title}
                    details={selectedItem.details}
                    options={selectedItem.options}
                    handleOptionClick={handleOptionClick}
                    closePopup={closePopup}
                />
            )}

            {/* 指纹信息显示 */}
            <div>
                {fingerprint && <p>User Fingerprint: {fingerprint}</p>}
            </div>
        </div>
    );
}

export default App;
