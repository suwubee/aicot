// contentGenerationService.js
import { createAssistantMessage } from './messageService';
import { findInsertIndex } from './messageService';
import {
  generateNewMainStructure as apiGenerateNewMainStructure,
  adjustMainStructure as apiAdjustMainStructure,
  generateNewDetail as apiGenerateNewDetail,
  adjustDetail as apiAdjustDetail,
  generateDynamicConfig as apiGenerateDynamicConfig,
} from '../api';

/**
 * 生成新的主结构
 * @param {string} apiUrl - API地址
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {string} userContent - 用户输入内容
 * @param {Object} selectedConfig - 选中的配置项
 * @returns {Promise<Object>} 生成的主结构
 */
export const generateNewMainStructure = async (
  apiUrl,
  apiKey,
  model,
  userContent,
  selectedConfig
) => {
  try {
    const result = await apiGenerateNewMainStructure(apiUrl, apiKey, model, userContent, selectedConfig);
    
    // 如果是动态配置，转换主结构以匹配现有函数的期望格式
    if (selectedConfig.isDynamic && result.functionResult) {
      const transformed = transformMainStructure(result.functionResult, selectedConfig);
      if (transformed) {
        // 确保转换后的结构是有效的
        const mainKey = selectedConfig.terms.node1;
        if (transformed[mainKey]) {
          result.functionResult = transformed;
          
          // 验证转换后的结构
          const complexItems = selectedConfig.terms.node2ComplexItems || [];
          for (const key of Object.keys(transformed[mainKey])) {
            const value = transformed[mainKey][key];
            if (complexItems.includes(key)) {
              // 确保复杂项是数组
              if (!Array.isArray(value)) {
                throw new Error(`${key} 的结构无效，应为数组类型`);
              }
            } else {
              // 确保简单项是字符串
              if (typeof value !== 'string') {
                throw new Error(`${key} 的结构无效，应为字符串类型`);
              }
            }
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    throw new Error(`生成主结构失败: ${error.message}`);
  }
};

/**
 * 调整主结构
 * @param {string} apiUrl - API地址
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {Object} mainStructure - 当前主结构
 * @param {string} adjustedContent - 调整内容
 * @param {Object} selectedConfig - 选中的配置项
 * @returns {Promise<Object>} 调整后的主结构
 */
export const adjustMainStructure = async (
  apiUrl,
  apiKey,
  model,
  mainStructure,
  adjustedContent,
  selectedConfig
) => {
  try {
    return await apiAdjustMainStructure(apiUrl, apiKey, model, mainStructure, adjustedContent, selectedConfig);
  } catch (error) {
    throw new Error(`调整主结构失败: ${error.message}`);
  }
};

/**
 * 调整详细内容
 * @param {string} apiUrl - API地址
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {string} originalContent - 原始内容
 * @param {string} adjustedContent - 调整内容
 * @param {Object} nodeIndexes - 节点索引
 * @param {Object} mainStructure - 主结构
 * @param {Array} messages - 消息列表
 * @param {Object} selectedConfig - 选中的配置项
 * @returns {Promise<Object>} 调整后的详细内容
 */
export const adjustDetail = async (
  apiUrl,
  apiKey,
  model,
  originalContent,
  adjustedContent,
  nodeIndexes,
  mainStructure,
  messages,
  selectedConfig
) => {
  try {
    return await apiAdjustDetail(
      apiUrl,
      apiKey,
      model,
      originalContent,
      adjustedContent,
      nodeIndexes,
      mainStructure,
      messages,
      selectedConfig
    );
  } catch (error) {
    throw new Error(`调整详细内容失败: ${error.message}`);
  }
};

/**
 * 生成详细内容
 * @param {Object} nodeIndexes - 节点索引
 * @param {Object} mainStructure - 主结构
 * @param {Array} messages - 消息列表
 * @param {Object} selectedConfig - 选中的配置项
 * @param {Object} params - 其他参数
 * @returns {Promise<void>}
 */
export const generateDetailContent = async (
  nodeIndexes,
  mainStructure,
  messages,
  selectedConfig,
  params
) => {
  const {
    apiUrl,
    apiKey,
    model,
    setMessages,
    setChatHistories,
    currentChatIndex
  } = params;

  try {
    const { functionResult } = await generateNewDetail(
      apiUrl,
      apiKey,
      model,
      nodeIndexes,
      mainStructure,
      messages,
      selectedConfig
    );

    const newMessage = createAssistantMessage(
      functionResult[selectedConfig.terms.detail],
      selectedConfig.terms.sectionDetailType,
      {
        ...functionResult,
        nodeIndexes,
      },
      selectedConfig
    );

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const insertIndex = findInsertIndex(nodeIndexes, updatedMessages, selectedConfig.terms);
      updatedMessages.splice(insertIndex, 0, newMessage);
      return updatedMessages;
    });

    setChatHistories((prevHistories) => {
      const updatedHistories = [...prevHistories];
      const targetChat = updatedHistories[currentChatIndex];
      if (targetChat) {
        const insertIndex = findInsertIndex(nodeIndexes, targetChat.messages, selectedConfig.terms);
        targetChat.messages.splice(insertIndex, 0, newMessage);
      }
      return updatedHistories;
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const messageElements = document.querySelectorAll('.mb-4.p-4.rounded-lg.shadow-md');
    const lastMessage = messageElements[messageElements.length - 1];
    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (error) {
    console.error('生成细节内容时发生错误:', error);
    throw error;
  }
};

/**
 * 从消息列表中获取动态配置
 * @param {Array} messages - 消息列表
 * @param {Object} selectedConfig - 当前选中的配置
 * @returns {Object} 配置对象
 */
const getDynamicConfigFromMessages = (messages, selectedConfig) => {
  if (!selectedConfig.isDynamic) {
    return selectedConfig;
  }

  // 查找最近的主结构消息，它应该包含正确的配置
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.type === 'mainStructure' && message.selectedConfig) {
      return message.selectedConfig;
    }
  }

  return selectedConfig;
};

/**
 * 生成下一个详细内容
 * @param {Object} startNodeIndexes - 起始节点索引
 * @param {Object} mainStructure - 主结构
 * @param {Array} messages - 消息列表
 * @param {Object} selectedConfig - 选中的配置项
 * @param {Object} params - 其他参数
 * @returns {Promise<void>}
 */
export const generateNextDetail = async (
  startNodeIndexes,
  mainStructure,
  messages,
  selectedConfig,
  params
) => {
  // 首先获取正确的配置
  const config = getDynamicConfigFromMessages(messages, selectedConfig);
  
  if (!config) {
    throw new Error('无法获取配置信息');
  }

  const { terms } = config;
  if (!terms) {
    throw new Error('配置文件缺失或未定义');
  }

  if (!mainStructure || !mainStructure[terms.node1]) {
    throw new Error(`流程设计结构不完整，无法生成${terms.detail}`);
  }

  // 处理简单节点
  if (startNodeIndexes.isSimpleNode) {
    // ... existing code for simple nodes ...
  }

  // 获取当前节点的数据
  const node2Data = mainStructure[terms.node1][startNodeIndexes.node2Name];
  if (!Array.isArray(node2Data) || startNodeIndexes.node3 < 1 || startNodeIndexes.node3 > node2Data.length) {
    throw new Error(`${terms.node2} 节点 "${startNodeIndexes.node2Name}" 的索引 ${startNodeIndexes.node3} 超出范围`);
  }

  const node3Data = node2Data[startNodeIndexes.node3 - 1];
  if (!node3Data[terms.content] || startNodeIndexes.node4 < 1 || startNodeIndexes.node4 > node3Data[terms.content].length) {
    throw new Error(`${terms.node4} 索引 ${startNodeIndexes.node4} 超出范围`);
  }

  try {
    // 获取正确的配置
    const configToUse = getDynamicConfigFromMessages(messages, selectedConfig);
    const terms = configToUse.terms;
    const node2Items = terms.node2;
    const node2ComplexItems = terms.node2ComplexItems;

    let node2Index = startNodeIndexes.node2Index || 0;
    let node3Index = startNodeIndexes.node3Index || 0;
    let node4Index = startNodeIndexes.node4Index || 0;

    let isFirstNode2Loop = true;
    for (; node2Index < node2Items.length; node2Index++) {
      const node2Name = node2Items[node2Index];
      const node2Data = mainStructure[terms.node1][node2Name];

      if (!node2Data) continue;

      const isComplexItem = node2ComplexItems.includes(node2Name);

      if (isComplexItem) {
        let isFirstNode3Loop = isFirstNode2Loop;
        for (; node3Index < node2Data.length; node3Index++) {
          const node3Item = node2Data[node3Index];
          const node4Array = node3Item[terms.content];

          if (!node4Array) continue;

          let isFirstNode4Loop = isFirstNode3Loop;
          for (; node4Index < node4Array.length; node4Index++) {
            const nodeIndexes = {
              node2Name,
              node2Index,
              node3Index,
              node4Index,
              node3: node3Index + 1,
              node4: node4Index + 1,
            };

            if (!params.isGeneratingRef.current) return;

            const existingMessage = messages.find((msg) => {
              if (msg.type !== terms.sectionDetailType) return false;
              if (!msg.data.nodeIndexes || !msg.data.nodeIndexes.node3) {
                return false;
              }
              return (
                msg.data.nodeIndexes.node2Name === nodeIndexes.node2Name &&
                msg.data.nodeIndexes.node3 === nodeIndexes.node3 &&
                msg.data.nodeIndexes.node4 === nodeIndexes.node4
              );
            });

            if (existingMessage) {
              console.log(`跳过已存在的索引：${nodeIndexes.node2Name}-${nodeIndexes.node3}-${nodeIndexes.node4}`);
              continue;
            }

            console.log(`开始生成索引：${nodeIndexes.node2Name}-${nodeIndexes.node3}-${nodeIndexes.node4}`);
            await generateDetailContent(nodeIndexes, mainStructure, messages, configToUse, {
              apiUrl: params.apiUrl,
              apiKey: params.apiKey,
              model: params.model,
              setMessages: params.setMessages,
              setChatHistories: params.setChatHistories,
              currentChatIndex: params.currentChatIndex
            });

            if (isFirstNode4Loop) {
              node4Index = 0;
              isFirstNode4Loop = false;
            }
          }
          node4Index = 0;
          isFirstNode3Loop = false;
        }
        node3Index = 0;
      } else {
        const nodeIndexes = {
          node2Name,
          node2Index,
          isSimpleNode: true,
          content: node2Data,
        };

        if (!params.isGeneratingRef.current) return;

        const existingMessage = messages.find((msg) => {
          if (msg.type !== terms.sectionDetailType) return false;
          if (!msg.data.nodeIndexes) {
            return msg.data.title === node2Name || msg.title === node2Name;
          }
          return (
            msg.data.nodeIndexes.node2Name === nodeIndexes.node2Name &&
            msg.data.nodeIndexes.isSimpleNode
          );
        });

        if (existingMessage) {
          console.log(`跳过已存在的简单节点：${nodeIndexes.node2Name}`);
          continue;
        }

        console.log(`开始生成简单节点：${nodeIndexes.node2Name}`);
        await generateDetailContent(nodeIndexes, mainStructure, messages, configToUse, {
          apiUrl: params.apiUrl,
          apiKey: params.apiKey,
          model: params.model,
          setMessages: params.setMessages,
          setChatHistories: params.setChatHistories,
          currentChatIndex: params.currentChatIndex
        });
      }
      isFirstNode2Loop = false;
    }

    params.setIsGenerating(false);
  } catch (error) {
    console.error('生成细节内容时发生错误:', error);
    params.setError(`生成细节内容时发生错误: ${error.message}`);
    params.setIsGenerating(false);
  }
};

/**
 * 生成新的详细内容
 * @param {string} apiUrl - API地址
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {Object} nodeIndexes - 节点索引
 * @param {Object} mainStructure - 主结构
 * @param {Array} messages - 消息列表
 * @param {Object} selectedConfig - 选中的配置项
 * @returns {Promise<Object>} 生成的结果
 */
export const generateNewDetail = async (
  apiUrl,
  apiKey,
  model,
  nodeIndexes,
  mainStructure,
  messages,
  selectedConfig
) => {
  try {
    return await apiGenerateNewDetail(
      apiUrl,
      apiKey,
      model,
      nodeIndexes,
      mainStructure,
      messages,
      selectedConfig
    );
  } catch (error) {
    throw new Error(`生成详细内容失败: ${error.message}`);
  }
};

/**
 * 转换动态配置的主结构以匹配现有函数的期望格式
 * @param {Object} mainStructure - 原始主结构
 * @param {Object} config - 配置对象
 * @returns {Object} 转换后的主结构
 */
const transformMainStructure = (mainStructure, config) => {
  if (!mainStructure || !config || !config.terms || !config.terms.node1) {
    return mainStructure;
  }

  // 获取原始主结构的第一个键
  const originalKey = Object.keys(mainStructure)[0];
  if (!originalKey) {
    return mainStructure;
  }

  const originalData = mainStructure[originalKey];
  const transformedData = {};
  const node2ComplexItems = config.terms.node2ComplexItems || [];
  const { title, content, detail } = config.terms;

  // 获取或创建节点顺序，同时保持向后兼容性
  let nodeOrder;
  if (mainStructure.nodeOrder) {
    // 如果已经有节点顺序，验证其有效性
    nodeOrder = mainStructure.nodeOrder.filter(key => originalData[key]);
    // 如果有新增节点，将其添加到顺序末尾
    const missingKeys = Object.keys(originalData).filter(key => !nodeOrder.includes(key));
    nodeOrder = [...nodeOrder, ...missingKeys];
  } else {
    // 创建新的节点顺序，确保复杂节点在前面
    try {
      const complexItems = Object.keys(originalData).filter(key => 
        node2ComplexItems?.includes?.(key) || false);
      const simpleItems = Object.keys(originalData).filter(key => 
        !(node2ComplexItems?.includes?.(key) || false));
      nodeOrder = [...complexItems, ...simpleItems];
    } catch (error) {
      // 如果出现错误，回退到简单的键排序
      console.warn('节点排序出现错误，使用默认排序', error);
      nodeOrder = Object.keys(originalData);
    }
  }

  // 按照节点顺序转换数据，添加错误处理
  for (const node2Key of nodeOrder) {
    try {
      if (!originalData[node2Key]) continue;
      
      const node2Data = originalData[node2Key];
      if (node2ComplexItems?.includes?.(node2Key)) {
        transformedData[node2Key] = Array.isArray(node2Data) ? 
          node2Data.map(item => ({
            [title]: item[title] || '',
            [content]: Array.isArray(item[content]) ? item[content] : [],
            [detail]: true
          })) : 
          [{
            [title]: node2Data[title] || '',
            [content]: Array.isArray(node2Data[content]) ? node2Data[content] : [],
            [detail]: true
          }];
      } else {
        transformedData[node2Key] = typeof node2Data === 'string' ? 
          node2Data : 
          (node2Data[title] || String(node2Data));
      }
    } catch (error) {
      console.error(`处理节点 ${node2Key} 时出错:`, error);
      // 保持原始数据以避免数据丢失
      transformedData[node2Key] = originalData[node2Key];
    }
  }

  return {
    [config.terms.node1]: transformedData,
    nodeOrder: nodeOrder,
    version: '2.0'
  };
};

/**
 * 生成动态配置
 * @param {string} apiUrl - API地址
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {string} userContent - 用户输入内容
 * @returns {Promise<Object>} 生成的动态配置
 */
export const generateDynamicConfig = async (apiUrl, apiKey, model, userContent) => {
  try {
    const result = await apiGenerateDynamicConfig(apiUrl, apiKey, model, userContent);
    
    // 如果是主结构生成的响应，转换结构以匹配现有函数
    if (result.functionResult && typeof result.functionResult === 'object') {
      result.functionResult = transformMainStructure(result.functionResult, result.config);
    }
    
    return result;
  } catch (error) {
    throw new Error(`生成动态配置失败: ${error.message}`);
  }
}; 