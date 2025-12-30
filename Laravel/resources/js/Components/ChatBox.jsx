import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import axios from 'axios';

const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I am your AI assistant for the UTM Report System. I can help you understand how to handle incidents like traffic issues or suspicious activities, and provide penalty recommendations. How can I assist you today?'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const history = messages.slice(1).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await axios.post('/chat-proxy.php', {
                message: userMessage,
                history: history
            });

            if (response.data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickQuestions = [
        "What is the fine for illegal parking?",
        "How to handle suspicious person?",
        "Penalty for speeding on campus?"
    ];

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">AI Incident Assistant</h3>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-blue-600" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-md'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-gray-600" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-2 justify-start">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 rounded-bl-md">
                                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions */}
                    {messages.length <= 2 && !isLoading && (
                        <div className="px-4 py-2 border-t border-gray-100 bg-white">
                            <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                            <div className="flex flex-wrap gap-2">
                                {quickQuestions.map((q, i) => (
                                    <button key={i} onClick={() => setInput(q)} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 bg-white">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about incident handling..."
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-500"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatBox;
