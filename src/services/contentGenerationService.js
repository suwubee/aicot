// contentGenerationService.js
import { createAssistantMessage } from './messageService';
import { findInsertIndex } from './messageService';
import {
  generateNewMainStructure as apiGenerateNewMainStructure,
  adjustMainStructure as apiAdjustMainStructure,
  generateNewDetail as apiGenerateNewDetail,
  adjustDetail as apiAdjustDetail,
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
    return await apiGenerateNewMainStructure(apiUrl, apiKey, model, userContent, selectedConfig);
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
  const {
    apiUrl,
    apiKey,
    model,
    setMessages,
    setChatHistories,
    currentChatIndex,
    isGeneratingRef,
    setError,
    setIsGenerating
  } = params;

  try {
    const terms = selectedConfig.terms;
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

            if (!isGeneratingRef.current) return;

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
            await generateDetailContent(nodeIndexes, mainStructure, messages, selectedConfig, {
              apiUrl,
              apiKey,
              model,
              setMessages,
              setChatHistories,
              currentChatIndex
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

        if (!isGeneratingRef.current) return;

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
        await generateDetailContent(nodeIndexes, mainStructure, messages, selectedConfig, {
          apiUrl,
          apiKey,
          model,
          setMessages,
          setChatHistories,
          currentChatIndex
        });
      }
      isFirstNode2Loop = false;
    }

    setIsGenerating(false);
  } catch (error) {
    console.error('生成细节内容时发生错误:', error);
    setError(`生成细节内容时发生错误: ${error.message}`);
    setIsGenerating(false);
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