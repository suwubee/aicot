// ChatInterface.js

import React, { useState, useRef, useEffect } from 'react';
import ChatInterfaceView from './ChatInterfaceView';

/**
 * 服务模块导入和职责说明：
 * 
 * 1. contentGenerationService：处理内容生成相关的 API 调用
 *    - generateNewMainStructure: 生成新的主结构
 *    - adjustMainStructure: 调整现有主结构
 *    - adjustDetail: 调整详细内容
 *    - generateNextDetail: 生成下一个详细内容（内部使用 generateDetailContent）
 */
import {
  generateNewMainStructure,
  adjustMainStructure,
  adjustDetail,
  generateNextDetail,
} from './services/contentGenerationService';

/**
 * 2. messageService：处理消息的创建和渲染
 *    - createUserMessage: 创建用户消息
 *    - createAssistantMessage: 创建助手消息
 *    - renderDetailContent: 渲染详细内容
 */
import {
  createUserMessage,
  createAssistantMessage,
  renderDetailContent
} from './services/messageService';

/**
 * 3. chatHistoryService：处理聊天历史记录的存储和加载
 *    - saveChatHistory: 保存聊天历史
 *    - createNewChat: 创建新的聊天
 *    - loadChatHistories: 加载聊天历史
 *    - saveChatHistoriesToStorage: 保存到本地存储
 *    - saveCurrentChatIndex: 保存当前聊天索引
 */
import {
  saveChatHistory,
  createNewChat,
  loadChatHistories,
  saveChatHistoriesToStorage,
  saveCurrentChatIndex
} from './services/chatHistoryService';

/**
 * 4. configurationService：处理配置项的管理
 *    - loadConfigurations: 加载配置
 *    - loadSelectedConfig: 加载选中的配置
 *    - createNewConfig: 创建新配置
 *    - saveConfigurations: 保存配置
 *    - saveSelectedConfig: 保存选中的配置
 *    - editConfig: 编辑配置
 */
import {
  loadConfigurations,
  loadSelectedConfig,
  createNewConfig,
  saveConfigurations,
  saveSelectedConfig,
  editConfig,
  validateConfigAndApi
} from './services/configurationService';

/**
 * 5. exportImportService：处理数据的导入导出
 *    - exportChatData: 导出聊天数据
 *    - importChatData: 导入聊天数据
 *    - exportConfigurations: 导出配置
 *    - importConfigurations: 导入配置
 *    - exportMarkdown: 导出 Markdown
 */
import {
  exportChatData,
  importChatData,
  exportConfigurations,
  importConfigurations,
  exportMarkdown
} from './services/exportImportService';

import defaultConfig from './config';

/**
 * 模块协作流程：
 * 
 * 1. 用户输入处理流程
 *    用户输入 -> createUserMessage -> generateNewMainStructure -> createAssistantMessage -> 更新状态
 * 
 * 2. 内容生成流程
 *    generateNextDetail -> generateDetailContent -> createAssistantMessage -> 更新状态
 * 
 * 3. 内容调整流程
 *    adjustMainStructure/adjustDetail -> createAssistantMessage -> 更新状态
 * 
 * 4. 历史记录管理
 *    操作完成 -> saveChatHistory -> saveChatHistoriesToStorage
 * 
 * 5. 配置管理
 *    配置变更 -> saveConfigurations/saveSelectedConfig -> 本地存储
 */

const models = [
  { value: 'gpt-4o-mini', label: 'GPT-4O Mini' },
  { value: 'gpt-4o-2024-11-20', label: 'GPT-4O (2024-11-12)' },
  { value: 'gpt-4o-2024-08-06', label: 'GPT-4O (2024-08-06)' },
  { value: 'o1-mini', label: 'o1-mini' },
  { value: 'deepseek-chat', label: 'DeepSeek-V3' },
];

// 添加常量定义
const INITIAL_NODE_INDEXES = {
  node1: 1,
  node2: 1,
  node3: 1,
  node4: 1,
};

