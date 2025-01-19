import React from 'react';
import { Send, Loader2 } from 'lucide-react';

const InputArea = ({
  hasRenderedMainStructure,
  input,
  setInput,
  isLoading,
  isAdjusting,
  handleSubmit,
  handleKeyDown,
  textareaRef,
  currentChatIndex,
  chatHistories,
  setChatHistories,
}) => {
  if (hasRenderedMainStructure) {
    return null;
  }

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (currentChatIndex !== null && chatHistories[currentChatIndex].title === '未命名') {
      const newTitle = e.target.value.slice(0, 10) || '未命名';
      const updatedHistories = [...chatHistories];
      updatedHistories[currentChatIndex].title = newTitle;
      setChatHistories(updatedHistories);
    }
  };

  return (
    <div className="p-4 bg-white border-t">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
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
    </div>
  );
};

export default InputArea; 