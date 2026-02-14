import React, { useState, useEffect, useRef } from 'react';
import { Brain, Save, Trash2, Send, Loader, Settings, MessageSquare, Sparkles } from 'lucide-react';

interface AISettings {
  api_key: string;
  is_active: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const STORAGE_KEYS = {
  AI_SETTINGS: 'ai_settings',
  CHAT_HISTORY: 'ai_chat_history'
};

export default function AIAgentManager() {
  const [activeTab, setActiveTab] = useState<'settings' | 'chat'>('settings');
  const [settings, setSettings] = useState<AISettings>({
    api_key: '',
    is_active: true,
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSettings();
    loadChatHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const loadSettings = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.AI_SETTINGS);
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  };

  const loadChatHistory = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (stored) {
      setChatHistory(JSON.parse(stored));
    }
  };

  const saveSettings = () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(settings));
      alert('AI settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testAPIKey = async () => {
    if (!settings.api_key) {
      alert('Please enter an API key first');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello',
          settings: settings
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`❌ API Key Test Failed:\n\n${data.error}\n\nPlease check your API key and try again.`);
      } else if (data.response) {
        alert('✅ API Key Test Successful!\n\nYour Gemini API key is working correctly.');
      }
    } catch (error: any) {
      console.error('Test error:', error);
      if (error.message === 'API_NOT_AVAILABLE') {
        alert('⚠️ Cannot test in local development mode.\n\nDeploy to Cloudflare Pages to test the API key.');
      } else {
        alert(`❌ Test Failed:\n\n${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      setTesting(false);
    }
  };

  const saveChatHistory = (messages: ChatMessage[]) => {
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
  };

  const clearChatHistory = () => {
    if (!confirm('Are you sure you want to clear all chat history?')) return;

    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    setChatHistory([]);
  };

  const sendMessage = async () => {
    if (!message.trim() || loading || !settings.api_key) return;

    setLoading(true);
    const userMessage = message;
    setMessage('');

    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...chatHistory, tempUserMsg];
    setChatHistory(newHistory);
    saveChatHistory(newHistory);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          settings: settings
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API_NOT_AVAILABLE');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      const finalHistory = [...newHistory, assistantMsg];
      setChatHistory(finalHistory);
      saveChatHistory(finalHistory);
    } catch (error: any) {
      console.error('Error:', error);

      let errorMessage = 'Sorry, I encountered an error. ';

      if (error.message === 'API_NOT_AVAILABLE') {
        errorMessage = '⚠️ AI Assistant API is not available in local development mode.\n\n' +
          'To test the AI Assistant:\n' +
          '1. Deploy your site to Cloudflare Pages, OR\n' +
          '2. Run locally with: npm run dev:wrangler\n\n' +
          'The AI Assistant will work automatically once deployed.';
      } else if (error.message.includes('API key')) {
        errorMessage += 'Please check your API key is valid.';
      } else if (error.message.includes('fetch')) {
        errorMessage += 'Network error. Please check your connection.';
      } else if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('429')) {
        errorMessage += 'API quota exceeded. Please check your Gemini API limits.';
      } else if (error.message.includes('403')) {
        errorMessage += 'API key is invalid or doesn\'t have permission. Please check your Gemini API key.';
      } else if (error.message.includes('401')) {
        errorMessage += 'API key authentication failed. Please verify your Gemini API key.';
      } else if (error.message.includes('JSON')) {
        errorMessage = '⚠️ AI Assistant API is not available in local development mode.\n\n' +
          'To test the AI Assistant:\n' +
          '1. Deploy your site to Cloudflare Pages, OR\n' +
          '2. Run locally with: npm run dev:wrangler\n\n' +
          'The AI Assistant will work automatically once deployed.';
      } else {
        errorMessage += `Error: ${error.message}`;
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString(),
      };

      const finalHistory = [...newHistory, errorMsg];
      setChatHistory(finalHistory);
      saveChatHistory(finalHistory);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'What can I do to increase sales?',
    'Analyze my recent order trends',
    'Suggest marketing strategies for my products',
    'How can I improve customer retention?',
    'What are my best-selling products?',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Marketing Assistant</h2>
          <p className="text-sm text-gray-600">Get intelligent insights and recommendations for your business</p>
        </div>
      </div>

      <div className="flex gap-2 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'settings'
              ? 'text-purple-600 border-b-2 border-purple-600 -mb-0.5'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'chat'
              ? 'text-purple-600 border-b-2 border-purple-600 -mb-0.5'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Chat
        </button>
      </div>

      {import.meta.env.DEV && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <p className="text-sm text-amber-900">
            <strong>⚠️ Development Mode:</strong> AI Assistant API requires deployment to work. It will return errors in local dev mode. Deploy to Cloudflare Pages or run with <code className="bg-amber-100 px-2 py-1 rounded">npm run dev:wrangler</code> to test.
          </p>
        </div>
      )}

      {activeTab === 'settings' ? (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-6">
          <div className="space-y-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All settings and chat history are stored locally in your browser. Your API keys are never sent to any server except Google Gemini.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={settings.api_key}
                onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                placeholder="Enter your Gemini API key"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Google AI Studio</a>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={settings.is_active}
                onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                Enable AI Assistant
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={testAPIKey}
                disabled={testing || !settings.api_key || saving}
                className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {testing ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {testing ? 'Testing...' : 'Test API Key'}
              </button>
              <button
                onClick={saveSettings}
                disabled={saving || !settings.api_key || testing}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {!settings.api_key && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                <strong>Setup Required:</strong> Please add your Gemini API key in the Settings tab before starting a chat.
              </p>
            </div>
          )}

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Quick Prompts</h3>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(prompt)}
                      className="text-xs px-3 py-1.5 bg-white text-purple-700 rounded-full hover:bg-purple-100 transition-all border border-purple-200"
                      disabled={!settings.api_key}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 overflow-hidden">
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <Brain className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm">Start a conversation with your AI assistant</p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-100' : 'text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                    <Loader className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t-2 border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={settings.api_key ? "Ask for marketing insights, business advice..." : "Add API key in Settings first..."}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading || !settings.api_key}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !message.trim() || !settings.api_key}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {chatHistory.length > 0 && (
            <button
              onClick={clearChatHistory}
              className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat History
            </button>
          )}
        </div>
      )}
    </div>
  );
}
