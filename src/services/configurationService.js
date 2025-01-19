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
 * 验证配置切换
 * @param {Object} newConfig - 新的配置
 * @param {Array} messages - 消息列表
 * @returns {Object} 验证结果，包含是否可以切换和提示信息
 */
export function validateConfigurationChange(newConfig, messages) {
  // 如果没有消息列表，允许切换配置
  if (!messages || !Array.isArray(messages)) {
    return {
      canChange: true,
      message: ''
    };
  }

  // 检查消息列表中是否已经有主结构消息
  const mainStructureMessage = messages.find(message => 
    message.type === 'mainStructure'
  );

  // 如果没有主结构消息，允许切换配置
  if (!mainStructureMessage) {
    return {
      canChange: true,
      message: ''
    };
  }

  // 如果存在主结构消息且其使用了动态配置，且要切换到非动态配置，返回警告信息
  if (mainStructureMessage.selectedConfig?.isDynamic && !newConfig?.isDynamic) {
    return {
      canChange: false,
      message: '当前消息列表使用的是动态思维链配置，切换配置可能会影响当前的生成结果。'
    };
  }

  // 如果存在主结构消息但使用的是静态配置，不允许切换配置
  if (mainStructureMessage && !mainStructureMessage.selectedConfig?.isDynamic) {
    return {
      canChange: false,
      message: '已生成的主结构使用了固定配置，无法切换到其他配置。'
    };
  }

  return {
    canChange: true,
    message: ''
  };
}

/**
 * 保存选中的配置
 * @param {Object} config - 选中的配置项
 */
export function saveSelectedConfig(config) {
  if (!config?.isSystemConfig) {
    localStorage.setItem('selectedConfigId', config.id);
  }
}

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