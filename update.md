update 20250116
1，修复左侧内容过多时候的样式错误
2，新增手机端自适应
3，优化生成详情的提示词


我来帮你将 ChatInterface.js 进行逻辑拆分。我们可以按照功能模块将代码拆分为几个主要部分。

首先我会创建 services 目录并规划拆分结构：

```bash
mkdir -p src/services
```


我们将代码拆分为以下几个主要模块：

1. chatService.js - 处理聊天相关的核心功能
2. configService.js - 处理配置相关的功能
3. exportService.js - 处理导入导出相关的功能
4. storageService.js - 处理本地存储相关的功能
5. messageService.js - 处理消息生成和处理相关的功能

让我们开始创建这些文件：

```javascript:src/services/chatService.js
// chatService.js
import { generateNewMainStructure, generateNewDetail, adjustMainStructure, adjustDetail } from '../api';
import { saveToLocalStorage } from './storageService';
import { findInsertIndex } from './messageService';

export const handleSubmit = async ({
  input,
  selectedConfig,
  setError,
  setMessages,
  setInput,
  setIsLoading,
  apiUrl,
  apiKey,
  model,
  setMainStructure,
  saveChatHistory,
}) => {
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
    selectedConfig: selectedConfig
  };
  setMessages((prev) => [...prev, newUserMessage]);
  setInput('');
  setIsLoading(true);

  try {
    const userContent = input;
    const { functionResult } = await generateNewMainStructure(
      apiUrl,
      apiKey,
      model,
      userContent,
      selectedConfig
    );

    if (functionResult) {
      setMainStructure(functionResult);
      const assistantContent =
        `${selectedConfig.terms.node1}:\n` + JSON.stringify(functionResult, null, 2);

      const newAssistantMessage = {
        role: 'assistant',
        content: assistantContent,
        type: 'mainStructure',
        data: functionResult,
        selectedConfig: selectedConfig,
      };
      setMessages((prev) => {
        const updatedMessages = [...prev, newAssistantMessage];
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

export const handleContinue = async ({
  startNodeIndexes,
  setIsFinished,
  setIsGenerating,
  generateNextDetail,
  setError
}) => {
  try {
    setIsFinished(false);
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await generateNextDetail(startNodeIndexes);
  } catch (error) {
    console.error('Error:', error);
    setError(`生成流程时发生错误: ${error.message}`);
  } finally {
    setIsGenerating(false);
  }
};

export const handleAdjustSubmit = async ({
  message,
  adjustedContent,
  nodeIndexes,
  setIsAdjusting,
  setError,
  apiUrl,
  apiKey,
  model,
  selectedConfig,
  mainStructure,
  messages,
  setMessages,
  setMainStructure,
  saveChatHistory,
  setAdjustedContent,
  renderDetailContent
}) => {
  try {
    setIsAdjusting(true);
    const config = message.selectedConfig || selectedConfig;
    if (!config) {
      setError('配置未定义');
      setIsAdjusting(false);
      return;
    }
    const terms = config.terms;

    if (message.type === 'mainStructure') {
      const { functionResult } = await adjustMainStructure(
        apiUrl,
        apiKey,
        model,
        message.data || JSON.parse(message.content.slice(6)),
        adjustedContent,
        config
      );

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
        const updatedMessages = [...prev, newAssistantMessage];
        saveChatHistory(updatedMessages);
        return updatedMessages;
      });

      setMainStructure(functionResult);
    } else if (message.type === terms.sectionDetailType) {
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

      const assistantContent = renderDetailContent(
        functionResult,
        nodeIndexes,
        functionResult[terms.title],
        functionResult[terms.title],
        config
      );

      setMessages((prev) => {
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

    setAdjustedContent('');
  } catch (error) {
    console.error('Error:', error);
    setError(`发生错误: ${error.message}。请重试。`);
  } finally {
    setIsAdjusting(false);
  }
};

export const startNewChat = ({
  messages,
  saveChatHistory,
  selectedConfig,
  setChatHistories,
  setMessages,
  setMainStructure,
  setCurrentNodeIndexes,
  setCurrentChatIndex,
  chatHistories
}) => {
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
    selectedConfig,
  };

  setChatHistories((prevHistories) => {
    const updatedHistories = [...prevHistories, newChatHistory];
    saveToLocalStorage('chatHistories', updatedHistories);
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
};

export const handleChatClick = ({
  index,
  chatHistories,
  setMessages,
  setCurrentChatIndex,
  setMainStructure,
  setCurrentNodeIndexes,
  setSelectedConfig
}) => {
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
    setSelectedConfig(chatHistory.selectedConfig || null);
  } else {
    console.error(`未找到索引为 ${index} 的聊天记录`);
  }
};
```

