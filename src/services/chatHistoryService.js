// chatHistoryService.js

/**
 * 保存聊天历史记录
 * @param {Array} messages - 消息列表
 * @param {Object} mainStructure - 主结构
 * @param {Object} currentNodeIndexes - 当前节点索引
 * @param {Object} selectedConfig - 选中的配置项
 * @returns {Object} 聊天历史记录对象
 */
export const saveChatHistory = (messages, mainStructure, currentNodeIndexes, selectedConfig) => {
  const title = messages[0]?.content.slice(0, 10) || '未命名';
  return {
    title,
    messages,
    mainStructure,
    currentNodeIndexes,
    selectedConfig
  };
};

/**
 * 创建新的聊天
 * @param {Object} selectedConfig - 选中的配置项
 * @returns {Object} 新的聊天历史记录对象
 */
export const createNewChat = (selectedConfig) => {
  return {
    title: '未命名',
    messages: [],
    mainStructure: null,
    currentNodeIndexes: {
      node1: 1,
      node2: 1,
      node3: 1,
      node4: 1,
    },
    selectedConfig
  };
};

/**
 * 从本地存储加载聊天历史记录
 * @returns {Array} 聊天历史记录列表
 */
export const loadChatHistories = () => {
  const storedChatHistories = localStorage.getItem('chatHistories');
  if (storedChatHistories) {
    try {
      return JSON.parse(storedChatHistories);
    } catch (error) {
      console.error('解析聊天历史记录时发生错误:', error);
      return [];
    }
  }
  return [];
};

/**
 * 保存聊天历史记录到本地存储
 * @param {Array} chatHistories - 聊天历史记录列表
 */
export const saveChatHistoriesToStorage = (chatHistories) => {
  try {
    localStorage.setItem('chatHistories', JSON.stringify(chatHistories));
  } catch (error) {
    console.error('保存聊天历史记录时发生错误:', error);
  }
};

/**
 * 更新当前聊天索引
 * @param {number} index - 聊天索引
 */
export const saveCurrentChatIndex = (index) => {
  if (index !== null) {
    localStorage.setItem('currentChatIndex', index.toString());
  } else {
    localStorage.removeItem('currentChatIndex');
  }
}; 