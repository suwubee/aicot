import React from 'react';
import { validateConfigurationChange, saveSelectedConfig } from '../services/configurationService';

const SettingsPanel = ({
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
  handleImport,
  fileInputRef,
  messages,
}) => {
  // 检查是否有主结构消息或非空消息
  const hasContent = messages?.some(message => 
    message.type === 'mainStructure' || 
    (message.content && message.content.trim() !== '')
  );
  
  // 检查是否使用动态配置
  const isDynamicConfig = selectedConfig?.isDynamic;

  const handleConfigChangeInternal = (event) => {
    const selectedId = event.target.value;
    const newConfig = configurations.find((config) => config.id === selectedId);
    
    // 验证配置切换
    const validationResult = validateConfigurationChange(newConfig, messages);
    
    if (!validationResult.canChange) {
      // 如果不能切换，显示提示信息
      alert(validationResult.message);
      // 重置选择框的值为当前配置
      event.target.value = selectedConfig?.id || '';
      return;
    }

    // 更新配置
    handleConfigChange(newConfig);
    
    // 保存配置
    saveSelectedConfig(newConfig);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* 配置管理部分 */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">配置管理</h3>
        <select
          id="selectedConfig"
          value={selectedConfig ? selectedConfig.id : ''}
          onChange={handleConfigChangeInternal}
          disabled={hasContent}
          className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 
            ${hasContent ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          {configurations.map((config) => (
            <option key={config.id} value={config.id}>
              {config.name}{config.isSystemConfig ? ' (系统)' : ''}
            </option>
          ))}
        </select>
        {hasContent && (
          <p className="text-sm text-gray-500 mt-1">
            {isDynamicConfig 
              ? '已使用动态思维链配置开始对话，如需使用其他配置，请开始新的对话。'
              : '已使用固定配置开始对话，如需使用其他配置，请开始新的对话。'}
          </p>
        )}
        <ul>
          {configurations.map((config) => (
            <li key={config.id} className="flex items-center justify-between w-full p-2 rounded">
              <span className="truncate flex-1">
                {config.name}
                {config.isSystemConfig && (
                  <span className="ml-2 text-xs text-gray-500">(系统)</span>
                )}
              </span>
              <div className="flex items-center space-x-2 ml-2">
                {!config.isSystemConfig && (
                  <>
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
                  </>
                )}
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
      <div className="space-y-2 mt-4">
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
          导入聊天记录和配置
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImport}
          accept=".json"
        />
      </div>
    </div>
  );
};

export default SettingsPanel; 