```javascript:src/services/configService.js
// configService.js
import { saveToLocalStorage } from './storageService';

export const handleConfigChange = ({
  configId,
  configurations,
  setSelectedConfig,
}) => {
  const config = configurations.find((cfg) => cfg.id === configId);
  setSelectedConfig(config);
  saveToLocalStorage('selectedConfig', config);
};

export const handleConfigAdd = ({
  defaultConfig,
  configurations,
  setConfigurations,
  setSelectedConfig,
}) => {
  const newConfig = {
    ...defaultConfig,
    id: Date.now().toString(),
    name: '思考模型',
  };
  const updatedConfigs = [...configurations, newConfig];
  setConfigurations(updatedConfigs);
  setSelectedConfig(newConfig);
  saveToLocalStorage('configurations', updatedConfigs);
  saveToLocalStorage('selectedConfig', newConfig);
};

export const handleConfigEdit = ({
  configId,
  configurations,
  setConfigurations,
  selectedConfig,
  setSelectedConfig,
}) => {
  const configToEdit = configurations.find((cfg) => cfg.id === configId);
  if (configToEdit) {
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
          saveToLocalStorage('selectedConfig', newConfig);
        }
        saveToLocalStorage('configurations', updatedConfigs);
      } catch (error) {
        alert('无效的 JSON 格式');
      }
    }
  }
};

export const handleConfigDelete = ({
  configId,
  configurations,
  setConfigurations,
  selectedConfig,
  setSelectedConfig,
}) => {
  const updatedConfigs = configurations.filter((cfg) => cfg.id !== configId);
  setConfigurations(updatedConfigs);
  if (selectedConfig && selectedConfig.id === configId) {
    setSelectedConfig(null);
    localStorage.removeItem('selectedConfig');
  }
  saveToLocalStorage('configurations', updatedConfigs);
};
```

```javascript:src/services/exportService.js
// exportService.js
import { saveToLocalStorage } from './storageService';

export const handleExport = ({ chatHistories, configurations, selectedConfig }) => {
  const dataStr = JSON.stringify({
    chatHistories,
    configurations,
    selectedConfig,
  }, null, 2);
  downloadFile(dataStr, 'chat_data.json', 'application/json');
};

export const handleImport = async ({
  file,
  setChatHistories,
  setConfigurations,
  setSelectedConfig,
  setMessages,
  setMainStructure,
  setCurrentChatIndex,
}) => {
  if (file) {
    try {
      const content = await readFileContent(file);
      const importedData = JSON.parse(content);
      
      setChatHistories(importedData.chatHistories || []);
      setConfigurations(importedData.configurations || []);
      setSelectedConfig(importedData.selectedConfig || null);
      setMessages([]);
      setMainStructure(null);
      setCurrentChatIndex(null);
      
      saveToLocalStorage('chatHistories', importedData.chatHistories || []);
      saveToLocalStorage('configurations', importedData.configurations || []);
      saveToLocalStorage('selectedConfig', importedData.selectedConfig || null);
      localStorage.removeItem('currentChatIndex');
      
      alert('导入成功！');
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请确保文件格式正确。');
    }
  }
};

export const handleExportMarkdown = ({ messages, selectedConfig }) => {
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

    downloadFile(markdownContent, 'chat_content.md', 'text/markdown');
  } catch (error) {
    console.error('导出 Markdown 时发生错误:', error);
    throw new Error(`导出失败: ${error.message}`);
  }
};

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};
```

