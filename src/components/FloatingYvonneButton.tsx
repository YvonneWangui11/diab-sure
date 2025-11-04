import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AskYvonne } from './AskYvonne';
import yvonneAvatar from '@/assets/yvonne-avatar.png';

export const FloatingYvonneButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all z-50 p-0 overflow-hidden"
        aria-label="Ask Yvonne"
      >
        <img 
          src={yvonneAvatar} 
          alt="Yvonne Assistant" 
          className="h-full w-full object-cover"
        />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[80vh] p-0">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <img 
                  src={yvonneAvatar} 
                  alt="Yvonne" 
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <h2 className="text-lg font-semibold">Ask Yvonne</h2>
                  <p className="text-sm text-muted-foreground">Your DiabSure AI Assistant</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AskYvonne />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
