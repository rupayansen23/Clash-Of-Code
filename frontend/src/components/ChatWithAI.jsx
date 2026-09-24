import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Bot, Send } from 'lucide-react';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from "react-markdown"

export default function ChatAi({ problem }) {
    const [messages, setMessages] = useState([
        { role: 'model', parts: [{ text: "Hi, How are you" }] },
        { role: 'user', parts: [{ text: "I am Good" }] }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const onSubmit = async (data) => {
        setMessages(prev => [...prev, { role: 'user', parts: [{ text: data.message }] }]);
        setIsTyping(true);
        reset();

        try {
            const response = await axiosClient.post("/ai/chat", {
                messages: messages,
                title: problem.title,
                description: problem.description,
                testCases: problem.visibleTestCases,
                startCode: problem.startCode
            });

            console.log(response.data);

            // ✅ Extract the actual string from the response
            const aiText =
                typeof response.data === "string"
                    ? response.data
                    : response.data.message || response.data.text || response.data.reply || "No response";

            setMessages(prev => [...prev, {
                role: 'model',
                parts: [{ text: aiText }]
            }]);
        } catch (error) {
            console.error("API Error:", error);
            setMessages(prev => [...prev, {
                role: 'model',
                parts: [{ text: "Sorry, I could not respond right now. Please try again." }]
            }]);
        } finally {
            setIsTyping(false);
        }
    };
    return (
        <div className="flex h-full min-h-125 flex-col">
            <div className="flex shrink-0 items-center gap-3 border-b border-base-300 bg-base-100 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Bot size={22} aria-hidden="true" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-base-content">Chat With AI</h2>
                    <p className="text-xs text-base-content/60">Your coding assistant</p>
                </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
                    >
                        <div className="chat-bubble bg-base-200 text-base-content [&>p]:m-0 [&>ul]:list-disc [&>ul]:ml-4t">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.parts[0].text}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="chat chat-start" aria-label="AI is typing">
                        <div className="chat-bubble bg-base-200 text-base-content">
                            <span className="loading loading-dots loading-sm" aria-hidden="true" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="sticky bottom-0 z-10 border-t border-base-300 bg-base-100/95 px-5 pb-5 pt-4 backdrop-blur"
            >
                <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <input
                        placeholder="Ask me anything"
                        autoComplete="off"
                        className="input input-ghost min-w-0 flex-1 border-0 bg-transparent px-3 text-sm outline-none focus:outline-none"
                        {...register("message", { required: true, minLength: 2 })}
                    />
                    <button
                        type="submit"
                        aria-label="Send message"
                        className="btn btn-primary btn-circle btn-sm shrink-0 shadow-sm"
                        disabled={errors.message || isTyping}
                    >
                        <Send size={17} />
                    </button>
                </div>
            </form>
        </div>
    );
}
