// ChatInterfaceView.js

import React, { useEffect, useState, useMemo } from 'react';
import { Settings, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { terms} from './config';

export default function ChatInterfaceView({
  messages,
  setMessages,
  error,
  input,
  isLoading,
  handleSubmit,
  handleKeyDown,
  setInput,
  scrollAreaRef,
  textareaRef,
  showSettings,
  setShowSettings,
  apiUrl,
  setApiUrl,
  apiKey,
  handleApiKeyChange,
  model,
  setModel,
  models,
  mainStructure,
  adjustedContent,
  setAdjustedContent,
  handleAdjustSubmit,
  handleContinue,
  isGenerating,
  setIsGenerating,
  isFinished,
  chatHistories,
  setChatHistories,
  setMainStructure,
  currentChatIndex,
  setCurrentChatIndex,
  startNewChat,
  saveChatHistory,
  handleChatClick,
  isAdjusting,
  setError,
  handleContinueFromMessage,
  handleExport,
  handleImportClick,
  handleImport,
  fileInputRef,
  selectedConfig,
  configurations,
  handleConfigChange,
  handleConfigAdd,
  handleConfigEdit,
  handleConfigDelete,
  showSidebar,
  setShowSidebar,
}) {
  useEffect(() => {}, [chatHistories]);

  const [localAdjustInputs, setLocalAdjustInputs] = useState(
    Array(messages.length).fill(false)
  );


  const [localErrors, setLocalErrors] = useState(Array(messages.length).fill(''));

  const toggleLocalAdjustInput = (index) => {
    setLocalAdjustInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index] = !newInputs[index];
      return newInputs;
    });
  };

  const deleteChatHistory = (index) => {
    const updatedHistories = chatHistories.filter((_, i) => i !== index);
    setChatHistories(updatedHistories);

    if (currentChatIndex === index) {
      setCurrentChatIndex(null);
      setMessages([]);
      setMainStructure(null);
    } else if (currentChatIndex > index) {
      setCurrentChatIndex(currentChatIndex - 1);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(e);
  };

  const handleDeleteMessage = (index) => {
    const updatedMessages = messages.filter((_, i) => i !== index);
    setMessages(updatedMessages);
    if (currentChatIndex !== null) {
      const updatedHistories = [...chatHistories];
      updatedHistories[currentChatIndex].messages = updatedMessages;
      setChatHistories(updatedHistories);
      localStorage.setItem('chatHistories', JSON.stringify(updatedHistories));
    }
  };

  const renderDetail = (detailData, messageConfig) => {
    if (!messageConfig) {
      return <p>无法渲染详细内容，缺少配置。</p>;
    }
    const terms = messageConfig.terms;

    if (!detailData || !detailData[terms.detail]) {
      return null;
    }

    // 兼容旧格式：检查是否为旧的消息格式
    const isLegacyFormat = !detailData.nodeIndexes || (!detailData.nodeIndexes.isSimpleNode && !detailData.nodeIndexes.node3);

    if (isLegacyFormat) {
      // 处理旧格式的消息
      const nodeIndexes = detailData.nodeIndexes || {};
      return (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">
            {nodeIndexes.node2Name || '未知章节'}
          </h3>
          <div className="ml-4">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {detailData[terms.detail]}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    // 处理新格式的简单节点
    if (detailData.nodeIndexes.isSimpleNode) {
      return (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">
            {detailData.nodeIndexes.node2Name}
          </h3>
          <div className="ml-4">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {detailData[terms.detail]}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    // 原有的复杂节点渲染逻辑...
    const nodeIndexes = detailData.nodeIndexes;
    const node2Name = nodeIndexes.node2Name;
    const node3Index = nodeIndexes.node3 - 1;
    const node4Index = nodeIndexes.node4 - 1;

    // 检查 mainStructure 是否存在
    if (!mainStructure) {
      return (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">
            {node2Name} - 第{nodeIndexes.node3}节 - 第{nodeIndexes.node4}部分
          </h3>
          <div className="ml-4">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {detailData[terms.detail]}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    // 检查 mainStructure[terms.node1] 是否存在
    if (!mainStructure[terms.node1]) {
      return (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">
            {node2Name} - 第{nodeIndexes.node3}节 - 第{nodeIndexes.node4}部分
          </h3>
          <div className="ml-4">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {detailData[terms.detail]}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    const node3Array = mainStructure[terms.node1][node2Name];
    // 检查 node3Array 是否存在
    if (!node3Array || !node3Array[node3Index]) {
      return (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">
            {node2Name} - 第{nodeIndexes.node3}节 - 第{nodeIndexes.node4}部分
          </h3>
          <div className="ml-4">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {detailData[terms.detail]}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    const node3Data = node3Array[node3Index];
    const node3Title = node3Data[terms.title];

    const node4Array = node3Data[terms.content];
    // 检查 node4Array 是否存在
    if (!node4Array || !node4Array[node4Index]) {
      return (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-2">
            {node2Name} - {node3Title} - 第{nodeIndexes.node4}部分
          </h3>
          <div className="ml-4">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {detailData[terms.detail]}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    const node4Title = node4Array[node4Index];
    const detailContent = detailData[terms.detail];

    return (
      <div id={`detail-${nodeIndexes.node3}-${nodeIndexes.node4}`} className="mt-4">
        <h3 className="text-xl font-bold mb-2">
          {node2Name}:第{nodeIndexes.node3}个{terms.node3}: {node3Title}
        </h3>
        <h4 className="text-lg font-semibold mb-2">
          第{nodeIndexes.node4}个{terms.node4}: {node4Title}
        </h4>
        <div className="ml-4">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>
            {detailContent}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  const renderMainStructure = (mainStructureData, messageConfig, isLatest) => {
    if (!messageConfig) {
      return <p>无法渲染流程设计，缺少配置。</p>;
    }
    const terms = messageConfig.terms;

    if (!mainStructureData || !mainStructureData[terms.node1]) {
      return null;
    }

    const design = mainStructureData[terms.node1];

    return (
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">{terms.node1}</h3>
        {terms.node2.map((node2Name, index) => (
          <div key={index} className="mb-4">
            <h4 className="text-lg font-semibold mb-1">{node2Name}</h4>
            {Array.isArray(design[node2Name]) ? (
              <ul className="list-disc ml-6">
                {design[node2Name].map((item, itemIndex) => (
                  <li key={itemIndex}>
                    {typeof item === 'string' ? (
                      item
                    ) : (
                      <>
                        <span className="font-semibold">{item[terms.title]}</span>
                        {item[terms.content] && Array.isArray(item[terms.content]) && (
                          <ul className="list-disc ml-8">
                            {item[terms.content].map((subItem, subIndex) => (
                              <li key={subIndex}>
                                <a href={`#detail-${itemIndex + 1}-${subIndex + 1}`} className="text-blue-500 hover:underline">
                                  {subItem}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{design[node2Name]}</p>
            )}
          </div>
        ))}
        {isLatest && mainStructure && mainStructure[terms.node1] && (
          <div className="mt-4 space-x-2">
            <button className="px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none">
              最新流程设计
            </button>
            {/* 添加导出 PDF 的按钮 */}
            <button
              className="px-5 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none"
              onClick={handleExportMarkdown}
            >
              导出 Markdown
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleLocalAdjustSubmit = async (message, adjustedContent, index) => {
    try {
      if (message.type === 'mainStructure') {
        await handleAdjustSubmit(message, adjustedContent);
      } else if (message.type === selectedConfig.terms.sectionDetailType) {
        const nodeIndexes = message.data.nodeIndexes;

        if (nodeIndexes.node3 === undefined || nodeIndexes.node4 === undefined) {
          throw new Error('消息数据中缺少节点索引');
        }

        await handleAdjustSubmit(message, adjustedContent, nodeIndexes);
      } else {
        throw new Error('未知的消息类型');
      }

      setLocalErrors((prev) => {
        const newErrors = [...prev];
        newErrors[index] = '';
        return newErrors;
      });
      setLocalAdjustInputs((prev) => {
        const newInputs = [...prev];
        newInputs[index] = false;
        return newInputs;
      });
    } catch (error) {
      setLocalErrors((prev) => {
        const newErrors = [...prev];
        newErrors[index] = error.message;
        return newErrors;
      });
    }
  };

  // 修改消息排序逻辑
  const sortedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    const messagesWithIndex = messages.map((message, index) => ({
      ...message,
      originalIndex: index,
    }));

    return messagesWithIndex.sort((a, b) => {
      // 用户的消息始终在第一行
      if (a.role === 'user' && b.role !== 'user') return -1;
      if (a.role !== 'user' && b.role === 'user') return 1;

      // 流程设计的内容优先
      if (a.type === 'mainStructure' && b.type !== 'mainStructure') return -1;
      if (a.type !== 'mainStructure' && b.type === 'mainStructure') return 1;

      // 对于详细内容，按照 nodeIndexes 进行排序
      if (a.type === terms.sectionDetailType && b.type === terms.sectionDetailType) {
        const aIndexes = a.data.nodeIndexes;
        const bIndexes = b.data.nodeIndexes;

        // 比较 node2Index
        if (aIndexes.node2Index !== bIndexes.node2Index) {
          return aIndexes.node2Index - bIndexes.node2Index;
        }
        // 比较 node3Index
        if (aIndexes.node3Index !== bIndexes.node3Index) {
          return aIndexes.node3Index - bIndexes.node3Index;
        }
        // 比较 node4Index
        return aIndexes.node4Index - bIndexes.node4Index;
      }

      // 其他消息，保持原有顺序
      return a.originalIndex - b.originalIndex;
    });
  }, [messages]);


  const hasRenderedMainStructure = useMemo(() => {
    return messages.some((message) => message.type === 'mainStructure');
  }, [messages]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('复制成功');
    } catch (err) {
      console.error('复制失败：', err);
      alert('复制失败，请重试');
    }
  };

  const getSelectedConfig = () => {
    const firstUserMessageWithConfig = messages.find(
      (msg) => msg.role === 'user' && msg.selectedConfig
    );
    const mainStructureMessageWithConfig = messages.find(
      (msg) => msg.type === 'mainStructure' && msg.selectedConfig
    );
    return (
      firstUserMessageWithConfig?.selectedConfig ||
      mainStructureMessageWithConfig?.selectedConfig ||
      selectedConfig
    );
  };

  const handleExportMarkdown = () => {
    const messageConfig = selectedConfig || getSelectedConfig();
    if (!messageConfig || !messageConfig.terms) {
      alert('无法导出,因为缺少配置。');
      return;
    }

    const terms = messageConfig.terms;
    let markdownContent = '';

    // 1. 处理流程设计(mainStructure)
    if (mainStructure && mainStructure[terms.node1]) {
      markdownContent += `# ${terms.node1}\n\n`;

      terms.node2.forEach((node2Name) => {
        const node3Array = mainStructure[terms.node1][node2Name];
        if (Array.isArray(node3Array)) {
          markdownContent += `## ${node2Name}\n\n`;
          node3Array.forEach((node3Item, node3Index) => {
            const node3Title = node3Item[terms.title];
            markdownContent += `### ${node3Index + 1}. ${node3Title}\n\n`;

            const node4Array = node3Item[terms.content];
            if (Array.isArray(node4Array)) {
              node4Array.forEach((node4Item, node4Index) => {
                markdownContent += `#### ${node3Index + 1}.${node4Index + 1} ${node4Item}\n\n`;
              });
            }
          });
        } else if (typeof node3Array === 'string') {
          markdownContent += `## ${node2Name}\n\n`;
          markdownContent += `${node3Array}\n\n`;
        }
      });
    }

    // 2. 处理详细内容(messages 中的详细信息)
    const detailMessages = messages.filter(message => message.type === terms.sectionDetailType);

    // 按照 nodeIndexes 排序
    detailMessages.sort((a, b) => {
      const aIndexes = a.data.nodeIndexes;
      const bIndexes = b.data.nodeIndexes;

      if (aIndexes.node2Index !== bIndexes.node2Index) {
        return aIndexes.node2Index - bIndexes.node2Index;
      }
      if (aIndexes.node3Index !== bIndexes.node3Index) {
        return aIndexes.node3Index - bIndexes.node3Index;
      }
      return aIndexes.node4Index - bIndexes.node4Index;
    });

    detailMessages.forEach((message) => {
      if (message.data) {
        const nodeIndexes = message.data.nodeIndexes;
        const node2Name = nodeIndexes.node2Name;
        const node3Index = nodeIndexes.node3;
        const node4Index = nodeIndexes.node4;
        const node3Name = mainStructure[terms.node1][node2Name][node3Index - 1][terms.title];
        const node4Name = mainStructure[terms.node1][node2Name][node3Index - 1][terms.content][node4Index - 1];
        const detailContent = message.data[terms.detail];

        markdownContent += `### ${node2Name} - ${terms.node3} ${node3Index}: ${node3Name}, ${terms.node4} ${node4Index}: ${node4Name}\n\n`;
        markdownContent += `${detailContent}\n\n`;
      }
    });

    // 下载 Markdown 文件
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fileName = `${messageConfig.terms.node1}_${selectedConfig.name}.md`;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧边栏 - 移动端时为全屏覆盖层 */}
      <div className={`${
        showSidebar 
          ? 'fixed inset-0 z-40 w-full md:w-64 md:relative' 
          : 'hidden md:block w-64'
      } bg-gray-200 border-r h-screen flex flex-col`}>
        {/* 添加移动端关闭按钮 */}
        <div className="md:hidden p-4 flex justify-end">
          <button
            onClick={() => setShowSidebar(false)}
            className="p-2 rounded-full hover:bg-gray-300"
          >
            <span className="sr-only">关闭菜单</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 上部分：聊天记录列表 */}
        <div className="h-1/2 flex flex-col overflow-hidden border-b">
          <h2 className="text-lg font-bold p-4">聊天记录</h2>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {chatHistories.map((history, index) => (
                <div
                  key={index}
                  onClick={() => handleChatClick(index)}
                  className={`p-2 rounded shadow cursor-pointer flex justify-between items-center w-full ${
                    index === currentChatIndex ? 'bg-blue-100' : 'bg-white'
                  }`}
                >
                  <span className="truncate flex-1">{history.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChatHistory(index);
                    }}
                    className="text-red-500 hover:text-red-700 focus:outline-none ml-2"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t">
            <button
              onClick={() => {
                if (messages.length > 0) {
                  saveChatHistory(messages);
                }
                startNewChat();
              }}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none"
            >
              新建聊天
            </button>
          </div>
        </div>

        {/* 下部分：设置区域 */}
        <div className="h-1/2 flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none"
            >
              <Settings className="w-4 h-4 mr-2 inline" />
              设置
            </button>
          </div>
          {showSettings && (
            <div className="flex-1 overflow-y-auto p-4">
              {/* 配置管理部分 */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">配置管理</h3>
                <select
                  id="selectedConfig"
                  value={selectedConfig ? selectedConfig.id : ''}
                  onChange={(e) => handleConfigChange(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={messages.length > 0 && messages[0].selectedConfig}
                >
                  {configurations.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.name}
                    </option>
                  ))}
                </select>
                <ul>
                  {configurations.map((config) => (
                    <li key={config.id} className="flex items-center justify-between w-full p-2 rounded">
                      <span className="truncate flex-1">{config.name}</span>
                      <div className="flex items-center space-x-2 ml-2">
                        <button
                          onClick={() => handleConfigEdit(config.id)}
                          className="text-blue-500 hover:text-blue-700 focus:outline-none"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleConfigDelete(config.id)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                        >
                          删除
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleConfigAdd}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
                >
                  新增配置
                </button>
              </div>
              {/* API 设置部分 */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">API 设置</h3>
                <div>
                  <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700">
                    API URL
                  </label>
                  <input
                    id="apiUrl"
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                    API Key
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  模型
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {models.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
              </div>

              {/* 导出和导入聊天记录和配置 */}
              <div className="space-y-2 mt-4">
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
                >
                  导出聊天记录和配置
                </button>
                <button
                  onClick={handleImportClick}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none"
                >
                  导入聊天记和配置
                </button>
                <input
                  type="file"
                  accept="application/json"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImport}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧聊天内容区域 */}
      <div className="flex-1 flex flex-col h-screen">
        {/* 移动端顶部导航栏 */}
        <div className="md:hidden flex items-center p-4 border-b">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <span className="sr-only">打开菜单</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 添加配置选择下拉框 */}
        {messages.length === 0 && (
          <div className="p-4 bg-white border-b flex items-center justify-between">
            <span className="text-sm text-gray-700">
              当前配置：{selectedConfig ? selectedConfig.name : '未选择配置'}
            </span>
            <div className="flex items-center space-x-2">
              <select
                id="selectedConfig"
                value={selectedConfig ? selectedConfig.id : ''}
                onChange={(e) => handleConfigChange(e.target.value)}
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {configurations.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 聊天内容区域 */}
        <div 
          className="flex-1 overflow-y-auto scroll-smooth" 
          ref={scrollAreaRef}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="p-4">
            {sortedMessages && sortedMessages.length > 0 ? (
              sortedMessages.map((message) => {
                if (!message) return null;
                const index = message.originalIndex;

                // 使用消息自身的 selectedConfig
                const messageConfig = message.selectedConfig || getSelectedConfig();

                if (!messageConfig || !messageConfig.terms) {
                  console.error('无法获取消息的配置项或术语');
                  return (
                    <div key={index} className="mb-4 p-4 bg-red-100 rounded-lg shadow-md">
                      <p className="text-red-600">无法渲染此消息，因为缺少配置。</p>
                    </div>
                  );
                }

                const terms = messageConfig.terms;
                const isDetail = message.type === terms.sectionDetailType;
                const isMainStructure = message.type === 'mainStructure';
                const isLatestMainStructure =
                  isMainStructure && index === messages.findLastIndex((msg) => msg.type === 'mainStructure');

                let messageContent;
                if (isDetail && message.data) {
                  messageContent = message.data;
                } else if (isMainStructure) {
                  messageContent = message.data || JSON.parse(message.content.slice(6));
                } else {
                  messageContent = { type: 'text', content: message.content };
                }
                // 渲染逻辑...
                return (
                  <div
                    key={index}
                    className={`mb-4 p-4 rounded-lg shadow-md ${
                      message.role === 'user' ? 'bg-blue-100' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-semibold mb-2">
                        {message.role === 'user' ? '你' : 'AI'}
                        {isMainStructure && (
                          <span className="ml-2 text-sm text-green-500">
                            [{messageConfig.terms.node1}] {message.old ? `(old-${message.old})` : ''}
                          </span>
                        )}
                        {isDetail && (
                          <span className="ml-2 text-sm text-purple-500">
                            [{messageConfig.terms.detail}]  {messageConfig.terms.node3} {messageContent.nodeIndexes.node3},{' '}
                            {messageConfig.terms.node4} {messageContent.nodeIndexes.node4}
                          </span>
                        )}
                      </p>
                      <div className="flex space-x-2">
                        {/* 定义 copyText */}
                        {(() => {
                          let copyText = '';
                          if (message.type === 'mainStructure') {
                            copyText = message.content;
                          } else if (message.type === terms.sectionDetailType && message.data) {
                            copyText = message.data[terms.detail] || '';
                          } else {
                            copyText = message.content;
                          }
                          return (
                            <button
                              onClick={() => handleCopy(copyText)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              复制
                            </button>
                          );
                        })()}
                        <button
                          onClick={() => handleDeleteMessage(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    {isDetail ? (
                      renderDetail(messageContent, messageConfig)
                    ) : isMainStructure ? (
                      renderMainStructure(messageContent, messageConfig, isLatestMainStructure)
                    ) : (
                      <ReactMarkdown>{messageContent.content}</ReactMarkdown>
                    )}
                    {isMainStructure && (
                      <div className="mt-4 space-x-2">
                        {isLatestMainStructure && (
                          <>
                            {isGenerating ? (
                              <button
                                onClick={() => setIsGenerating(false)}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
                              >
                                立即终止
                              </button>
                            ) : (
                              <button
                                onClick={() => handleContinue({ node3: 1, node4: 1 })}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none"
                              >
                                继续
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => toggleLocalAdjustInput(index)}
                          className={`px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none ${
                            isAdjusting ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={isAdjusting}
                        >
                          调整内容
                        </button>
                      </div>
                    )}
                    {message.role !== 'user' && isDetail && (
                      <div className="mt-4 space-x-2">
                        {isGenerating ? (
                          <button
                            onClick={() => setIsGenerating(false)}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
                          >
                            立即终止
                          </button>
                        ) : isFinished ? (
                          <button className="px-4 py-2 bg-purple-500 text-white rounded focus:outline-none">
                            生成完成
                          </button>
                        ) : (
                          <button
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none"
                            onClick={() =>
                              handleContinueFromMessage({
                                node3: messageContent.nodeIndexes.node3,
                                node4: messageContent.nodeIndexes.node4,
                              })
                            }
                          >
                            继续
                          </button>
                        )}
                        <button
                          onClick={() => toggleLocalAdjustInput(index)}
                          className={`px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none ${
                            isAdjusting ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={isAdjusting}
                        >
                          调整内容
                        </button>
                      </div>
                    )}
                    {localAdjustInputs[index] && !isAdjusting && (
                      <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
                        <textarea
                          value={adjustedContent}
                          onChange={(e) => setAdjustedContent(e.target.value)}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={6}
                          disabled={isAdjusting}
                        />
                        <button
                          onClick={() => handleLocalAdjustSubmit(message, adjustedContent, index)}
                          className={`mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isAdjusting ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={isAdjusting}
                        >
                          提交调整
                        </button>
                        {localErrors[index] && (
                          <p className="mt-2 text-red-500">{localErrors[index]}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p>当前没有消息。</p>
            )}
            {error && (
              <div className="mb-4 p-4 bg-red-100 rounded-lg shadow-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 底部输入框 */}
        <div className="p-4 bg-white border-t">
          {!hasRenderedMainStructure && (
            <form onSubmit={handleFormSubmit} className="space-y-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (currentChatIndex !== null && chatHistories[currentChatIndex].title === '未命名') {
                    const newTitle = e.target.value.slice(0, 10) || '未命名';
                    const updatedHistories = [...chatHistories];
                    updatedHistories[currentChatIndex].title = newTitle;
                    setChatHistories(updatedHistories);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="输入你的消息..."
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={isAdjusting}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">按 Ctrl+Enter 发送</p>
                <button
                  type="submit"
                  disabled={isLoading || isAdjusting}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  发送
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 移动端侧边栏遮罩层 */}
      {showSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}
