// messageService.js

/**
 * 查找消息插入位置
 * @param {Object} nodeIndexes - 节点索引信息
 * @param {Array} messagesList - 消息列表
 * @param {Object} terms - 配置项术语
 * @returns {number} 插入位置的索引
 */
export const findInsertIndex = (nodeIndexes, messagesList, terms) => {
  for (let i = 0; i < messagesList.length; i++) {
    const msg = messagesList[i];
    if (msg.type === terms.sectionDetailType) {
      const msgNodeIndexes = msg.data.nodeIndexes;
      if (
        msgNodeIndexes.node2Index > nodeIndexes.node2Index ||
        (msgNodeIndexes.node2Index === nodeIndexes.node2Index &&
          msgNodeIndexes.node3Index > nodeIndexes.node3Index) ||
        (msgNodeIndexes.node2Index === nodeIndexes.node2Index &&
          msgNodeIndexes.node3Index === nodeIndexes.node3Index &&
          msgNodeIndexes.node4Index > nodeIndexes.node4Index)
      ) {
        return i;
      }
    }
  }
  return messagesList.length;
};

/**
 * 渲染详细内容
 * @param {Object} detailData - 详细内容数据
 * @param {Object} nodeIndexes - 节点索引信息
 * @param {string} nodeTitle - 节点标题
 * @param {string} subNodeTitle - 子节点标题
 * @param {Object} messageConfig - 消息配置
 * @returns {string} 渲染后的内容
 */
export const renderDetailContent = (detailData, nodeIndexes, nodeTitle, subNodeTitle, messageConfig) => {
  if (!detailData) return '';

  const { terms } = messageConfig || {};
  const detailContent = detailData[terms.detail];

  if (!nodeIndexes || nodeIndexes.node3 === undefined || nodeIndexes.node4 === undefined) {
    console.error('nodeIndexes 参数缺失或未定义');
    return '';
  }

  nodeTitle = nodeTitle || '';
  subNodeTitle = subNodeTitle || '';

  return `
    # 第${nodeIndexes.node3}个${terms.node3}：${nodeTitle}
    ## 第${nodeIndexes.node4}个${terms.node4}：${subNodeTitle}

    ${detailContent}
  `;
};

/**
 * 创建新的用户消息
 * @param {string} content - 消息内容
 * @param {Object} selectedConfig - 选中的配置项
 * @returns {Object} 新的用户消息对象
 */
export const createUserMessage = (content, selectedConfig) => {
  return {
    role: 'user',
    content,
    type: 'user',
    selectedConfig
  };
};

/**
 * 创建新的助手消息
 * @param {string} content - 消息内容
 * @param {string} type - 消息类型
 * @param {Object} data - 消息数据
 * @param {Object} selectedConfig - 选中的配置项
 * @returns {Object} 新的助手消息对象
 */
export const createAssistantMessage = (content, type, data, selectedConfig) => {
  return {
    role: 'assistant',
    content,
    type,
    data,
    selectedConfig
  };
}; 