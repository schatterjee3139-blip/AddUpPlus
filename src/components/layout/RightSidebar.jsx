import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Info,
  FileText,
  ArrowRight,
  Loader2,
  BarChart3,
  GripVertical,
  Upload,
  X,
  File,
  Image as ImageIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { chatCompletionStream } from '../../lib/api';
import { useStudyMetrics } from '../../contexts/StudyMetricsContext.jsx';
import { stripMarkdown } from '../../lib/utils';
import { DesmosCalculator } from '../DesmosCalculator';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToUserData, updateAIChatData, initializeUserData } from '../../lib/localStorage';
import { processFile, formatMessageWithFile } from '../../lib/fileProcessing';

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
                // Increase time window to 5 seconds to prevent overwriting recent saves
                if (!isUpdatingRef.current && timeSinceLastSave > 5000) {
                  // Only update if Firebase has more messages than local (to prevent clearing)
                  setMessages((prevMessages) => {
                    if (userData.aiChat.messages.length >= prevMessages.length) {
                      return userData.aiChat.messages;
                    }
                    // Keep local messages if they're newer/more complete
                    return prevMessages;
                  });
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
            // Don't clear messages if Firebase returns empty but we have local messages
          } else if (isInitialLoadRef.current) {
            // No chat data, set initial message only on initial load
            const firstName = getUserFirstName();
            setMessages([{
              role: 'assistant',
              content: `Hi ${firstName}! I'm ready to help. Ask me to explain this concept, generate flashcards, or summarize the page.`,
            }]);
            isInitialLoadRef.current = false;
          }
          // Don't clear messages if userData.aiChat doesn't exist but we have local messages
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
            // Keep the flag for longer to prevent overwrites
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 3000); // Increased from 1000 to 3000ms
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
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef(null);
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

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsProcessingFile(true);
    const processedFiles = [];

    try {
      for (const file of files) {
        try {
          const fileData = await processFile(file);
          processedFiles.push(fileData);
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          // Show error but continue with other files
        }
      }

      setAttachedFiles((prev) => [...prev, ...processedFiles]);
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsProcessingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage = inputValue.trim() || 'Please analyze this file.';
    const messageWithFiles = attachedFiles.length > 0
      ? formatMessageWithFile(attachedFiles[0], userMessage) // For now, handle first file
      : userMessage;

    setInputValue('');
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    setIsLoading(true);
    isWaitingForAIResponseRef.current = true; // Prevent Firebase from overwriting

    // Use functional update to add user message immediately
    let conversationHistory;
    setMessages((prevMessages) => {
      // Add user message with file info to state immediately
      const messageContent = filesToSend.length > 0
        ? `${userMessage}${filesToSend.map(f => `\n[Attached: ${f.name}]`).join('')}`
        : userMessage;
      
      const updatedMessages = [...prevMessages, { 
        role: 'user', 
        content: messageContent,
        files: filesToSend.length > 0 ? filesToSend : undefined,
      }];
      
      // Prepare conversation history for API
      conversationHistory = updatedMessages
        .filter(msg => msg && msg.role && msg.content)
        .map(msg => {
          // If message has files, include file content in the message
          if (msg.files && msg.files.length > 0) {
            let content = String(msg.content || '').trim();
            // Add file content to the message (truncate if too long)
            msg.files.forEach((file) => {
              if (file.type === 'pdf') {
                // Limit PDF content to avoid token limits
                const pdfContent = file.content.length > 10000 
                  ? file.content.substring(0, 10000) + '\n\n[Content truncated. Please ask about specific sections if needed.]'
                  : file.content;
                content += `\n\n[PDF Content from ${file.name}]:\n${pdfContent}`;
              } else if (file.type === 'image') {
                // For images, we include a note (base64 is too large for text)
                content += `\n\n[Image: ${file.name} - Please analyze this image]`;
              }
            });
            return {
              role: msg.role,
              content: content.trim(),
            };
          }
          return {
            role: msg.role,
            content: String(msg.content || '').trim(),
          };
        })
        .filter(msg => msg.content.length > 0); // Remove empty messages

      return updatedMessages;
    });

    // Wait a tick to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 0));

    if (!conversationHistory || conversationHistory.length === 0) {
      setIsLoading(false);
      isWaitingForAIResponseRef.current = false;
      return;
    }

    console.log('Sending to NVIDIA API (streaming):', {
      messageCount: conversationHistory.length,
      lastMessage: conversationHistory[conversationHistory.length - 1]?.content?.substring(0, 50),
    });

    // Add placeholder assistant message that we'll update as chunks arrive
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      const userMessageMatch = lastMessage && (
        (typeof lastMessage.content === 'string' && lastMessage.content.includes(userMessage)) ||
        lastMessage.content === userMessage ||
        (lastMessage.role === 'user' && String(lastMessage.content).trim() === userMessage.trim())
      );
      
      if (lastMessage && userMessageMatch) {
        return [...prev, { role: 'assistant', content: '' }];
      }
      return [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: '' }];
    });

    // Start streaming
    let accumulatedContent = '';
    const abortController = chatCompletionStream(
      conversationHistory,
      (chunk) => {
        // Called for each chunk
        accumulatedContent += chunk;
        const cleanedChunk = stripMarkdown(accumulatedContent);
        
        // Update the last assistant message (the one we just added) with accumulated content
        setMessages((prev) => {
          const updated = [...prev];
          // Find the last assistant message (should be the one we just added)
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'assistant') {
              updated[i] = {
                ...updated[i],
                content: cleanedChunk,
              };
              break;
            }
          }
          return updated;
        });
      },
      (error) => {
        // Called on completion or error
        setIsLoading(false);
        isWaitingForAIResponseRef.current = false;

        if (error) {
          console.error('AI Chat streaming error:', error);
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
          
          // Update the last assistant message with error
          setMessages((prev) => {
            const updated = [...prev];
            // Find the last assistant message
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'assistant') {
                updated[i] = {
                  ...updated[i],
                  content: `Error: ${errorMessage}`,
                };
                break;
              }
            }
            return updated;
          });
        } else {
          // Success - record interaction
          recordAIInteraction();
        }
      },
      'meta/llama-3.1-8b-instruct',
      { useNoThink: true }
    );

    // Store abort controller for potential cancellation
    // You could add a cancel button that calls abortController.abort()
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
                    {/* Display attached files */}
                    {message.files && message.files.length > 0 && (
                      <div className="mb-2 space-y-2">
                        {message.files.map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            className={`p-2 rounded border ${
                              message.role === 'user'
                                ? 'bg-primary/20 border-primary/30'
                                : 'bg-muted border-border'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-xs">
                              {file.type === 'pdf' ? (
                                <File className="h-3 w-3" />
                              ) : (
                                <ImageIcon className="h-3 w-3" />
                              )}
                              <span className="font-medium">{file.name}</span>
                            </div>
                            {file.type === 'image' && file.preview && (
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="mt-2 max-w-full max-h-32 rounded object-contain"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
            {/* Attached Files Preview */}
            {attachedFiles.length > 0 && (
              <div className="mt-4 space-y-2 flex-shrink-0">
                <div className="text-xs font-medium text-muted-foreground">Attached Files:</div>
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border"
                    >
                      {file.type === 'pdf' ? (
                        <File className="h-4 w-4 text-primary" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-xs font-medium max-w-[120px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-1 hover:bg-background rounded p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="mt-4 relative flex-shrink-0">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isLoading || isProcessingFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0"
                  disabled={isLoading || isProcessingFile}
                  title="Upload PDF or Image"
                  onClick={() => {
                    if (fileInputRef.current && !isLoading && !isProcessingFile) {
                      fileInputRef.current.click();
                    }
                  }}
                >
                  {isProcessingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  id="ai-chat-input"
                  name="ai-chat-input"
                  placeholder={attachedFiles.length > 0 ? "Add a message or send..." : "Ask AI..."}
                  className="flex-1 pr-10"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading || isProcessingFile}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upload PDFs or images to analyze (max 10MB)
              </p>
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


