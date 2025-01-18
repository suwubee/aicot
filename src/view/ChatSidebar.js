import React from 'react';
import { Settings } from 'lucide-react';
import SettingsPanel from './SettingsPanel';

export default function ChatSidebar({
  chatHistories,
  currentChatIndex,
  handleChatClick,
  deleteChatHistory,
  startNewChat,
  messages,
  showSettings,
  setShowSettings,
  apiUrl,
  setApiUrl,
  apiKey,
  handleApiKeyChange,
  model,
  setModel,
  models,
  configurations,
  selectedConfig,
  handleConfigChange,
  handleConfigAdd,
  handleConfigEdit,
  handleConfigDelete,
  handleExport,
  handleImportClick,
  fileInputRef,
  configFileInputRef,
  handleImportConfigs,
  handleImport,
  mainStructure,
  currentNodeIndexes,
}) {
  return (
    <div className="flex flex-col h-full">
      {/* 聊天历史部分 - 占据上半部分 */}
      <div className="h-1/2 flex flex-col min-h-0 border-b">
        <h2 className="text-lg font-bold p-4 flex-shrink-0">聊天记录</h2>
        <div className="flex-1 overflow-y-auto px-4">
          <div className="space-y-2 pb-4">
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
        <div className="p-4 border-t flex-shrink-0">
          <button
            onClick={startNewChat}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none"
          >
            新建聊天
          </button>
        </div>
      </div>

      {/* 设置部分 - 占据下半部分 */}
      <div className="h-1/2 flex flex-col min-h-0">
        <div className="p-4 border-b flex-shrink-0">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none"
          >
            <Settings className="w-4 h-4 mr-2 inline" />
            设置
          </button>
        </div>
        {showSettings && (
          <div className="flex-1 overflow-y-auto">
            <SettingsPanel
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
              handleImport={handleImport}
              fileInputRef={fileInputRef}
            />
          </div>
        )}
      </div>

      <input
        type="file"
        ref={configFileInputRef}
        style={{ display: 'none' }}
        onChange={handleImportConfigs}
        accept=".json"
      />
    </div>
  );
} 