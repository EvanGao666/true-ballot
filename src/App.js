import React, { useState, useEffect } from 'react';
import Popup from './Popup';
import Modal from './Modal';
import FingerprintJS from '@fingerprintjs/fingerprintjs'; // 导入 FingerprintJS

function App() {
    const [items, setItems] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [fingerprint, setFingerprint] = useState(''); // 用于保存 FingerprintJS 获取的指纹

    // 在组件加载时获取 FingerprintJS
    useEffect(() => {
        const storedItems = JSON.parse(sessionStorage.getItem('modalData')) || [];
        setItems(storedItems);

        // 初始化 FingerprintJS 并获取指纹
        FingerprintJS.load().then(fp => {
            fp.get().then(result => {
                // 保存用户指纹
                setFingerprint(result.visitorId);
                console.log('User Fingerprint:', result.visitorId); // 打印用户指纹
            });
        });
    }, []);

    useEffect(() => {
        console.log("Items updated:", items.length);
    }, [items]);

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

    const handleOptionClick=(option)=>{
        console.log(typeof (option))
        option.number+=1;
        console.log("完成了选择"+option);
        console.log("此时的票数："+ option.number)
    };

    return (
        <div className="App" style={{ position: 'relative' }}>
            <h1>列表展示</h1>
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

            {/* 可选: 显示指纹 */}
            <div>
                {fingerprint && <p>User Fingerprint: {fingerprint}</p>}
            </div>
        </div>
    );
}

export default App;

