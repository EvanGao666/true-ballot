import React, { useState } from 'react';

function Modal({ closeModal }) {
    // State to hold title, details, and options (option is an object with text and number)
    const [title, setTitle] = useState('');
    const [details, setDetails] = useState('');
    const [numOptions, setNumOptions] = useState(1);
    const [options, setOptions] = useState(Array(numOptions).fill({ text: '', number: 0 }));

    // Handle change for title and details
    const handleTitleChange = (e) => setTitle(e.target.value);
    const handleDetailsChange = (e) => setDetails(e.target.value);

    // Handle change for option text and number
    const handleOptionChange = (index, e) => {
        const { name, value } = e.target;
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], [name]: name === 'number' ? parseInt(value, 10) : value };
        setOptions(newOptions);
    };

    // Handle change for number of options
    const handleNumOptionsChange = (e) => {
        const newNumOptions = parseInt(e.target.value, 10);
        if (newNumOptions >= 1) {
            setNumOptions(newNumOptions);
            setOptions(Array(newNumOptions).fill({ text: '', number: 0 }));
        }
    };

    const handleSubmit = () => {
        const data = {
            title,
            details,
            options
        };

        let storedItems = JSON.parse(sessionStorage.getItem('modalData')) || [];
        storedItems.push(data);
        sessionStorage.setItem('modalData', JSON.stringify(storedItems));

        closeModal();
    };

    return (
        <div style={modalStyles}>
            <div style={modalContentStyles}>
                <h2>输入新的项目</h2>
                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="输入标题"
                    style={inputStyles}
                />
                <textarea
                    value={details}
                    onChange={handleDetailsChange}
                    placeholder="输入详情"
                    style={{ ...inputStyles, minHeight: '80px' }}
                />
                <div>
                    <label>
                        选项数量:
                        <input
                            type="number"
                            value={numOptions}
                            onChange={handleNumOptionsChange}
                            min="1"
                            style={inputStyles}
                        />
                    </label>
                </div>
                <div>
                    {options.map((option, index) => (
                        <div key={index}>
                            <input
                                type="text"
                                name="text"
                                value={option.text}
                                onChange={(e) => handleOptionChange(index, e)}
                                placeholder={`选项 ${index + 1} 文本`}
                                style={inputStyles}
                            />
                            <input
                                type="number"
                                name="number"
                                value={option.number}
                                onChange={(e) => handleOptionChange(index, e)}
                                placeholder={`选项 ${index + 1} 数字`}
                                style={inputStyles}
                            />
                        </div>
                    ))}
                </div>
                <button onClick={handleSubmit} style={buttonStyles}>确认</button>
                <button onClick={closeModal} style={buttonStyles}>关闭</button>
            </div>
        </div>
    );
}

const modalStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
};

const modalContentStyles = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    width: '400px',
};

const inputStyles = {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '4px',
    border: '1px solid #ccc',
};

const buttonStyles = {
    padding: '10px 20px',
    margin: '10px 5px',
    borderRadius: '4px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
};

export default Modal;
