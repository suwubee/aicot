import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function MessageList({
  messages,
  handleDeleteMessage,
  handleCopy,
  handleContinueFromMessage,
  handleAdjustSubmit,
  isGenerating,
  setIsGenerating,
  isFinished,
  isAdjusting,
  adjustedContent,
  setAdjustedContent,
  localAdjustInputs,
  setLocalAdjustInputs,
  localErrors,
  setLocalErrors,
  selectedConfig,
  mainStructure,
  handleExportMarkdown,
}) {
  const renderDetail = (detailData, messageConfig) => {
    if (!messageConfig) {
      return <p>无法渲染详细内容，缺少配置。</p>;
    }
    const terms = messageConfig.terms;

    if (!detailData || !detailData[terms.detail]) {
      return null;
    }

    const isLegacyFormat = !detailData.nodeIndexes || (!detailData.nodeIndexes.isSimpleNode && !detailData.nodeIndexes.node3);

    if (isLegacyFormat) {
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

    const nodeIndexes = detailData.nodeIndexes;
    const node2Name = nodeIndexes.node2Name;
    const node3Index = nodeIndexes.node3 - 1;
    const node4Index = nodeIndexes.node4 - 1;

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

  const renderMainStructure = (mainStructureData, messageConfig, isLatestMainStructure) => {
    if (!messageConfig) {
      return <p>无法渲染流程设计，缺少配置。</p>;
    }
    const terms = messageConfig.terms;

    if (!mainStructureData || !mainStructureData[terms.node1]) {
      return null;
    }

    const design = mainStructureData[terms.node1];

    // 处理动态思维链的情况
    const isDynamicConfig = messageConfig.isDynamic;
    const node2Items = isDynamicConfig ? 
      // 如果是动态思维链，使用设计中的实际顺序
      Object.keys(design).filter(key => typeof design[key] !== 'string') :
      // 如果是固定配置，使用预定义的顺序
      terms.node2;

    const hasCompleteStructure = isDynamicConfig ? 
      node2Items.length > 0 :
      terms.node2.every(node2Name => {
        const node2Data = design[node2Name];
        if (!node2Data) return false;
        
        if (terms.node2ComplexItems.includes(node2Name)) {
          return Array.isArray(node2Data) && node2Data.every(item => 
            item[terms.title] && Array.isArray(item[terms.content]));
        }
        return typeof node2Data === 'string' || 
               (Array.isArray(node2Data) && node2Data.length > 0);
      });

    return (
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">{terms.node1}</h3>
        {node2Items.map((node2Name, index) => (
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
        {isLatestMainStructure && hasCompleteStructure && (
          <div className="mt-4 space-x-2">
            <button className="px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none">
              最新流程设计
            </button>
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
    if (!message || !message.type) {
      setLocalErrors((prev) => {
        const newErrors = [...prev];
        newErrors[index] = '无效的消息数据';
        return newErrors;
      });
      return;
    }

    if (!adjustedContent.trim()) {
      setLocalErrors((prev) => {
        const newErrors = [...prev];
        newErrors[index] = '调整内容不能为空';
        return newErrors;
      });
      return;
    }

    try {
      const messageConfig = message.selectedConfig || selectedConfig;
      if (!messageConfig || !messageConfig.terms) {
        throw new Error('缺少配置信息');
      }

      if (message.type === 'mainStructure') {
        await handleAdjustSubmit(message, adjustedContent);
      } else if (message.type === messageConfig.terms.sectionDetailType) {
        const nodeIndexes = message.data?.nodeIndexes;
        if (!nodeIndexes || !nodeIndexes.node2Name || !nodeIndexes.node3 || !nodeIndexes.node4) {
          throw new Error('消息数据中缺少必要的节点索引');
        }

        if (!message.data || !message.data[messageConfig.terms.detail]) {
          throw new Error('消息数据中缺少详细内容');
        }

        await handleAdjustSubmit(message, adjustedContent, nodeIndexes);
      } else {
        throw new Error(`不支持的消息类型: ${message.type}`);
      }

      // 成功后清理状态
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
      setAdjustedContent('');
    } catch (error) {
      console.error('调整内容失败:', error);
      setLocalErrors((prev) => {
        const newErrors = [...prev];
        newErrors[index] = error.message || '调整失败，请重试';
        return newErrors;
      });
    }
  };

  const toggleLocalAdjustInput = (index) => {
    setLocalAdjustInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index] = !newInputs[index];
      return newInputs;
    });
  };

  return (
    <div className="p-4">
      {messages && messages.length > 0 ? (
        messages.map((message, index) => {
          if (!message) return null;

          const messageConfig = message.selectedConfig || selectedConfig;
          if (!messageConfig || !messageConfig.terms) {
            return (
              <div key={index} className="mb-4 p-4 bg-red-100 rounded-lg shadow-md">
                <p className="text-red-600">无法渲染此消息，因为缺少配置。</p>
              </div>
            );
          }

          const terms = messageConfig.terms;
          const isDetail = message.type === terms.sectionDetailType;
          const isMainStructure = message.type === 'mainStructure';
          const isLatestMainStructure = isMainStructure && 
            index === messages.findLastIndex((msg) => msg.type === 'mainStructure');

          let messageContent;
          if (isDetail && message.data) {
            messageContent = message.data;
          } else if (isMainStructure) {
            messageContent = message.data || JSON.parse(message.content.slice(6));
          } else if (message.type === 'config') {
            messageContent = message.data;
          } else {
            messageContent = { type: 'text', content: message.content };
          }

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
                      [{messageConfig.terms.detail}] {messageContent.nodeIndexes.node3},{' '}
                      {messageConfig.terms.node4} {messageContent.nodeIndexes.node4}
                    </span>
                  )}
                  {message.type === 'config' && (
                    <span className="ml-2 text-sm text-blue-500">
                      [动态配置生成]
                    </span>
                  )}
                </p>
                <div className="flex space-x-2">
                  {(() => {
                    let copyText = '';
                    if (message.type === 'mainStructure') {
                      copyText = message.content;
                    } else if (message.type === terms.sectionDetailType && message.data) {
                      copyText = message.data[terms.detail] || '';
                    } else if (message.type === 'config') {
                      copyText = JSON.stringify(message.data, null, 2);
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
              ) : message.type === 'config' ? (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">动态配置生成结果</h3>
                  <pre className="whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(messageContent, null, 2)}
                  </pre>
                </div>
              ) : (
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{messageContent.content}</ReactMarkdown>
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
                          onClick={() => {
                            const currentConfig = message.selectedConfig || messageConfig;
                            const firstComplexItem = currentConfig.terms.node2ComplexItems[0];
                            if (!firstComplexItem) {
                              return;
                            }
                            
                            const startNodeIndexes = {
                              node2Name: firstComplexItem,
                              node3: 1,
                              node4: 1
                            };
                            
                            handleContinueFromMessage(startNodeIndexes, currentConfig);
                          }}
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
                      onClick={() => {
                        const currentConfig = message.selectedConfig || messageConfig;
                        handleContinueFromMessage({
                          node2Name: messageContent.nodeIndexes.node2Name,
                          node3: messageContent.nodeIndexes.node3,
                          node4: messageContent.nodeIndexes.node4,
                        }, currentConfig);
                      }}
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
    </div>
  );
} 