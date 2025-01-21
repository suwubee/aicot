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
  // 过滤掉系统配置
  const configsToExport = configurations.filter(config => !config.isSystemConfig);
  
  // 如果选中的配置是系统配置，使用第一个非系统配置
  let selectedConfigToExport = selectedConfig;
  if (selectedConfig.isSystemConfig) {
    selectedConfigToExport = configsToExport[0] || null;
  }

  const dataStr = JSON.stringify({
    chatHistories,
    configurations: configsToExport,
    selectedConfig: selectedConfigToExport,
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
  // 过滤掉系统配置
  const configsToExport = configurations.filter(config => !config.isSystemConfig);
  
  // 如果选中的配置是系统配置，使用第一个非系统配置
  let selectedConfigToExport = selectedConfig;
  if (selectedConfig.isSystemConfig) {
    selectedConfigToExport = configsToExport[0] || null;
  }

  const dataStr = JSON.stringify({
    configurations: configsToExport,
    selectedConfig: selectedConfigToExport,
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
 * 从主结构数据中提取实际显示的内容
 * @param {Object} mainStructureData - 主结构数据
 * @param {Object} terms - 配置项的术语定义
 * @returns {Object} 处理后的主结构数据
 */
const extractDisplayContent = (mainStructureData, terms) => {
  // 如果数据为空或没有主节点，直接返回原数据
  if (!mainStructureData) {
    return mainStructureData;
  }

  // 获取主节点名称
  const mainNodeName = Object.keys(mainStructureData)[0];
  if (!mainNodeName) {
    return mainStructureData;
  }

  // 创建结果对象
  const result = {};
  result[mainNodeName] = {};
  const mainNode = mainStructureData[mainNodeName];

  // 遍历所有二级节点
  Object.keys(mainNode).forEach(node2Name => {
    const node2Data = mainNode[node2Name];
    
    // 如果是数组类型（复杂项）
    if (Array.isArray(node2Data)) {
      result[mainNodeName][node2Name] = node2Data.map(item => {
        // 使用配置中定义的 title 字段获取标题
        const title = item[terms.title] || "";
        // 确保返回必要的字段
        return {
          [terms.title]: title,
          [terms.content]: item[terms.content] || [],
          [terms.detailFlag]: true,
          flowDescription: title
        };
      });
    } else {
      // 如果是字符串类型（简单项）
      result[mainNodeName][node2Name] = node2Data;
    }
  });

  return result;
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
      let mainStructureData;
      
      try {
        // 获取主结构数据
        mainStructureData = mainStructureMessage.data || JSON.parse(mainStructureMessage.content.slice(6));
        
        // 使用 extractDisplayContent 处理数据，确保格式一致性
        mainStructureData = extractDisplayContent(mainStructureData, selectedConfig.terms);
        if (!mainStructureData) {
          throw new Error('无法解析主结构数据');
        }

        // 获取主节点名称
        const mainNodeName = Object.keys(mainStructureData)[0];
        if (!mainNodeName) {
          throw new Error('无法获取主节点名称');
        }

        markdownContent += `# ${mainNodeName}\n\n`;
        const design = mainStructureData[mainNodeName];
        
        // 遍历所有node2项
        Object.keys(design).forEach(node2Name => {
          const node2Data = design[node2Name];
          if (!node2Data) return;
          
          markdownContent += `## ${node2Name}\n\n`;
          
          // 处理复杂项（数组类型）
          if (Array.isArray(node2Data)) {
            node2Data.forEach((item, index) => {
              // 获取标题
              const title = item[selectedConfig.terms.title] || '';
              if (title) {
                markdownContent += `### ${title}\n\n`;
              }
              
              // 添加内容列表
              if (Array.isArray(item[selectedConfig.terms.content])) {
                item[selectedConfig.terms.content].forEach(subItem => {
                  markdownContent += `- ${subItem}\n`;
                });
                markdownContent += '\n';
              }
            });
          } else {
            // 处理简单项（字符串类型）
            markdownContent += `${node2Data}\n\n`;
          }
        });
        
        markdownContent += '\n---\n\n';
      } catch (error) {
        console.warn('解析主结构数据失败:', error);
        return;
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
        const title = message.data[selectedConfig.terms.title] || 
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