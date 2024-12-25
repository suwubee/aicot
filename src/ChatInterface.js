// ChatInterface.js

import React, { useState, useRef, useEffect } from 'react';
import ChatInterfaceView from './ChatInterfaceView';
import {
  generateNewMainStructure,
  adjustMainStructure,
  generateNewDetail,
  adjustDetail,
} from './api';
import defaultConfig from './config'; 

const models = [
  { value: 'gpt-4o-mini', label: 'GPT-4O Mini' },
  { value: 'gpt-4o-2024-08-06', label: 'GPT-4O (2024-08-06)' },
  { value: 'o1-mini', label: 'o1-mini' },
  { value: 'gpt-4o', label: 'GPT-4O' },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState(() => {
    const storedMessages = localStorage.getItem('messages');
    return storedMessages ? JSON.parse(storedMessages) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => {
    const storedApiUrl = localStorage.getItem('apiUrl');
    return storedApiUrl || 'https://chatapi.aisws.com/v1/chat/completions';
  });
  const [apiKey, setApiKey] = useState(() => {
    const storedApiKey = localStorage.getItem('apiKey');
    return storedApiKey || '';
  });
  const [model, setModel] = useState('gpt-4o-mini');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState('');
  const [mainStructure, setMainStructure] = useState(null);
  const [adjustedContent, setAdjustedContent] = useState('');
  const scrollAreaRef = useRef(null);
  const textareaRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(isGenerating);
  const [isFinished, setIsFinished] = useState(false);
  const [currentNodeIndexes, setCurrentNodeIndexes] = useState({
    node1: 1,
    node2: 1,
    node3: 1,
    node4: 1,
  });
  const [currentChatIndex, setCurrentChatIndex] = useState(0);
  const [chatHistories, setChatHistories] = useState(() => {
    const storedChatHistories = localStorage.getItem('chatHistories');
    return storedChatHistories
      ? JSON.parse(storedChatHistories)
      : [
          {
            title: '未命名',
            messages: [],
            mainStructure: null,
          },
        ];
  });
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const fileInputRef = useRef(null);
  const [configurations, setConfigurations] = useState(() => {
    const storedConfigs = localStorage.getItem('configurations');
    let parsedConfigs = [];
    if (storedConfigs) {
      try {
        parsedConfigs = JSON.parse(storedConfigs);
      } catch (error) {
        console.error('解析配置项时发生错误:', error);
        parsedConfigs = [];
      }
    }
    if (parsedConfigs && parsedConfigs.length > 0) {
      return parsedConfigs;
    } else {
      // 如果没有存储的配置，使用默认配置
      const defaultConfigurations = [
        {
          id: 'default',
          name: '示例配置',
          terms: defaultConfig.terms,
          fixedDescriptions: defaultConfig.fixedDescriptions,
          systemRolePrompt: defaultConfig.systemRolePrompt,
        },
      ];
      localStorage.setItem('configurations', JSON.stringify(defaultConfigurations));
      return defaultConfigurations;
    }
  });

  const [selectedConfig, setSelectedConfig] = useState(() => {
    const storedSelectedConfig = localStorage.getItem('selectedConfig');
    let parsedConfig = null;
    if (storedSelectedConfig) {
      try {
        parsedConfig = JSON.parse(storedSelectedConfig);
      } catch (error) {
        console.error('解析选中配置项时发生错误:', error);
        parsedConfig = null;
      }
    }
    if (parsedConfig) {
      return parsedConfig;
    } else if (configurations && configurations.length > 0) {
      // 如果没有选中的默认选择第一
      const defaultConfig = configurations[0];
      localStorage.setItem('selectedConfig', JSON.stringify(defaultConfig));
      return defaultConfig;
    } else {
      return null;
    }
  });

  function renderDetailContent(detailData, nodeIndexes, nodeTitle, subNodeTitle, messageConfig) {
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
  }

  const configFileInputRef = useRef(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('apiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }

    // 从 localStorage 加载聊天记录
    const storedChatHistories = localStorage.getItem('chatHistories');
    if (storedChatHistories) {
      try {
        const parsedHistories = JSON.parse(storedChatHistories);
        setChatHistories(parsedHistories);

        // 恢 currentChatIndex
        const storedCurrentChatIndex = localStorage.getItem('currentChatIndex');
        if (storedCurrentChatIndex !== null) {
          const index = parseInt(storedCurrentChatIndex, 10);
          setCurrentChatIndex(index);

          // 恢复当前聊天的状态
          const currentHistory = parsedHistories[index];
          if (currentHistory) {
            setMessages(currentHistory.messages || []);
            setMainStructure(currentHistory.mainStructure || null);
            setCurrentNodeIndexes(currentHistory.currentNodeIndexes || {
              node1: 1,
              node2: 1,
              node3: 1,
              node4: 1,
            });
          }
        } else {
          // 如果没有保存的 currentChatIndex，默认选择第一个聊天
          setCurrentChatIndex(0);
          if (parsedHistories.length > 0) {
            const firstHistory = parsedHistories[0];
            setMessages(firstHistory.messages || []);
            setMainStructure(firstHistory.mainStructure || null);
            setCurrentNodeIndexes(firstHistory.currentNodeIndexes || {
              node1: 1,
              node2: 1,
              node3: 1,
              node4: 1,
            });
          }
        }
      } catch (error) {
        console.error('从 localStorage 解析 chatHistories 失败:', error);
        localStorage.removeItem('chatHistories');
        localStorage.removeItem('currentChatIndex');
      }
    } else {
      // 如果没有聊天记录，初始化一个空的未命名聊天
      const initialChat = {
        title: '未命名',
        messages: [],
        mainStructure: null,
        currentNodeIndexes: {
          node1: 1,
          node2: 1,
          node3: 1,
          node4: 1,
        },
      };
      setChatHistories([initialChat]);
      setCurrentChatIndex(0);
      setMessages([]);
      setMainStructure(null);
    }

    // 在 useEffect 中添加以下代码，用于加载保存的 API URL
    const storedApiUrl = localStorage.getItem('apiUrl');
    if (storedApiUrl) {
      setApiUrl(storedApiUrl);
    }

    // 当 apiUrl 或 apiKey 变化时，保存到 localStorage
    localStorage.setItem('apiUrl', apiUrl);
    localStorage.setItem('apiKey', apiKey);
  }, [apiUrl, apiKey]);

  useEffect(() => {
    localStorage.setItem('chatHistories', JSON.stringify(chatHistories));
    if (currentChatIndex !== null) {
      localStorage.setItem('currentChatIndex', currentChatIndex.toString());
    } else {
      localStorage.removeItem('currentChatIndex');
    }
  }, [chatHistories, currentChatIndex]);

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.type === 'mainStructure') {
      setMainStructure(latestMessage.data);
    }
  }, [messages]);
  
  useEffect(() => {
    if (mainStructure) {
      setIsFinished(false);
      setIsGenerating(false);
    }
  }, [mainStructure]);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const storedMessages = localStorage.getItem('messages');
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error('解析 messages 时发生错误:', error);
        setMessages([]);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!selectedConfig) {
      alert('请先选择一个配置项！');
      return;
    }
    setError('');

    const newUserMessage = { 
      role: 'user', 
      content: input, 
      type: 'user', 
      selectedConfig: selectedConfig // 保存当前的 selectedConfig
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const userContent = input;

      // 调用新建流程设计的函数
      const { functionResult } = await generateNewMainStructure(
        apiUrl,
        apiKey,
        model,
        userContent,
        selectedConfig
      );

      if (functionResult) {
        setMainStructure(functionResult);

        // 更新消息列表，添加 AI 的回复，包括流程设计内容和调整按钮
        const assistantContent =
          `${selectedConfig.terms.node1}:\n` + JSON.stringify(functionResult, null, 2);

        const newAssistantMessage = {
          role: 'assistant',
          content: assistantContent,
          type: 'mainStructure',
          data: functionResult,
          selectedConfig: selectedConfig, // 添加 selectedConfig
        };
        setMessages((prev) => {
          const updatedMessages = [
            ...prev,
            newAssistantMessage,
          ];

          // 在这里直接使用 functionResult 而不是状态中的 mainStructure
          saveChatHistory(updatedMessages, functionResult);
          return updatedMessages;
        });
      } else {
        throw new Error('AI 返回的数据格式有误，请重试。');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`发生错误: ${error.message}。请重试。`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e);
    }
  };

  const handleApiKeyChange = (e) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    localStorage.setItem('apiKey', newApiKey);
  };

  const handleAdjustSubmit = async (message, adjustedContent, nodeIndexes = null) => {
    try {
      setIsAdjusting(true);

      // 获取配置项
      const config = message.selectedConfig || selectedConfig;
      if (!config) {
        setError('配置未定义');
        setIsAdjusting(false);
        return;
      }
      const terms = config.terms;

      if (message.type === 'mainStructure') {
        // 调用调整流程设计函数
        const { functionResult } = await adjustMainStructure(
          apiUrl,
          apiKey,
          model,
          message.data || JSON.parse(message.content.slice(6)),
          adjustedContent,
          config
        );

        // 更新消息列表，添加 AI 的回复，包括流程设计内容和调整按钮
        const assistantContent =
          `${config.terms.node1}:\n` + JSON.stringify(functionResult, null, 2);

        const newAssistantMessage = {
          role: 'assistant',
          content: assistantContent,
          type: 'mainStructure',
          data: functionResult,
          selectedConfig: config,
        };

        setMessages((prev) => {
          const updatedMessages = [
            ...prev,
            newAssistantMessage,
          ];
          saveChatHistory(updatedMessages);
          return updatedMessages;
        });

        // 更新当前流程设计
        setMainStructure(functionResult);
      } else if (message.type === terms.sectionDetailType) {
        // 调用调整详细内容的函数，传递 mainStructure 参数
        const { functionResult } = await adjustDetail(
          apiUrl,
          apiKey,
          model,
          message.data[terms.detail],
          adjustedContent,
          nodeIndexes,
          mainStructure,
          messages,
          config
        );

        // 在调用 renderDetailContent 时，传入 config
        const assistantContent = renderDetailContent(
          functionResult,
          nodeIndexes,
          functionResult[terms.title],
          functionResult[terms.title],
          config
        );

        setMessages((prev) => {
          // 更新匹配的 sectionDetailType 消息
          const updatedMessages = prev.map((msg) => {
            if (
              msg.type === terms.sectionDetailType &&
              msg.data.nodeIndexes.node3 === nodeIndexes.node3 &&
              msg.data.nodeIndexes.node4 === nodeIndexes.node4
            ) {
              return {
                ...msg,
                content: assistantContent,
                data: functionResult,
                selectedConfig: config,
              };
            }
            return msg;
          });
          saveChatHistory(updatedMessages);
          return updatedMessages;
        });
      }

      // 重置输入框
      setAdjustedContent('');
    } catch (error) {
      console.error('Error:', error);
      setError(`发生错误: ${error.message}。请重试。`);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleContinue = async (startNodeIndexes) => {
    try {
      setIsFinished(false);
      setIsGenerating(true);

      // 等待状态更新完成
      await new Promise((resolve) => setTimeout(resolve, 0));

      // 开始从指定的节点索引生成内容
      await generateNextDetail(startNodeIndexes);
    } catch (error) {
      console.error('Error:', error);
      setError(`生成流程时发生错误: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateNextDetail = async (startNodeIndexes) => {
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
          // 处理复杂项
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

              // 修改检查逻辑，兼容旧格式
              const existingMessage = messages.find((msg) => {
                if (msg.type !== terms.sectionDetailType) return false;
                
                // 处理旧格式的消息
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
              await generateDetailContent(nodeIndexes);
              await new Promise((resolve) => setTimeout(resolve, 0));

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
          // 处理简单项
          const nodeIndexes = {
            node2Name,
            node2Index,
            isSimpleNode: true,
            content: node2Data,
          };

          if (!isGeneratingRef.current) return;

          // 修改检查逻辑，兼容旧格式
          const existingMessage = messages.find((msg) => {
            if (msg.type !== terms.sectionDetailType) return false;
            
            // 检查是否为旧格式的消息
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
          await generateDetailContent(nodeIndexes);
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        isFirstNode2Loop = false;
      }

      setIsFinished(true);
    } catch (error) {
      console.error('生成细节内容时发生错误:', error);
      setError(`生成细节内容时发生错误: ${error.message}`);
      setIsGenerating(false);
    }
  };

  const generateDetailContent = async (nodeIndexes) => {
    // 保存请求时的 currentChatIndex
    const requestChatIndex = currentChatIndex;

    try {
      // 调用生成详细内容的 API
      const { functionResult } = await generateNewDetail(
        apiUrl,
        apiKey,
        model,
        nodeIndexes,
        mainStructure,
        messages,
        selectedConfig
      );

      const newMessage = {
        role: 'assistant',
        type: selectedConfig.terms.sectionDetailType,
        content: functionResult[selectedConfig.terms.detail],
        data: {
          ...functionResult,
          nodeIndexes,
        },
      };

      // 更新 messages
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const insertIndex = findInsertIndex(nodeIndexes);
        updatedMessages.splice(insertIndex, 0, newMessage);
        return updatedMessages;
      });

      // 更新 chatHistories
      setChatHistories((prevHistories) => {
        const updatedHistories = [...prevHistories];
        const targetChat = updatedHistories[requestChatIndex];
        if (targetChat) {
          const insertIndex = findInsertIndex(nodeIndexes, targetChat.messages);
          targetChat.messages.splice(insertIndex, 0, newMessage);
        }
        return updatedHistories;
      });

      // 等待状态更新完成
      await new Promise((resolve) => setTimeout(resolve, 0));
    } catch (error) {
      console.error('生成细节内容时发生错误:', error);
      setError(`生成细节内容时发生错误: ${error.message}`);
      setIsGenerating(false);
    }
  };

  // 修改 findInsertIndex 函数，添加第二个参数 messagesList
  const findInsertIndex = (nodeIndexes, messagesList = messages) => {
    const terms = selectedConfig.terms;

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

  const saveChatHistory = (updatedMessages, currentMainStructure) => {
    const title = updatedMessages[0]?.content.slice(0, 10) || '未命名';
    const updatedHistories = [...chatHistories];
    updatedHistories[currentChatIndex] = {
      title,
      messages: updatedMessages,
      mainStructure: currentMainStructure || mainStructure, // 使用最新的 mainStructure
      currentNodeIndexes,
      selectedConfig, // 存储 selectedConfig
    };
    setChatHistories(updatedHistories);
  };

  const handleChatClick = (index) => {
    const chatHistory = chatHistories[index];
    if (chatHistory) {
      setMessages(chatHistory.messages || []);
      setCurrentChatIndex(index);
      setMainStructure(chatHistory.mainStructure || null); // 恢复保存的 mainStructure
      setCurrentNodeIndexes(chatHistory.currentNodeIndexes || {
        node1: 1,
        node2: 1,
        node3: 1,
        node4: 1,
      });
      setSelectedConfig(chatHistory.selectedConfig || null); // 恢复 selectedConfig
    } else {
      console.error(`未找到索引为 ${index} 的聊天记录`);
    }
  };

  const startNewChat = () => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }

    const newChatHistory = {
      title: '未命名',
      messages: [],
      mainStructure: null,
      currentNodeIndexes: {
        node1: 1,
        node2: 1,
        node3: 1,
        node4: 1,
      },
      selectedConfig, // 保存当前的 selectedConfig
    };

    setChatHistories((prevHistories) => {
      const updatedHistories = [...prevHistories, newChatHistory];
      localStorage.setItem('chatHistories', JSON.stringify(updatedHistories));
      return updatedHistories;
    });

    setMessages([]);
    setMainStructure(null);
    setCurrentNodeIndexes({
      node1: 1,
      node2: 1,
      node3: 1,
      node4: 1,
    });
    setCurrentChatIndex(chatHistories.length);
    // 保持 selectedConfig 不变
  };

  const handleContinueFromMessage = (nodeIndexes) => {
    handleContinue(nodeIndexes);
  };

  // 导出聊天记录和配置项
  const handleExport = () => {
    const dataStr = JSON.stringify({
      chatHistories,
      configurations,
      selectedConfig,
    }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chat_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导入聊天记录和配置项
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          setChatHistories(importedData.chatHistories || []);
          setConfigurations(importedData.configurations || []);
          setSelectedConfig(importedData.selectedConfig || null);
          setMessages([]);
          setMainStructure(null);
          setCurrentChatIndex(null);
          localStorage.setItem('chatHistories', JSON.stringify(importedData.chatHistories || []));
          localStorage.setItem('configurations', JSON.stringify(importedData.configurations || []));
          localStorage.setItem('selectedConfig', JSON.stringify(importedData.selectedConfig || null));
          localStorage.removeItem('currentChatIndex');
          alert('导入成功！');
        } catch (error) {
          console.error('导入失败:', error);
          alert('导入失败，请确保文件格式正确。');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleConfigChange = (configId) => {
    const config = configurations.find((cfg) => cfg.id === configId);
    setSelectedConfig(config);
    localStorage.setItem('selectedConfig', JSON.stringify(config));
  };

  const handleConfigAdd = () => {
    const newConfig = {
      ...defaultConfig,
      id: Date.now().toString(),  // 生成唯一的ID
      name: '思考模型',  // 默认名称
    };
    const updatedConfigs = [...configurations, newConfig];
    setConfigurations(updatedConfigs);
    setSelectedConfig(newConfig);
    localStorage.setItem('configurations', JSON.stringify(updatedConfigs));
    localStorage.setItem('selectedConfig', JSON.stringify(newConfig));
  };

  const handleConfigEdit = (configId) => {
    const configToEdit = configurations.find((cfg) => cfg.id === configId);
    if (configToEdit) {
      // 打开一个编辑框，用户可以直接编辑 JSON 数据
      const newConfigString = prompt('编辑配置项 (JSON 格式)：', JSON.stringify(configToEdit, null, 2));
      if (newConfigString) {
        try {
          const newConfig = JSON.parse(newConfigString);
          if (!newConfig.name) {
            alert('配置项必须包含名称');
            return;
          }
          const updatedConfigs = configurations.map((cfg) =>
            cfg.id === configId ? newConfig : cfg
          );
          setConfigurations(updatedConfigs);
          if (selectedConfig.id === configId) {
            setSelectedConfig(newConfig);
            localStorage.setItem('selectedConfig', JSON.stringify(newConfig));
          }
          localStorage.setItem('configurations', JSON.stringify(updatedConfigs));
        } catch (error) {
          alert('无效的 JSON 格式');
        }
      }
    }
  };

  const handleConfigDelete = (configId) => {
    const updatedConfigs = configurations.filter((cfg) => cfg.id !== configId);
    setConfigurations(updatedConfigs);
    if (selectedConfig && selectedConfig.id === configId) {
      setSelectedConfig(null);
      localStorage.removeItem('selectedConfig');
    }
    localStorage.setItem('configurations', JSON.stringify(updatedConfigs));
  };

  const handleExportConfigs = () => {
    const dataStr = JSON.stringify({
      configurations,
      selectedConfig,
    }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'configurations.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportConfigs = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          setConfigurations(importedData.configurations);
          setSelectedConfig(importedData.selectedConfig);
          localStorage.setItem('configurations', JSON.stringify(importedData.configurations));
          localStorage.setItem('selectedConfig', JSON.stringify(importedData.selectedConfig));
          alert('配置项导入成功！');
        } catch (error) {
          console.error('导入配置项失败:', error);
          alert('导入失败，请确保文件格式正确。');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportMarkdown = () => {
    try {
      let markdownContent = '';
      
      messages.forEach(message => {
        // 检查消息类型和数据结构
        if (message.type === selectedConfig.terms.sectionDetailType) {
          // 添加数据验证
          if (!message.data || !message.data.nodeIndexes) {
            console.warn('消息缺少必要的数据结构:', message);
            return; // 跳过这条消息
          }

          // 安全地获取标题
          const title = message.data.标题 || message.data.title || '未命名章节';
          
          // 构建 markdown 内容
          markdownContent += `### ${title}\n\n`;
          
          // 安全地添加内容
          if (message.content) {
            markdownContent += `${message.content}\n\n`;
          }
        }
      });

      // 创建并下载文件
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chat_content.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('导出 Markdown 时发生错误:', error);
      setError(`导出失败: ${error.message}`);
    }
  };

  return (
    <div>
      <ChatInterfaceView
        messages={messages}
        chatHistories={chatHistories}
        setChatHistories={setChatHistories}
        setMessages={setMessages}
        error={error}
        input={input}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
        handleKeyDown={handleKeyDown}
        setInput={setInput}
        scrollAreaRef={scrollAreaRef}
        textareaRef={textareaRef}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        apiUrl={apiUrl}
        setApiUrl={(url) => {
          setApiUrl(url);
          localStorage.setItem('apiUrl', url);
        }}
        apiKey={apiKey}
        handleApiKeyChange={handleApiKeyChange}
        model={model}
        setModel={setModel}
        models={models}
        mainStructure={mainStructure}
        adjustedContent={adjustedContent}
        setAdjustedContent={setAdjustedContent}
        handleAdjustSubmit={handleAdjustSubmit}
        handleContinue={handleContinue}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
        isFinished={isFinished}
        currentChatIndex={currentChatIndex}
        setCurrentChatIndex={setCurrentChatIndex}
        startNewChat={startNewChat}
        saveChatHistory={saveChatHistory}
        handleChatClick={handleChatClick}
        isAdjusting={isAdjusting}
        setError={setError}
        handleContinueFromMessage={handleContinueFromMessage}
        setMainStructure={setMainStructure}  // 添加这行
        handleExport={handleExport}
        handleImportClick={handleImportClick}
        handleImport={handleImport}
        fileInputRef={fileInputRef}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        configurations={configurations}
        setConfigurations={setConfigurations}
        selectedConfig={selectedConfig}
        setSelectedConfig={setSelectedConfig}
        handleConfigChange={handleConfigChange}
        handleConfigAdd={handleConfigAdd}
        handleConfigEdit={handleConfigEdit}
        handleConfigDelete={handleConfigDelete}
        handleExportConfigs={handleExportConfigs}
        handleImportConfigs={handleImportConfigs}
        configFileInputRef={configFileInputRef}
        handleExportMarkdown={handleExportMarkdown}
      />
    </div>
  );
}
