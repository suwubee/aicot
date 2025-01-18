// configurationService.js

/**
 * 创建动态思维链配置
 * @returns {Object} 动态思维链配置
 */
const createDynamicConfig = () => ({
  id: 'dynamic',
  name: '动态思维链',
  isDynamic: true,
  isSystemConfig: true,
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
});

/**
 * 从本地存储加载配置项
 * @param {Object} defaultConfig - 默认配置
 * @returns {Array} 配置项列表
 */
export const loadConfigurations = (defaultConfig) => {
  // 始终创建动态思维链配置
  const dynamicConfig = createDynamicConfig();
  
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

  if (parsedConfigs && parsedConfigs.length > 0) {
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
};

/**
 * 加载选中的配置项
 * @param {Array} configurations - 配置项列表
 * @returns {Object} 选中的配置项
 */
export const loadSelectedConfig = (configurations) => {
  if (!configurations || configurations.length === 0) {
    return createDynamicConfig();
  }

  const storedSelectedConfig = localStorage.getItem('selectedConfig');
  let parsedConfig = null;
  
  if (storedSelectedConfig) {
    try {
      parsedConfig = JSON.parse(storedSelectedConfig);
      // 如果存储的是动态思维链配置，返回新的动态配置
      if (parsedConfig.id === 'dynamic') {
        return configurations[0];
      }
    } catch (error) {
      console.error('解析选中配置项时发生错误:', error);
      parsedConfig = null;
    }
  }

  if (parsedConfig) {
    // 确保配置仍然存在
    const configExists = configurations.some(config => config.id === parsedConfig.id);
    if (configExists) {
      return parsedConfig;
    }
  }
  
  // 默认返回第一个配置（动态思维链）
  return configurations[0];
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
  try {
    // 过滤掉系统配置
    const configsToSave = configurations.filter(config => config && !config.isSystemConfig);
    localStorage.setItem('configurations', JSON.stringify(configsToSave));
  } catch (error) {
    console.error('保存配置时发生错误:', error);
  }
};

/**
 * 保存选中的配置项到本地存储
 * @param {Object} config - 选中的配置项
 */
export const saveSelectedConfig = (config) => {
  try {
    // 不保存系统配置
    if (config && !config.isSystemConfig) {
      localStorage.setItem('selectedConfig', JSON.stringify(config));
    }
  } catch (error) {
    console.error('保存选中配置时发生错误:', error);
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

/**
 * 验证配置和 API 参数是否有效
 * @param {Object} params - 验证参数
 * @param {Object} params.selectedConfig - 当前选中的配置
 * @param {string} params.apiKey - API Key
 * @param {string} params.apiUrl - API URL
 * @param {boolean} params.showAlert - 是否显示弹框提示，默认为 true
 * @returns {Object} 验证结果，包含是否有效和错误信息
 */
export const validateConfigAndApi = ({ selectedConfig, apiKey, apiUrl, showAlert = true }) => {
  let error = null;

  if (!selectedConfig) {
    error = '请先选择一个配置项！';
  } else if (!apiKey || !apiKey.trim()) {
    error = '请先设置 API Key！';
  } else if (!apiUrl || !apiUrl.trim()) {
    error = '请先设置 API URL！';
  }

  if (error && showAlert) {
    alert(error);
  }

  return {
    isValid: !error,
    error
  };
}; 