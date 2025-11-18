import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Info,
  FileText,
  ArrowRight,
  Loader2,
  BarChart3,
  GripVertical,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { chatCompletion } from '../../lib/api';
import { useStudyMetrics } from '../../contexts/StudyMetricsContext.jsx';
import { stripMarkdown } from '../../lib/utils';
import { DesmosCalculator } from '../DesmosCalculator';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToUserData, updateAIChatData, initializeUserData } from '../../lib/firestore';

export const RightSidebar = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('ai');
  const { rightSidebarWidth: sidebarWidth, setRightSidebarWidth: setSidebarWidth } = useSidebar();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  
  // Get user's first name
  const getUserFirstName = () => {
    if (!currentUser) return 'there';
    if (currentUser.displayName) {
      return currentUser.displayName.split(' ')[0];
    }
    if (currentUser.email) {
      return currentUser.email.split('@')[0];
    }
    return 'there';
  };

  // Initialize messages with user's name
  const getInitialMessage = () => {
    const firstName = getUserFirstName();
    return {
      role: 'assistant',
      content: `Hi ${firstName}! I'm ready to help. Ask me to explain this concept, generate flashcards, or summarize the page.`,
    };
  };

  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined') return [getInitialMessage()];
    if (!currentUser) {
      try {
        const stored = window.localStorage.getItem('aiChatMessages');
        return stored ? JSON.parse(stored) : [getInitialMessage()];
      } catch {
        return [getInitialMessage()];
      }
    }
    return [getInitialMessage()];
  });
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isInitialLoadRef = useRef(true);
  const lastSaveTimeRef = useRef(0);
  const isUpdatingRef = useRef(false);
  const isWaitingForAIResponseRef = useRef(false);

  // Load AI chat messages from Firebase
  useEffect(() => {
    if (!currentUser) {
      try {
        const stored = window.localStorage.getItem('aiChatMessages');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch {
        // Ignore
      }
      return;
    }

    const initializeAndSubscribe = async () => {
      try {
        await initializeUserData(currentUser.uid, {
          email: currentUser.email,
          displayName: currentUser.displayName,
        });

        const unsubscribe = subscribeToUserData(currentUser.uid, (userData) => {
          if (userData && userData.aiChat && userData.aiChat.messages) {
            if (userData.aiChat.messages.length > 0) {
              // Don't overwrite messages if we're waiting for an AI response
              if (isWaitingForAIResponseRef.current) {
                console.log('Skipping Firebase update - waiting for AI response');
                return;
              }
              
              // Only update if this is initial load or if we haven't saved recently
              if (isInitialLoadRef.current) {
                setMessages(userData.aiChat.messages);
                isInitialLoadRef.current = false;
              } else {
                const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
                if (!isUpdatingRef.current && timeSinceLastSave > 2000) {
                  setMessages(userData.aiChat.messages);
                }
              }
            } else if (isInitialLoadRef.current) {
              // Only set initial message if no messages exist and it's initial load
              const firstName = getUserFirstName();
              setMessages([{
                role: 'assistant',
                content: `Hi ${firstName}! I'm ready to help. Ask me to explain this concept, generate flashcards, or summarize the page.`,
              }]);
              isInitialLoadRef.current = false;
            }
          } else if (isInitialLoadRef.current) {
            // No chat data, set initial message only on initial load
            const firstName = getUserFirstName();
            setMessages([{
              role: 'assistant',
              content: `Hi ${firstName}! I'm ready to help. Ask me to explain this concept, generate flashcards, or summarize the page.`,
            }]);
            isInitialLoadRef.current = false;
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading AI chat:', error);
        return () => {};
      }
    };

    let unsubscribe;
    initializeAndSubscribe().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
      isInitialLoadRef.current = true;
    };
  }, [currentUser]);

  // Save AI chat messages to Firebase or localStorage (debounced)
  useEffect(() => {
    // Skip if initial load
    if (isInitialLoadRef.current && currentUser) {
      return;
    }

    // Skip if only initial message exists
    if (messages.length === 1 && messages[0].role === 'assistant' && isInitialLoadRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (currentUser) {
        isUpdatingRef.current = true;
        lastSaveTimeRef.current = Date.now();
        updateAIChatData(currentUser.uid, { messages })
          .then(() => {
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 1000);
          })
          .catch((error) => {
            console.error('Failed to save AI chat:', error);
            isUpdatingRef.current = false;
          });
      } else {
        try {
          window.localStorage.setItem('aiChatMessages', JSON.stringify(messages));
        } catch (error) {
          console.warn('Failed to persist AI chat', error);
        }
      }
    }, 500); // Debounce by 500ms

    return () => clearTimeout(timeoutId);
  }, [messages, currentUser]);

  // Update initial message when user changes (only if no messages exist)
  useEffect(() => {
    if (currentUser && messages.length === 1 && messages[0].role === 'assistant' && !messages[0].content.includes('Hi')) {
      const firstName = getUserFirstName();
      setMessages([{
        role: 'assistant',
        content: `Hi ${firstName}! I'm ready to help. Ask me to explain this concept, generate flashcards, or summarize the page.`,
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { recordAIInteraction } = useStudyMetrics();

  // Handle resizing
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 280;
      const maxWidth = 800;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    isWaitingForAIResponseRef.current = true; // Prevent Firebase from overwriting

    // Use functional update to add user message immediately
    let conversationHistory;
    setMessages((prevMessages) => {
      // Add user message to state immediately
      const updatedMessages = [...prevMessages, { role: 'user', content: userMessage }];
      
      // Prepare conversation history for API
      conversationHistory = updatedMessages
        .filter(msg => msg && msg.role && msg.content)
        .map(msg => ({
          role: msg.role,
          content: String(msg.content || '').trim(),
        }))
        .filter(msg => msg.content.length > 0); // Remove empty messages

      return updatedMessages;
    });

    // Wait a tick to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      if (!conversationHistory || conversationHistory.length === 0) {
        throw new Error('No valid messages to send');
      }

      console.log('Sending to NVIDIA API:', {
        messageCount: conversationHistory.length,
        lastMessage: conversationHistory[conversationHistory.length - 1]?.content?.substring(0, 50),
      });

      const response = await chatCompletion(conversationHistory);
      
      // Handle different response formats
      let aiResponse = null;
      
      if (response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
        // Standard OpenAI-compatible format
        aiResponse = response.choices[0]?.message?.content || 
                     response.choices[0]?.text ||
                     response.choices[0]?.content;
      } else if (response.content) {
        // Direct content field
        aiResponse = response.content;
      } else if (response.text) {
        // Text field
        aiResponse = response.text;
      } else if (response.message) {
        // Message object
        aiResponse = response.message.content || response.message.text || response.message;
      } else if (typeof response === 'string') {
        // String response
        aiResponse = response;
      }

      if (!aiResponse || aiResponse.trim().length === 0) {
        console.error('Unexpected API response format:', response);
        throw new Error('Received empty or invalid response from AI. Please try again.');
      }

      const cleanedResponse = stripMarkdown(String(aiResponse));
      
      // Use functional update to ensure we have the latest messages
      setMessages((prev) => {
        // Check if user message is already in the list (should be the last one)
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'user' && lastMessage.content === userMessage) {
          // User message is already there, just add AI response
          return [...prev, { role: 'assistant', content: cleanedResponse }];
        }
        // If for some reason user message is missing, add both
        return [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: cleanedResponse }];
      });
      
      recordAIInteraction();
    } catch (error) {
      console.error('AI Chat error:', error);
      let errorMessage = error.message || 'An unknown error occurred';
      
      // Provide more helpful error messages
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        errorMessage = 'The request took too long. This might be due to a complex question. Please try breaking it down into smaller parts or try again.';
      } else if (errorMessage.includes('CORS') || errorMessage.includes('Network error')) {
        errorMessage = 'Network error: Unable to connect to NVIDIA API. The server may need to be restarted, or there may be a CORS issue.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Authentication error: Please check your NVIDIA API key in the .env file.';
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = 'Access denied: Your API key may not have the required permissions.';
      } else if (errorMessage.includes('empty') || errorMessage.includes('invalid response')) {
        errorMessage = 'The AI returned an empty response. Please try rephrasing your question.';
      }
      
      // Use functional update to add error message
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'user' && lastMessage.content === userMessage) {
          return [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }];
        }
        return [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: `Error: ${errorMessage}` }];
      });
    } finally {
      setIsLoading(false);
      isWaitingForAIResponseRef.current = false; // Allow Firebase updates again
    }
  };

  return (
    <>
      {/* Resize Handle */}
      <div
        className={`fixed top-0 h-screen w-1 bg-transparent hover:bg-primary/50 cursor-col-resize z-20 hidden xl:block transition-colors ${
          isResizing ? 'bg-primary/50' : ''
        }`}
        style={{ right: `${sidebarWidth}px` }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <aside
        ref={sidebarRef}
        className="fixed top-0 right-0 h-screen border-l border-border bg-card p-4 hidden xl:flex flex-col z-10"
        style={{ width: `${sidebarWidth}px` }}
      >
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="ai"
            isActive={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles className="h-4 w-4 mr-2" /> AI Chat
          </TabsTrigger>
          <TabsTrigger
              value="calculator"
              isActive={activeTab === 'calculator'}
              onClick={() => setActiveTab('calculator')}
            >
              <BarChart3 className="h-4 w-4 mr-2" /> Calculator
          </TabsTrigger>
        </TabsList>

        {/* AI Chat Content */}
        {activeTab === 'ai' && (
          <TabsContent value="ai" className="flex-1 flex flex-col mt-4 overflow-hidden min-h-0">
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto space-y-4 p-2 rounded-md bg-muted/50 scroll-smooth min-h-0"
            >
              {/* Chat Messages */}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`p-3 rounded-lg max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.role === 'assistant' ? stripMarkdown(message.content) : message.content}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage
                        src={currentUser?.photoURL || `https://placehold.co/100x100/60a5fa/FFFFFF?text=${getUserFirstName().charAt(0).toUpperCase()}`}
                        alt={getUserFirstName()}
                      />
                      <AvatarFallback>{getUserFirstName().charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start space-x-2">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="bg-background p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <div className="mt-4 relative flex-shrink-0">
              <Input
                id="ai-chat-input"
                name="ai-chat-input"
                placeholder="Ask AI..."
                className="pr-10"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>
        )}

        {/* Calculator Content */}
        {activeTab === 'calculator' && (
          <TabsContent value="calculator" className="flex-1 flex flex-col mt-4 overflow-hidden min-h-0">
            <div className="flex-1 relative bg-background rounded-md border border-border overflow-hidden min-h-0">
              <DesmosCalculator
                key="desmos-calculator"
                isOpen={activeTab === 'calculator'}
                onClose={() => setActiveTab('ai')}
                embedded={true}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </aside>
    </>
  );
};


