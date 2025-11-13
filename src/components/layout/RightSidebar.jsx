import React, { useState } from 'react';
import {
  Sparkles,
  Info,
  FileText,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { chatCompletion } from '../../lib/api';
import { useStudyMetrics } from '../../contexts/StudyMetricsContext.jsx';

export const RightSidebar = () => {
  const [activeTab, setActiveTab] = useState('ai');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi Cameron! I'm ready to help. Ask me to explain this concept, generate flashcards, or summarize the page.",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { recordAIInteraction } = useStudyMetrics();

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatCompletion(userMessage);
      const aiResponse = response.choices?.[0]?.message?.content || 
        response.content ||
        'Sorry, I encountered an error. Please try again.';
      
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
      recordAIInteraction();
    } catch (error) {
      console.error('AI Chat error:', error);
      let errorMessage = error.message || 'An unknown error occurred';
      
      // Provide more helpful error messages
      if (errorMessage.includes('CORS') || errorMessage.includes('Network error')) {
        errorMessage = 'Network error: Unable to connect to NVIDIA API. The server may need to be restarted, or there may be a CORS issue.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Authentication error: Please check your NVIDIA API key in the .env file.';
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = 'Access denied: Your API key may not have the required permissions.';
      }
      
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="fixed top-0 right-0 h-screen w-80 border-l border-border bg-card p-4 hidden xl:flex flex-col z-10">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="ai"
            isActive={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles className="h-4 w-4 mr-2" /> AI Chat
          </TabsTrigger>
          <TabsTrigger
            value="details"
            isActive={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
          >
            <Info className="h-4 w-4 mr-2" /> Details
          </TabsTrigger>
        </TabsList>

        {/* AI Chat Content */}
        {activeTab === 'ai' && (
          <TabsContent value="ai" className="flex-1 flex flex-col mt-4">
            <div className="flex-1 overflow-y-auto space-y-4 p-2 rounded-md bg-muted/50">
              {/* Chat Messages */}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`p-3 rounded-lg max-w-xs ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src="https://placehold.co/100x100/60a5fa/FFFFFF?text=C"
                        alt="Cameron"
                      />
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="bg-background p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
            {/* Input */}
            <div className="mt-4 relative">
              <Input
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

        {/* Details Content */}
        {activeTab === 'details' && (
          <TabsContent value="details" className="flex-1 overflow-y-auto mt-4 space-y-6">
            {/* Metadata */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Metadata</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Edited:</span>
                  <span>2m ago</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reading Time:</span>
                  <span>~ 5 min</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    Kinetics
                  </span>
                  <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    AP Chem
                  </span>
                  <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    Unit 4
                  </span>
                </div>
              </div>
            </div>

            {/* Related Notes */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Related Notes</h4>
              <div className="space-y-2">
                <a
                  href="#"
                  className="block text-sm hover:text-primary transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2 inline" /> Rate Laws
                </a>
                <a
                  href="#"
                  className="block text-sm hover:text-primary transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2 inline" /> Collision Theory
                </a>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  Export as PDF
                </Button>
                <Button variant="outline" size="sm">
                  Summarize
                </Button>
                <Button variant="outline" size="sm">
                  Create Quiz
                </Button>
                <Button variant="outline" size="sm">
                  Convert to Deck
                </Button>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </aside>
  );
};