```javascript:src/services/storageService.js
// storageService.js

export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`保存到 localStorage 失败 (${key}):`, error);
  }
};

export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`从 localStorage 加载失败 (${key}):`, error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`从 localStorage 删除失败 (${key}):`, error);
  }
};

export const initializeFromLocalStorage = ({
  setApiKey,
  setApiUrl,
  setChatHistories,
  setCurrentChatIndex,
  setMessages,
  setMainStructure,
  setCurrentNodeIndexes,
  setConfigurations,
  setSelectedConfig,
  defaultConfig,
}) => {
  // 加载 API 配置
  const storedApiKey = loadFromLocalStorage('apiKey', '');
  const storedApiUrl = loadFromLocalStorage('apiUrl', 'https://chatapi.aisws.com/v1/chat/completions');
  setApiKey(storedApiKey);
  setApiUrl(storedApiUrl);

  // 加载聊天历史
  const storedChatHistories = loadFromLocalStorage('chatHistories');
  if (storedChatHistories) {
    setChatHistories(storedChatHistories);
    
    const storedCurrentChatIndex = loadFromLocalStorage('currentChatIndex');
    if (storedCurrentChatIndex !== null) {
      setCurrentChatIndex(storedCurrentChatIndex);
      const currentHistory = storedChatHistories[storedCurrentChatIndex];
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
      setCurrentChatIndex(0);
      if (storedChatHistories.length > 0) {
        const firstHistory = storedChatHistories[0];
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
  } else {
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

  // 加载配置项
  const storedConfigs = loadFromLocalStorage('configurations');
  let configurations = [];
  if (storedConfigs && storedConfigs.length > 0) {
    configurations = storedConfigs;
  } else {
    configurations = [{
      id: 'default',
      name: '示例配置',
      ...defaultConfig,
    }];
    saveToLocalStorage('configurations', configurations);
  }
  setConfigurations(configurations);

  // 加载选中的配置项
  const storedSelectedConfig = loadFromLocalStorage('selectedConfig');
  if (storedSelectedConfig) {
    setSelectedConfig(storedSelectedConfig);
  } else if (configurations.length > 0) {
    const defaultSelectedConfig = configurations[0];
    setSelectedConfig(defaultSelectedConfig);
    saveToLocalStorage('selectedConfig', defaultSelectedConfig);
  }
};
```

```javascript:src/services/messageService.js
// messageService.js
import { generateNewDetail } from '../api';

export const findInsertIndex = (nodeIndexes, messagesList) => {
  for (let i = 0; i < messagesList.length; i++) {
    const msg = messagesList[i];
    if (msg.type === 'sectionDetailType') {
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

export const generateNextDetail = async ({
  startNodeIndexes,
  selectedConfig,
  mainStructure,
  messages,
  setMessages,
  setChatHistories,
  currentChatIndex,
  isGeneratingRef,
  setIsFinished,
  setError,
  setIsGenerating,
  apiUrl,
  apiKey,
  model,
}) => {
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
            await generateDetailContent({
              nodeIndexes,
              apiUrl,
              apiKey,
              model,
              mainStructure,
              messages,
              selectedConfig,
              setMessages,
              setChatHistories,
              currentChatIndex,
            });
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
        await generateDetailContent({
          nodeIndexes,
          apiUrl,
          apiKey,
          model,
          mainStructure,
          messages,
          selectedConfig,
          setMessages,
          setChatHistories,
          currentChatIndex,
        });
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

export const generateDetailContent = async ({
  nodeIndexes,
  apiUrl,
  apiKey,
  model,
  mainStructure,
  messages,
  selectedConfig,
  setMessages,
  setChatHistories,
  currentChatIndex,
}) => {
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

    const newMessage = {
      role: 'assistant',
      type: selectedConfig.terms.sectionDetailType,
      content: functionResult[selectedConfig.terms.detail],
      data: {
        ...functionResult,
        nodeIndexes,
      },
    };

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const insertIndex = findInsertIndex(nodeIndexes, updatedMessages);
      updatedMessages.splice(insertIndex, 0, newMessage);
      return updatedMessages;
    });

    setChatHistories((prevHistories) => {
      const updatedHistories = [...prevHistories];
      const targetChat = updatedHistories[currentChatIndex];
      if (targetChat) {
        const insertIndex = findInsertIndex(nodeIndexes, targetChat.messages);
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
```


