// exportImportService.js

// 创建动态思维链配置的公共函数
const createDynamicConfig = () => ({
  id: 'dynamic',
  name: '动态思维链',
  isDynamic: true,
  isSystemConfig: true,
  terms: {
    node1: '',
    node2: [],
    node2ComplexItems: [],
    node3: '步骤',
    node4: '子步骤',
    node5: '内容',
    mainStructure: '流程设计',
    title: '标题',
    outline: '大纲',
    content: '内容',
    detail: '详细内容',
    type: '类型',
    detailFlag: 'detail',
    sectionDetailType: 'sectionDetail'
  },
  fixedDescriptions: {},
  systemRolePrompt: ''
});

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
    // 过滤掉可能存在的动态思维链配置
    const configurations = (importedData.configurations || []).filter(config => !config.isSystemConfig);
    // 创建动态思维链配置
    const dynamicConfig = createDynamicConfig();
    return {
      chatHistories: importedData.chatHistories || [],
      configurations: [dynamicConfig, ...configurations],
      selectedConfig: importedData.selectedConfig || dynamicConfig,
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
    // 过滤掉可能存在的动态思维链配置
    const configurations = importedData.configurations.filter(config => !config.isSystemConfig);
    // 创建动态思维链配置
    const dynamicConfig = createDynamicConfig();
    return {
      configurations: [dynamicConfig, ...configurations],
      selectedConfig: importedData.selectedConfig || dynamicConfig,
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
    
    // 首先找到最新的主结构消息
    const mainStructureMessage = messages.findLast(message => message.type === 'mainStructure');
    
    // 如果存在主结构，先添加主结构内容
    if (mainStructureMessage) {
      const terms = selectedConfig.terms;
      let mainStructureData;
      
      try {
        mainStructureData = mainStructureMessage.data || JSON.parse(mainStructureMessage.content.slice(6));
      } catch (error) {
        console.warn('解析主结构数据失败:', error);
        return;
      }

      if (mainStructureData && mainStructureData[terms.node1]) {
        const design = mainStructureData[terms.node1];
        
        markdownContent += `# ${terms.node1}\n\n`;
        
        // 遍历所有node2项
        terms.node2.forEach(node2Name => {
          const node2Data = design[node2Name];
          if (!node2Data) return;
          
          markdownContent += `## ${node2Name}\n\n`;
          
          if (terms.node2ComplexItems.includes(node2Name)) {
            // 处理复杂项
            if (Array.isArray(node2Data)) {
              node2Data.forEach((item, index) => {
                if (item[terms.title]) {
                  markdownContent += `### ${item[terms.title]}\n\n`;
                  if (Array.isArray(item[terms.content])) {
                    item[terms.content].forEach(subItem => {
                      markdownContent += `- ${subItem}\n`;
                    });
                    markdownContent += '\n';
                  }
                }
              });
            }
          } else {
            // 处理简单项
            if (typeof node2Data === 'string') {
              markdownContent += `${node2Data}\n\n`;
            } else if (Array.isArray(node2Data)) {
              node2Data.forEach(item => {
                markdownContent += `- ${item}\n`;
              });
              markdownContent += '\n';
            }
          }
        });
        
        markdownContent += '\n---\n\n';
      }
    }
    
    // 然后添加所有详细内容
    messages.forEach(message => {
      if (message.type === selectedConfig.terms.sectionDetailType) {
        if (!message.data || !message.data.nodeIndexes) {
          console.warn('消息缺少必要的数据结构:', message);
          return;
        }

        const nodeIndexes = message.data.nodeIndexes;
        const title = message.data.标题 || message.data.title || 
                     `${nodeIndexes.node2Name} - 第${nodeIndexes.node3}节 - 第${nodeIndexes.node4}部分`;
        markdownContent += `### ${title}\n\n`;
        
        if (message.data[selectedConfig.terms.detail]) {
          markdownContent += `${message.data[selectedConfig.terms.detail]}\n\n`;
        }
      }
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    return URL.createObjectURL(blob);
  } catch (error) {
    throw new Error(`导出失败: ${error.message}`);
  }
}; 