// 公共的文件导出函数
const downloadFile = (url, filename) => {
  let link;
  try {
    link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
  } finally {
    if (link && link.parentNode) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }
};

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
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
  const [currentNodeIndexes, setCurrentNodeIndexes] = useState(INITIAL_NODE_INDEXES);
  const [currentChatIndex, setCurrentChatIndex] = useState(() => {
    const storedIndex = localStorage.getItem('currentChatIndex');
    return storedIndex !== null ? parseInt(storedIndex, 10) : 0;
  });
  const [chatHistories, setChatHistories] = useState(() => {
    const storedChatHistories = localStorage.getItem('chatHistories');
    const histories = storedChatHistories ? JSON.parse(storedChatHistories) : [];
    return histories.length > 0 ? histories : [{
      title: '未命名',
      messages: [],
      mainStructure: null,
      currentNodeIndexes: INITIAL_NODE_INDEXES,
      selectedConfig: null
    }];
  });
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const fileInputRef = useRef(null);
  const configFileInputRef = useRef(null);
  const [configurations, setConfigurations] = useState(() => {
    // 创建动态思维链配置（系统固定配置，不存储在缓存中）
    const dynamicConfig = {
      id: 'dynamic',
      name: '动态思维链',
      isDynamic: true,
      isSystemConfig: true, // 标记为系统配置
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
    };

    const storedConfigs = localStorage.getItem('configurations');
    let parsedConfigs = [];
    if (storedConfigs) {
      try {
        parsedConfigs = JSON.parse(storedConfigs);
        // 过滤掉可能存在的旧的动态思维链配置
        parsedConfigs = parsedConfigs.filter(config => config.id !== 'dynamic');
      } catch (error) {
        console.error('解析配置项时发生错误:', error);
        parsedConfigs = [];
      }
    }

    if (parsedConfigs.length > 0) {
      return [dynamicConfig, ...parsedConfigs];
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
      return [dynamicConfig, ...defaultConfigurations];
    }
  });

  const [selectedConfig, setSelectedConfig] = useState(() => {
    const storedSelectedConfig = localStorage.getItem('selectedConfig');
    let parsedConfig = null;
    if (storedSelectedConfig) {
      try {
        parsedConfig = JSON.parse(storedSelectedConfig);
        // 如果存储的是动态思维链配置，使用新的动态配置
        if (parsedConfig.id === 'dynamic') {
          return configurations[0];
        }
      } catch (error) {
        console.error('解析选中配置项时发生错误:', error);
        parsedConfig = null;
      }
    }
    if (parsedConfig) {
      return parsedConfig;
    } else {
      // 默认选择动态思维链配置
      return configurations[0];
    }
  });

  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('apiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }

    // 从 localStorage 加载聊天记录和当前索引
    const histories = loadChatHistories();
    const storedCurrentChatIndex = localStorage.getItem('currentChatIndex');
    const index = storedCurrentChatIndex !== null ? parseInt(storedCurrentChatIndex, 10) : 0;

    // 验证索引的有效性
    const validIndex = index >= 0 && index < histories.length ? index : 0;

    // 设置聊天历史
    setChatHistories(histories);
    setCurrentChatIndex(validIndex);

    // 加载当前聊天的状态
    if (histories.length > 0 && validIndex < histories.length) {
      const currentHistory = histories[validIndex];
      if (currentHistory) {
        setMessages(currentHistory.messages || []);
        setMainStructure(currentHistory.mainStructure || null);
        setCurrentNodeIndexes(currentHistory.currentNodeIndexes || INITIAL_NODE_INDEXES);
        if (currentHistory.selectedConfig) {
          setSelectedConfig(currentHistory.selectedConfig);
        }
      }
    }

    // 加载配置项
    const configs = loadConfigurations(defaultConfig);
    setConfigurations(configs);
    const selected = loadSelectedConfig(configs);
    if (selected) {
      setSelectedConfig(selected);
    }

    // 加载 API URL
    const storedApiUrl = localStorage.getItem('apiUrl');
    if (storedApiUrl) {
      setApiUrl(storedApiUrl);
    }

    // 清除独立存储的消息
    localStorage.removeItem('messages');
  }, []);

  // 添加一个新的 useEffect 来处理聊天历史的持久化
  useEffect(() => {
    if (chatHistories.length > 0) {
      saveChatHistoriesToStorage(chatHistories);
    }
  }, [chatHistories]);

  // 添加一个新的 useEffect 来处理当前聊天索引的持久化
  useEffect(() => {
    if (currentChatIndex !== null) {
      saveCurrentChatIndex(currentChatIndex);
    }
  }, [currentChatIndex]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // 使用全局验证函数，显示弹框提示
    const validation = validateConfigAndApi({ selectedConfig, apiKey, apiUrl, showAlert: true });
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError('');
    setIsLoading(true);
    setIsGenerating(false);
    setIsFinished(false);
    setIsAdjusting(false);

    try {
      // 创建并添加用户消息
      const newUserMessage = createUserMessage(input, selectedConfig);
      setMessages((prev) => [...prev, newUserMessage]);
      setInput('');

      // 如果是动态配置，先生成配置文件
      let configToUse = selectedConfig;
      if (selectedConfig.isDynamic) {
        try {
          const { handleDynamicConfig } = await import('./services/dynamicConfigService');
          const { config, message } = await handleDynamicConfig(apiUrl, apiKey, model, input);
          configToUse = config;
          
          // 添加配置生成消息
          setMessages((prev) => [...prev, message]);
        } catch (error) {
          throw new Error(`生成动态配置失败: ${error.message}`);
        }
      }

      // 生成主结构
      const { functionResult } = await generateNewMainStructure(
        apiUrl,
        apiKey,
        model,
        input,
        configToUse
      );

      if (!functionResult) {
        throw new Error('AI 返回的数据格式有误，请重试。');
      }

      // 更新主结构
      setMainStructure(functionResult);

      // 创建并添加助手消息
      const assistantContent = `${configToUse.terms.node1}:\n${JSON.stringify(functionResult, null, 2)}`;
      const newAssistantMessage = createAssistantMessage(
        assistantContent,
        'mainStructure',
        functionResult,
        configToUse
      );

      // 更新消息和聊天历史
      setMessages((prev) => {
        const updatedMessages = [...prev, newAssistantMessage];
        const newHistory = saveChatHistory(
          updatedMessages,
          functionResult,
          currentNodeIndexes,
          configToUse
        );
        
        // 更新聊天历史
        setChatHistories((prevHistories) => {
          const updated = [...prevHistories];
          updated[currentChatIndex] = newHistory;
          return updated;
        });

        return updatedMessages;
      });

      // 重置节点索引
      setCurrentNodeIndexes(INITIAL_NODE_INDEXES);

    } catch (error) {
      console.error('Error:', error);
      setError(`发生错误: ${error.message}`);
      setMessages((prev) => {
        const newHistory = saveChatHistory(
          prev,
          mainStructure,
          currentNodeIndexes,
          selectedConfig
        );
        setChatHistories((prevHistories) => {
          const updated = [...prevHistories];
          updated[currentChatIndex] = newHistory;
          return updated;
        });
        return prev;
      });
    } finally {
      setIsLoading(false);
      await new Promise(resolve => setTimeout(resolve, 100)); // 确保滚动到底部
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
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
    if (!adjustedContent.trim()) {
      const error = '调整内容不能为空';
      alert(error);
      setError(error);
      return;
    }

    // 使用全局验证函数，显示弹框提示
    const validation = validateConfigAndApi({ selectedConfig, apiKey, apiUrl, showAlert: true });
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      setError('');
      setIsAdjusting(true);
      setIsGenerating(false);
      setIsFinished(false);
      
      const config = message.selectedConfig || selectedConfig;
      if (!config) {
        throw new Error('配置未定义');
      }

      if (message.type === 'mainStructure') {
        // 调整主结构
        const { functionResult } = await adjustMainStructure(
          apiUrl,
          apiKey,
          model,
          message.data,
          adjustedContent,
          config
        );

        if (!functionResult) {
          throw new Error('调整主结构失败，请重试');
        }

        const assistantContent = `${config.terms.node1}:\n${JSON.stringify(functionResult, null, 2)}`;
        const newAssistantMessage = createAssistantMessage(
          assistantContent,
          'mainStructure',
          functionResult,
          config
        );

        // 更新消息和状态
        setMessages((prev) => {
          const updatedMessages = [...prev, newAssistantMessage];
          const newHistory = saveChatHistory(
            updatedMessages,
            functionResult,
            currentNodeIndexes,
            config
          );
          setChatHistories((prevHistories) => {
            const updated = [...prevHistories];
            updated[currentChatIndex] = newHistory;
            return updated;
          });
          return updatedMessages;
        });

        setMainStructure(functionResult);
        
      } else if (message.type === config.terms.sectionDetailType) {
        // 调整详细内容
        const { functionResult } = await adjustDetail(
          apiUrl,
          apiKey,
          model,
          message.data[config.terms.detail],
          adjustedContent,
          nodeIndexes,
          mainStructure,
          messages,
          config
        );

        if (!functionResult) {
          throw new Error('调整详细内容失败，请重试');
        }

        const content = renderDetailContent(
          functionResult,
          nodeIndexes,
          functionResult[config.terms.title],
          functionResult[config.terms.title],
          config
        );

        // 更新消息
        setMessages((prev) => {
          const updatedMessages = prev.map((msg) => {
            if (
              msg.type === config.terms.sectionDetailType &&
              msg.data.nodeIndexes.node3 === nodeIndexes.node3 &&
              msg.data.nodeIndexes.node4 === nodeIndexes.node4
            ) {
              return createAssistantMessage(
                content,
                config.terms.sectionDetailType,
                functionResult,
                config
              );
            }
            return msg;
          });

          // 保存更新后的历史
          const newHistory = saveChatHistory(
            updatedMessages,
            mainStructure,
            currentNodeIndexes,
            config
          );
          setChatHistories((prevHistories) => {
            const updated = [...prevHistories];
            updated[currentChatIndex] = newHistory;
            return updated;
          });

          return updatedMessages;
        });
      }

      setAdjustedContent('');
      
    } catch (error) {
      console.error('Error:', error);
      setError(`调整失败: ${error.message}`);
    } finally {
      setIsAdjusting(false);
      await new Promise(resolve => setTimeout(resolve, 100)); // 确保滚动到底部
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }
  };

  const handleContinue = async (startNodeIndexes) => {
    // 使用全局验证函数，显示弹框提示
    const validation = validateConfigAndApi({ selectedConfig, apiKey, apiUrl, showAlert: true });
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      setIsFinished(false);
      setIsGenerating(true);
      await new Promise((resolve) => setTimeout(resolve, 0));

      await generateNextDetail(
        startNodeIndexes,
        mainStructure,
        messages,
        selectedConfig,
        {
          apiUrl,
          apiKey,
          model,
          setMessages,
          setChatHistories,
          currentChatIndex,
          isGeneratingRef,
          setError,
          setIsGenerating
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setError(`生成流程时发生错误: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const startNewChat = () => {
    // 保存当前聊天的状态
    if (messages.length > 0) {
      const currentHistory = saveChatHistory(messages, mainStructure, currentNodeIndexes, selectedConfig);
      setChatHistories(prev => {
        const updated = [...prev];
        if (currentChatIndex !== null && currentChatIndex < updated.length) {
          updated[currentChatIndex] = currentHistory;
        }
        return updated;
      });
    }

    // 创建新聊天
    const newChat = createNewChat(selectedConfig);
    
    // 使用函数式更新确保状态同步
    setChatHistories(prev => {
      const newHistories = [...prev, newChat];
      // 在这里直接更新本地存储
      saveChatHistoriesToStorage(newHistories);
      return newHistories;
    });

    const newIndex = chatHistories.length;
    setCurrentChatIndex(newIndex);
    saveCurrentChatIndex(newIndex);

    // 重置状态
    setMessages([]);
    setMainStructure(null);
    setCurrentNodeIndexes(INITIAL_NODE_INDEXES);
    setIsFinished(false);
    setIsGenerating(false);
    setInput('');
  };

  const handleChatClick = (index) => {
    // 保存当前聊天的状态
    if (currentChatIndex !== null && messages.length > 0) {
      const newHistory = saveChatHistory(messages, mainStructure, currentNodeIndexes, selectedConfig);
      setChatHistories((prev) => {
        const updated = [...prev];
        updated[currentChatIndex] = newHistory;
        return updated;
      });
    }

    // 加载目标聊天的状态
    const chatHistory = chatHistories[index];
    if (chatHistory) {
      setMessages(chatHistory.messages || []);
      setCurrentChatIndex(index);
      setMainStructure(chatHistory.mainStructure || null);
      setCurrentNodeIndexes(chatHistory.currentNodeIndexes || {
        node1: 1,
        node2: 1,
        node3: 1,
        node4: 1,
      });
      setSelectedConfig(chatHistory.selectedConfig || selectedConfig);
      
      // 重置生成状态
      setIsGenerating(false);
      setIsFinished(false);
      setIsAdjusting(false);
      setError('');
      setAdjustedContent('');
      setInput('');
    }
  };

  const handleExport = () => {
    const url = exportChatData(chatHistories, configurations, selectedConfig);
    downloadFile(url, 'chat_data.json');
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const { chatHistories: importedHistories, configurations: importedConfigs, selectedConfig: importedSelected } = 
        await importChatData(content);
      
      setConfigurations(importedConfigs);
      setSelectedConfig(importedSelected);
      saveConfigurations(importedConfigs);
      saveSelectedConfig(importedSelected);
      
      setChatHistories(importedHistories);
      setMessages([]);
      setMainStructure(null);
      setCurrentNodeIndexes(INITIAL_NODE_INDEXES);
      setCurrentChatIndex(null);
      
      setIsGenerating(false);
      setIsFinished(false);
      setIsAdjusting(false);
      setError('');
      setAdjustedContent('');
      setInput('');
      
      saveChatHistoriesToStorage(importedHistories);
      localStorage.removeItem('currentChatIndex');
      
      alert('导入成功！');
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请确保文件格式正确。');
    }
  };

  const handleConfigChange = (configId) => {
    const config = configurations.find((cfg) => cfg.id === configId);
    if (config) {
      setSelectedConfig(config);
      // 只有非系统配置才保存到本地存储
      if (!config.isSystemConfig) {
        saveSelectedConfig(config);
      }
    }
  };

  const handleConfigAdd = () => {
    const newConfig = createNewConfig(defaultConfig);
    // 保持动态思维链在第一位
    const updatedConfigs = [configurations[0], newConfig, ...configurations.slice(1)];
    setConfigurations(updatedConfigs);
    // 只保存非系统配置
    const configsToSave = updatedConfigs.filter(config => !config.isSystemConfig);
    saveConfigurations(configsToSave);
    setSelectedConfig(newConfig);
    saveSelectedConfig(newConfig);
  };

  const handleConfigEdit = (configId) => {
    const configToEdit = configurations.find((cfg) => cfg.id === configId);
    if (configToEdit) {
      const newConfigString = prompt('编辑配置项 (JSON 格式)：', JSON.stringify(configToEdit, null, 2));
      if (newConfigString) {
        const newConfig = editConfig(newConfigString);
        if (newConfig) {
          const updatedConfigs = configurations.map((cfg) =>
            cfg.id === configId ? newConfig : cfg
          );
          setConfigurations(updatedConfigs);
          if (selectedConfig.id === configId) {
            setSelectedConfig(newConfig);
            saveSelectedConfig(newConfig);
          }
          saveConfigurations(updatedConfigs);
        }
      }
    }
  };

  const handleConfigDelete = (configId) => {
    // 不允许删除系统配置
    const configToDelete = configurations.find(cfg => cfg.id === configId);
    if (!configToDelete || configToDelete.isSystemConfig) {
      setError('系统配置不能删除');
      return;
    }

    const updatedConfigs = configurations.filter((cfg) => cfg.id !== configId);
    setConfigurations(updatedConfigs);
    
    // 如果删除的是当前选中的配置，切换到动态思维链配置
    if (selectedConfig && selectedConfig.id === configId) {
      const dynamicConfig = configurations.find(cfg => cfg.isSystemConfig);
      if (dynamicConfig) {
        setSelectedConfig(dynamicConfig);
      }
    }
    
    // 只保存非系统配置
    const configsToSave = updatedConfigs.filter(config => config && !config.isSystemConfig);
    saveConfigurations(configsToSave);
  };

  const handleExportConfigs = () => {
    const url = exportConfigurations(configurations, selectedConfig);
    downloadFile(url, 'configurations.json');
  };

  const handleImportConfigs = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const { configurations: importedConfigs, selectedConfig: importedSelected } = 
            await importConfigurations(e.target.result);
          
          setConfigurations(importedConfigs);
          setSelectedConfig(importedSelected);
          saveConfigurations(importedConfigs);
          saveSelectedConfig(importedSelected);
          
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
      const url = exportMarkdown(messages, selectedConfig);
      downloadFile(url, 'chat_content.md');
    } catch (error) {
      console.error('导出 Markdown 时发生错误:', error);
      setError(`导出失败: ${error.message}`);
    }
  };

  const handleContinueFromMessage = (nodeIndexes) => {
    handleContinue(nodeIndexes);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
        handleChatClick={handleChatClick}
        isAdjusting={isAdjusting}
        setError={setError}
        handleContinueFromMessage={handleContinueFromMessage}
        setMainStructure={setMainStructure}
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
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        currentNodeIndexes={currentNodeIndexes}
      />
    </div>
  );
}