现在我们已经将代码拆分成了几个主要的服务模块。让我们修改原来的 ChatInterface.js 文件，使其使用这些新的服务模块：

```javascript:src/ChatInterface.js
// ChatInterface.js
import React, { useState, useRef, useEffect } from 'react';
import ChatInterfaceView from './ChatInterfaceView';
import defaultConfig from './config';
import {
  handleSubmit,
  handleContinue,
  handleAdjustSubmit,
  startNewChat,
  handleChatClick,
} from './services/chatService';
import {
  handleConfigChange,
  handleConfigAdd,
  handleConfigEdit,
  handleConfigDelete,
} from './services/configService';
import {
  handleExport,
  handleImport,
  handleExportMarkdown,
} from './services/exportService';
import {
  initializeFromLocalStorage,
  saveToLocalStorage,
} from './services/storageService';
import {
  generateNextDetail,
  renderDetailContent,
} from './services/messageService';

const models = [
  { value: 'gpt-4o-mini', label: 'GPT-4O Mini' },
  { value: 'gpt-4o-2024-08-06', label: 'GPT-4O (2024-08-06)' },
  { value: 'o1-mini', label: 'o1-mini' },
  { value: 'gpt-4o', label: 'GPT-4O' },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
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
  const [chatHistories, setChatHistories] = useState([]);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const fileInputRef = useRef(null);
  const [configurations, setConfigurations] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const configFileInputRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    initializeFromLocalStorage({
      setApiKey,
      setApiUrl,
      setChatHistories,
      setCurrentChatIndex,
      setMessages,
      setMainStructure,
      setCurrentNodeIndexes,
      setConfigurations,
      setSelectedConfig,
      defaultConfig,
    });
  }, []);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  useEffect(() => {
    saveToLocalStorage('chatHistories', chatHistories);
    if (currentChatIndex !== null) {
      saveToLocalStorage('currentChatIndex', currentChatIndex);
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit({
        input,
        selectedConfig,
        setError,
        setMessages,
        setInput,
        setIsLoading,
        apiUrl,
        apiKey,
        model,
        setMainStructure,
        saveChatHistory,
      });
    }
  };

  const handleApiKeyChange = (e) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    saveToLocalStorage('apiKey', newApiKey);
  };

  const saveChatHistory = (updatedMessages, currentMainStructure) => {
    const title = updatedMessages[0]?.content.slice(0, 10) || '未命名';
    const updatedHistories = [...chatHistories];
    updatedHistories[currentChatIndex] = {
      title,
      messages: updatedMessages,
      mainStructure: currentMainStructure || mainStructure,
      currentNodeIndexes,
      selectedConfig,
    };
    setChatHistories(updatedHistories);
  };

  const handleContinueFromMessage = (nodeIndexes) => {
    handleContinue({
      startNodeIndexes: nodeIndexes,
      setIsFinished,
      setIsGenerating,
      generateNextDetail: (startNodeIndexes) =>
        generateNextDetail({
          startNodeIndexes,
          selectedConfig,
          mainStructure,
          messages,
          setMessages,
          setChatHistories,
          currentChatIndex,
          isGeneratingRef,
          setIsFinished,
          setError,
          setIsGenerating,
          apiUrl,
          apiKey,
          model,
        }),
      setError,
    });
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
        handleSubmit={(e) =>
          handleSubmit({
            e,
            input,
            selectedConfig,
            setError,
            setMessages,
            setInput,
            setIsLoading,
            apiUrl,
            apiKey,
            model,
            setMainStructure,
            saveChatHistory,
          })
        }
        handleKeyDown={handleKeyDown}
        setInput={setInput}
        scrollAreaRef={scrollAreaRef}
        textareaRef={textareaRef}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        apiUrl={apiUrl}
        setApiUrl={(url) => {
          setApiUrl(url);
          saveToLocalStorage('apiUrl', url);
        }}
        apiKey={apiKey}
        handleApiKeyChange={handleApiKeyChange}
        model={model}
        setModel={setModel}
        models={models}
        mainStructure={mainStructure}
        adjustedContent={adjustedContent}
        setAdjustedContent={setAdjustedContent}
        handleAdjustSubmit={(message, adjustedContent, nodeIndexes) =>
          handleAdjustSubmit({
            message,
            adjustedContent,
            nodeIndexes,
            setIsAdjusting,
            setError,
            apiUrl,
            apiKey,
            model,
            selectedConfig,
            mainStructure,
            messages,
            setMessages,
            setMainStructure,
            saveChatHistory,
            setAdjustedContent,
            renderDetailContent,
          })
        }
        handleContinue={handleContinueFromMessage}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
        isFinished={isFinished}
        currentChatIndex={currentChatIndex}
        setCurrentChatIndex={setCurrentChatIndex}
        startNewChat={() =>
          startNewChat({
            messages,
            saveChatHistory,
            selectedConfig,
            setChatHistories,
            setMessages,
            setMainStructure,
            setCurrentNodeIndexes,
            setCurrentChatIndex,
            chatHistories,
          })
        }
        saveChatHistory={saveChatHistory}
        handleChatClick={(index) =>
          handleChatClick({
            index,
            chatHistories,
            setMessages,
            setCurrentChatIndex,
            setMainStructure,
            setCurrentNodeIndexes,
            setSelectedConfig,
          })
        }
        isAdjusting={isAdjusting}
        setError={setError}
        handleContinueFromMessage={handleContinueFromMessage}
        setMainStructure={setMainStructure}
        handleExport={() =>
          handleExport({
            chatHistories,
            configurations,
            selectedConfig,
          })
        }
        handleImportClick={() => fileInputRef.current?.click()}
        handleImport={(event) =>
          handleImport({
            file: event.target.files[0],
            setChatHistories,
            setConfigurations,
            setSelectedConfig,
            setMessages,
            setMainStructure,
            setCurrentChatIndex,
          })
        }
        fileInputRef={fileInputRef}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        configurations={configurations}
        setConfigurations={setConfigurations}
        selectedConfig={selectedConfig}
        setSelectedConfig={setSelectedConfig}
        handleConfigChange={(configId) =>
          handleConfigChange({
            configId,
            configurations,
            setSelectedConfig,
          })
        }
        handleConfigAdd={() =>
          handleConfigAdd({
            defaultConfig,
            configurations,
            setConfigurations,
            setSelectedConfig,
          })
        }
        handleConfigEdit={(configId) =>
          handleConfigEdit({
            configId,
            configurations,
            setConfigurations,
            selectedConfig,
            setSelectedConfig,
          })
        }
        handleConfigDelete={(configId) =>
          handleConfigDelete({
            configId,
            configurations,
            setConfigurations,
            selectedConfig,
            setSelectedConfig,
          })
        }
        handleExportMarkdown={() =>
          handleExportMarkdown({
            messages,
            selectedConfig,
          })
        }
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
      />
    </div>
  );
}
```


