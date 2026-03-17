import { useState, useEffect } from 'react';
import { chatService } from '../services/authService';
import { Send, X } from 'lucide-react';

export default function ChatWidget({ currentUser, targetUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUser, targetUser]);

  const loadMessages = async () => {
    if (!currentUser || !targetUser) return;
    const data = await chatService.getMessages(currentUser.id, targetUser.id);
    setMessages(data);
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    await chatService.sendMessage(currentUser.id, targetUser.id, messageText);
    setMessageText('');
    loadMessages();
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <span className="font-semibold">Chat with {targetUser?.name}</span>
        <button onClick={onClose} className="hover:bg-indigo-700 rounded p-1">
          <X size={18} />
        </button>
      </div>
      
      <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-xs ${
                msg.senderId === currentUser.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <p className="text-sm">{msg.messageText}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t bg-white rounded-b-lg flex gap-2">
        <input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
