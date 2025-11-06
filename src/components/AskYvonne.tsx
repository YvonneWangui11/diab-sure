import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import yvonneAvatar from '@/assets/yvonne-avatar.png';
import { Send, Bot, User, Mic, MicOff } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AskYvonne = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://iynqladfgyhfpwadmtgd.supabase.co/functions/v1/ask-yvonne",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bnFsYWRmZ3loZnB3YWRtdGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3ODEwODgsImV4cCI6MjA2OTM1NzA4OH0.Jbp5oP399VeaPkJBoxbMltKiK2DjKVhSk5IAdYK8FZ8`,
          },
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast({
            variant: "destructive",
            title: "Rate Limit",
            description: "Too many requests. Please try again later.",
          });
        } else if (response.status === 402) {
          toast({
            variant: "destructive",
            title: "Service Unavailable",
            description: "AI credits depleted. Please contact support.",
          });
        } else {
          throw new Error("Failed to start chat stream");
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      });
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    await streamChat(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Recording error:', error);
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];

        const response = await fetch(
          "https://iynqladfgyhfpwadmtgd.supabase.co/functions/v1/transcribe-audio",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5bnFsYWRmZ3loZnB3YWRtdGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3ODEwODgsImV4cCI6MjA2OTM1NzA4OH0.Jbp5oP399VeaPkJBoxbMltKiK2DjKVhSk5IAdYK8FZ8`,
            },
            body: JSON.stringify({ audio: base64Data }),
          }
        );

        if (!response.ok) {
          throw new Error("Transcription failed");
        }

        const { text } = await response.json();
        setInput(text);
        setIsTranscribing(false);
        
        toast({
          title: "Voice Transcribed",
          description: "Your message has been transcribed successfully.",
        });
      };
    } catch (error: any) {
      console.error('Transcription error:', error);
      setIsTranscribing(false);
      toast({
        variant: "destructive",
        title: "Transcription Error",
        description: "Failed to transcribe audio. Please try again.",
      });
    }
  };

  return (
    <div className="h-full flex flex-col gap-0">
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <img 
                  src={yvonneAvatar} 
                  alt="Dr. Yvonne" 
                  className="h-16 w-16 rounded-full object-cover"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">Welcome! I'm Dr. Yvonne</h3>
              <p className="text-muted-foreground mb-6">Your AI-powered diabetes care companion</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                <div className="p-4 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setInput("What should I eat for better blood sugar control?")}>
                  <p className="text-sm font-medium">💡 Nutrition Tips</p>
                  <p className="text-xs text-muted-foreground mt-1">Get personalized dietary advice</p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setInput("What exercises are best for managing diabetes?")}>
                  <p className="text-sm font-medium">🏃 Exercise Guide</p>
                  <p className="text-xs text-muted-foreground mt-1">Learn about diabetes-friendly workouts</p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setInput("How can I better track my glucose levels?")}>
                  <p className="text-sm font-medium">📊 Glucose Tracking</p>
                  <p className="text-xs text-muted-foreground mt-1">Optimize your monitoring routine</p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setInput("Tell me about medication management")}>
                  <p className="text-sm font-medium">💊 Medication Help</p>
                  <p className="text-xs text-muted-foreground mt-1">Understand your prescriptions</p>
                </div>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0">
                  <img 
                    src={yvonneAvatar} 
                    alt="Dr. Yvonne" 
                    className="h-10 w-10 rounded-full border-2 border-primary/20 object-cover shadow-sm"
                  />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border/50 rounded-bl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-secondary/20">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex-shrink-0">
                <img 
                  src={yvonneAvatar} 
                  alt="Dr. Yvonne" 
                  className="h-10 w-10 rounded-full border-2 border-primary/20 object-cover shadow-sm"
                />
              </div>
              <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2.5 w-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2.5 w-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t bg-card/50 backdrop-blur-sm px-6 py-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading || isTranscribing}
            size="lg"
            variant={isRecording ? "destructive" : "outline"}
            className="h-12 w-12 rounded-full p-0 shadow-lg hover:shadow-xl transition-all"
          >
            {isRecording ? (
              <MicOff className="h-5 w-5 animate-pulse" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          <Input
            placeholder={isTranscribing ? "Transcribing..." : "Ask Dr. Yvonne about diabetes care, nutrition, exercise..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || isRecording || isTranscribing}
            className="flex-1 h-12 px-4 text-base rounded-full border-2 focus:border-primary transition-colors"
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim() || isRecording || isTranscribing}
            size="lg"
            className="h-12 w-12 rounded-full p-0 shadow-lg hover:shadow-xl transition-all"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3 max-w-4xl mx-auto">
          {isRecording && "🎤 Recording... Click the microphone button again to stop"}
          {isTranscribing && "✨ Transcribing your voice..."}
          {!isRecording && !isTranscribing && "Dr. Yvonne provides general health information. Always consult your healthcare provider for medical advice."}
        </p>
      </div>
    </div>
  );
};