我已经完成了代码的拆分工作。现在代码结构更加清晰，每个服务模块都负责特定的功能：

1. `chatService.js` - 处理聊天相关的核心功能：
   - 消息提交
   - 聊天继续
   - 调整提交
   - 新建聊天
   - 聊天切换

2. `configService.js` - 处理配置相关的功能：
   - 配置更改
   - 配置添加
   - 配置编辑
   - 配置删除

3. `exportService.js` - 处理导入导出相关的功能：
   - 导出聊天记录
   - 导入聊天记录
   - 导出 Markdown

4. `storageService.js` - 处理本地存储相关的功能：
   - 保存到本地存储
   - 从本地存储加载
   - 从本地存储删除
   - 初始化本地存储数据

5. `messageService.js` - 处理消息生成和处理相关的功能：
   - 查找插入索引
   - 生成下一个详细内容
   - 生成详细内容
   - 渲染详细内容

主文件 `ChatInterface.js` 现在主要负责：
- 状态管理
- 组件生命周期
- 组件渲染
- 服务调用的协调

这种拆分带来以下好处：
1. 代码更加模块化，每个模块职责清晰
2. 更容易维护和测试
3. 代码复用性更好
4. 更容易进行功能扩展
5. 降低了代码耦合度

如果你需要对某个特定模块进行修改或者添加新功能，现在可以直接在相应的服务文件中进行操作，而不会影响到其他功能。
