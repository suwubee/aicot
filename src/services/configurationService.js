// configurationService.js

/**
 * 从本地存储加载配置项
 * @param {Object} defaultConfig - 默认配置
 * @returns {Array} 配置项列表
 */
export const loadConfigurations = (defaultConfig) => {
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
};

/**
 * 加载选中的配置项
 * @param {Array} configurations - 配置项列表
 * @returns {Object} 选中的配置项
 */
export const loadSelectedConfig = (configurations) => {
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
    // 如果没有选中的默认选择第一个
    const defaultConfig = configurations[0];
    localStorage.setItem('selectedConfig', JSON.stringify(defaultConfig));
    return defaultConfig;
  } else {
    return null;
  }
};

/**
 * 创建新的配置项
 * @param {Object} defaultConfig - 默认配置
 * @returns {Object} 新的配置项
 */
export const createNewConfig = (defaultConfig) => {
  return {
    ...defaultConfig,
    id: Date.now().toString(),
    name: '思考模型',
  };
};

/**
 * 保存配置项到本地存储
 * @param {Array} configurations - 配置项列表
 */
export const saveConfigurations = (configurations) => {
  localStorage.setItem('configurations', JSON.stringify(configurations));
};

/**
 * 保存选中的配置项到本地存储
 * @param {Object} selectedConfig - 选中的配置项
 */
export const saveSelectedConfig = (selectedConfig) => {
  if (selectedConfig) {
    localStorage.setItem('selectedConfig', JSON.stringify(selectedConfig));
  } else {
    localStorage.removeItem('selectedConfig');
  }
};

/**
 * 编辑配置项
 * @param {string} configString - 配置项字符串
 * @returns {Object|null} 编辑后的配置项或null
 */
export const editConfig = (configString) => {
  try {
    const newConfig = JSON.parse(configString);
    if (!newConfig.name) {
      throw new Error('配置项必须包含名称');
    }
    return newConfig;
  } catch (error) {
    console.error('编辑配置项时发生错误:', error);
    return null;
  }
}; 