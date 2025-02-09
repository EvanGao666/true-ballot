import React, { useState, useEffect } from 'react';
import Popup from './Popup'; // 引入新的 Popup 组件
import Modal from './Modal'; // 引入修改用的弹窗

function App() {
    // 用于保存列表数据
    const [items, setItems] = useState([]);
    // 用于控制弹窗的显示
    const [isPopupOpen, setIsPopupOpen] = useState(false); // 控制Popup弹窗
    const [isModalOpen, setIsModalOpen] = useState(false); // 控制Modal弹窗
    const [selectedItem, setSelectedItem] = useState(null); // 用于保存被选中的列表项
    const [inputValue, setInputValue] = useState('');

    // 在组件挂载时读取 localStorage 中的数据
    useEffect(() => {
        const storedItems = JSON.parse(sessionStorage.getItem('modalData')) || [];
        setItems(storedItems); // 设置为 state 中的 items
    }, []);


    useEffect(() => {
        console.log("Items updated:", items.length);
    }, [items]); // 监听 items 更新后执行


    // 打开弹窗（添加项目）
    const openModal = () => {
        setIsModalOpen(true); // 打开 Modal
    };

    // 打开编辑弹窗（点击列表项）
    const openPopup = (item) => {
        setSelectedItem(item); // 设置选中的项目
        setInputValue(item); // 填充当前输入框
        setIsPopupOpen(true); // 打开 Popup
    };

    // 关闭弹窗
    const closePopup = () => {
        setIsPopupOpen(false);
        setSelectedItem(null); // 清空选中的项
        setInputValue(''); // 清空输入框
    };

    // 关闭 Modal
    const closeModal = () => {
        setIsModalOpen(false);
        setInputValue(''); // 清空输入框
        const storedItems = JSON.parse(sessionStorage.getItem('modalData')) || [];
        console.log("Stored Items:", storedItems); // 检查 sessionStorage 数据
        setItems(storedItems); // 设置为 state 中的 items
    };

    // 更新输入框的值
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    // 处理选择操作
    const handleOptionClick = (option) => {
        console.log('选择了选项:', option);
        // 你可以在这里处理选项点击事件
    };

    // 提交（添加或编辑）
    const handleSubmit = () => {
        if (inputValue.trim()) {
            if (selectedItem) {
                // 编辑现有项
                setItems(items.map(item => item === selectedItem ? inputValue : item));
            } else {
                // 添加新项
                setItems([...items, inputValue]);
            }
            setInputValue(''); // 清空输入框
            closePopup(); // 关闭弹窗
            closeModal(); // 确保Modal关闭
        }
    };

    return (
        <div className="App">
            <h1>列表展示</h1>
            <button onClick={openModal}>添加项目</button>

            {/* 新增的列表展示部分 */}
            <div>
                <h3>目前已有的项目:</h3>
                <ul>
                    {items.length > 0 ? (
                        items.map((item, index) => (
                            <li key={index} onClick={() => openPopup(item)}>
                                {/* 渲染 item.title 或其他可以渲染的内容 */}
                                {item.title}
                            </li>
                        ))
                    ) : (
                        <p>没有任何项目</p>
                    )}
                </ul>
            </div>


            {/* 显示添加 Modal 弹窗 */}
            {isModalOpen && (
                <Modal
                    inputValue={inputValue}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    closeModal={closeModal} // 关闭 Modal
                    selectedItem={selectedItem}
                />
            )}

            {/* 显示编辑 Popup 弹窗 */}
            {isPopupOpen && (
                <Popup
                    title={selectedItem.title}
                    details={selectedItem.details}
                    options={selectedItem.options}
                    handleOptionClick={handleOptionClick}
                    closePopup={closePopup}
                />
            )}
        </div>
    );
}

export default App;
