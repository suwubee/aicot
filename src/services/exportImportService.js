// exportImportService.js

/**
 * 导出聊天数据
 * @param {Array} chatHistories - 聊天历史记录列表
 * @param {Array} configurations - 配置项列表
 * @param {Object} selectedConfig - 选中的配置项
 * @returns {string} 下载文件的URL
 */
export const exportChatData = (chatHistories, configurations, selectedConfig) => {
  const dataStr = JSON.stringify({
    chatHistories,
    configurations,
    selectedConfig,
  }, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  return URL.createObjectURL(blob);
};

/**
 * 导入聊天数据
 * @param {string} jsonString - JSON格式的聊天数据
 * @returns {Object} 导入的数据对象
 * @throws {Error} 如果导入失败
 */
export const importChatData = (jsonString) => {
  try {
    const importedData = JSON.parse(jsonString);
    return {
      chatHistories: importedData.chatHistories || [],
      configurations: importedData.configurations || [],
      selectedConfig: importedData.selectedConfig || null,
    };
  } catch (error) {
    throw new Error('导入失败，请确保文件格式正确');
  }
};

/**
 * 导出配置项
 * @param {Array} configurations - 配置项列表
 * @param {Object} selectedConfig - 选中的配置项
 * @returns {string} 下载文件的URL
 */
export const exportConfigurations = (configurations, selectedConfig) => {
  const dataStr = JSON.stringify({
    configurations,
    selectedConfig,
  }, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  return URL.createObjectURL(blob);
};

/**
 * 导入配置项
 * @param {string} jsonString - JSON格式的配置项数据
 * @returns {Object} 导入的配置项数据对象
 * @throws {Error} 如果导入失败
 */
export const importConfigurations = (jsonString) => {
  try {
    const importedData = JSON.parse(jsonString);
    return {
      configurations: importedData.configurations,
      selectedConfig: importedData.selectedConfig,
    };
  } catch (error) {
    throw new Error('导入失败，请确保文件格式正确');
  }
};

/**
 * 导出Markdown格式的聊天内容
 * @param {Array} messages - 消息列表
 * @param {Object} selectedConfig - 选中的配置项
 * @returns {string} 下载文件的URL
 */
export const exportMarkdown = (messages, selectedConfig) => {
  try {
    let markdownContent = '';
    
    messages.forEach(message => {
      if (message.type === selectedConfig.terms.sectionDetailType) {
        if (!message.data || !message.data.nodeIndexes) {
          console.warn('消息缺少必要的数据结构:', message);
          return;
        }

        const title = message.data.标题 || message.data.title || '未命名章节';
        markdownContent += `### ${title}\n\n`;
        
        if (message.content) {
          markdownContent += `${message.content}\n\n`;
        }
      }
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    return URL.createObjectURL(blob);
  } catch (error) {
    throw new Error(`导出失败: ${error.message}`);
  }
}; 