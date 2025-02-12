// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingPlatform {
    // 定义投票结构体，包含标题、详情、选项及票数统计，和防止重复投票的映射
    struct Poll {
        string title;                   // 投票标题
        string details;                 // 投票详情（与前端字段名保持一致）
        string[] options;               // 投票选项文本（数量可变）
        uint256[] votes;                // 各选项票数
        mapping(address => bool) hasVoted; // 记录每个地址是否已投票（仅限本投票）
        bool exists;                    // 标记投票是否存在
    }
    
    // 投票总数（投票 ID 从 1 开始）
    uint256 public pollCount;
    // 通过投票 ID 存储所有投票（注意：Poll 包含 mapping，不能直接在内存中构造）
    mapping(uint256 => Poll) private polls;

    // 事件：创建投票时触发
    event PollCreated(uint256 indexed pollId, string title);
    // 事件：用户投票时触发
    event Voted(uint256 indexed pollId, address indexed voter, uint256 optionIndex);

    /**
     * @notice 创建投票
     * @param _title 投票标题
     * @param _details 投票详情（与前端一致使用“details”）
     * @param _options 投票选项数组（前端传入时建议提取选项中的 text 字段）
     * @return 返回新投票的 ID
     */
    function createPoll(
        string memory _title, 
        string memory _details, 
        string[] memory _options
    ) public returns (uint256) {
        require(_options.length > 0, "at least one vote");
        pollCount++; // 投票 ID 自增

        // 注意：由于 Poll 中含有 mapping，不能在内存中直接构造，因此先通过 storage 方式操作
        Poll storage newPoll = polls[pollCount];
        newPoll.title = _title;
        newPoll.details = _details;
        newPoll.exists = true;
        // 将传入的每个选项复制到投票中，同时初始化对应票数为 0
        for (uint256 i = 0; i < _options.length; i++) {
            newPoll.options.push(_options[i]);
            newPoll.votes.push(0);
        }
        emit PollCreated(pollCount, _title);
        return pollCount;
    }

    /**
     * @notice 对指定投票进行投票（单选）
     * @param _pollId 投票的 ID
     * @param _optionIndex 选择的选项下标（从 0 开始）
     */
    function vote(uint256 _pollId, uint256 _optionIndex) public {
        require(_pollId > 0 && _pollId <= pollCount, "vote does not exist");
        Poll storage poll = polls[_pollId];
        require(poll.exists, "vote does not exist");
        require(_optionIndex < poll.options.length, "choice does not exist");
        require(!poll.hasVoted[msg.sender], "already voted");
        
        // 累加选中选项的票数
        poll.votes[_optionIndex] += 1;
        // 标记该地址已经投票
        poll.hasVoted[msg.sender] = true;
        emit Voted(_pollId, msg.sender, _optionIndex);
    }

    /**
     * @notice 获取指定投票的详细信息
     * @param _pollId 投票的 ID
     * @return title 投票标题
     * @return details 投票详情
     * @return options 投票选项数组
     * @return votes 各选项的票数数组
     */
    function getPoll(uint256 _pollId) public view returns (
        string memory title, 
        string memory details, 
        string[] memory options, 
        uint256[] memory votes
    ) {
        require(_pollId > 0 && _pollId <= pollCount, "vote does not exist");
        Poll storage poll = polls[_pollId];
        uint256 len = poll.options.length;
        // 复制存储中的数组到内存后返回
        string[] memory optionsMemory = new string[](len);
        uint256[] memory votesMemory = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            optionsMemory[i] = poll.options[i];
            votesMemory[i] = poll.votes[i];
        }
        return (poll.title, poll.details, optionsMemory, votesMemory);
    }
    
    /**
     * @notice 获取所有投票的摘要信息（ID 和标题），便于前端展示列表
     * @return ids 所有投票的 ID 数组
     * @return titles 所有投票的标题数组
     */
    function getPollSummaries() public view returns (uint256[] memory ids, string[] memory titles) {
    ids = new uint256[](pollCount);
    titles = new string[](pollCount);
    for (uint256 i = 0; i < pollCount; i++) {
        Poll storage poll = polls[i + 1];
        ids[i] = i + 1;
        titles[i] = poll.title;
    }
    return (ids, titles);
}

}

