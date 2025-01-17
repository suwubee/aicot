// ChatInterfaceView.js

import React, { useState } from 'react';
import MessageList from './view/MessageList';
import ChatSidebar from './view/ChatSidebar';
import InputArea from './view/InputArea';

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
  handleExportMarkdown,
  configFileInputRef,
}) {
  const [localAdjustInputs, setLocalAdjustInputs] = useState(Array(messages.length).fill(false));
  const [localErrors, setLocalErrors] = useState(Array(messages.length).fill(''));

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

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('复制成功');
    } catch (err) {
      console.error('复制失败：', err);
      alert('复制失败，请重试');
    }
  };

  const hasRenderedMainStructure = messages.some((message) => message.type === 'mainStructure');

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧边栏 */}
      <div className={`${
        showSidebar 
          ? 'fixed inset-0 z-40 w-full md:w-64 md:relative' 
          : 'hidden md:block w-64'
      } bg-gray-200 border-r h-screen`}>
        {/* 移动端关闭按钮 */}
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

        <ChatSidebar
          chatHistories={chatHistories}
          currentChatIndex={currentChatIndex}
          handleChatClick={handleChatClick}
          deleteChatHistory={(index) => {
            const updatedHistories = chatHistories.filter((_, i) => i !== index);
            setChatHistories(updatedHistories);
            localStorage.setItem('chatHistories', JSON.stringify(updatedHistories));
            if (currentChatIndex === index) {
              setCurrentChatIndex(null);
              setMessages([]);
            } else if (currentChatIndex > index) {
              setCurrentChatIndex(currentChatIndex - 1);
            }
          }}
          saveChatHistory={saveChatHistory}
          startNewChat={startNewChat}
          messages={messages}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          apiUrl={apiUrl}
          setApiUrl={setApiUrl}
          apiKey={apiKey}
          handleApiKeyChange={handleApiKeyChange}
          model={model}
          setModel={setModel}
          models={models}
          configurations={configurations}
          selectedConfig={selectedConfig}
          handleConfigChange={handleConfigChange}
          handleConfigAdd={handleConfigAdd}
          handleConfigEdit={handleConfigEdit}
          handleConfigDelete={handleConfigDelete}
          handleExport={handleExport}
          handleImportClick={handleImportClick}
          fileInputRef={fileInputRef}
          configFileInputRef={configFileInputRef}
          handleImportConfigs={handleImport}
        />
      </div>

      {/* 右侧主内容区域 */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
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

        {/* 配置选择提示 */}
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

        {/* 消息列表 */}
        <div 
          className="flex-1 overflow-y-auto scroll-smooth" 
          ref={scrollAreaRef}
          style={{ scrollBehavior: 'smooth' }}
        >
          <MessageList
            messages={messages}
            handleDeleteMessage={handleDeleteMessage}
            handleCopy={handleCopy}
            handleContinueFromMessage={handleContinueFromMessage}
            handleAdjustSubmit={handleAdjustSubmit}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            isFinished={isFinished}
            isAdjusting={isAdjusting}
            adjustedContent={adjustedContent}
            setAdjustedContent={setAdjustedContent}
            localAdjustInputs={localAdjustInputs}
            setLocalAdjustInputs={setLocalAdjustInputs}
            localErrors={localErrors}
            setLocalErrors={setLocalErrors}
            selectedConfig={selectedConfig}
            mainStructure={mainStructure}
            handleExportMarkdown={handleExportMarkdown}
          />
            {error && (
              <div className="mb-4 p-4 bg-red-100 rounded-lg shadow-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}
        </div>
        
        {/* 输入区域 */}
        <InputArea
          hasRenderedMainStructure={hasRenderedMainStructure}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          isAdjusting={isAdjusting}
          handleSubmit={handleSubmit}
          handleKeyDown={handleKeyDown}
          textareaRef={textareaRef}
          currentChatIndex={currentChatIndex}
          chatHistories={chatHistories}
          setChatHistories={setChatHistories}
        />
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
