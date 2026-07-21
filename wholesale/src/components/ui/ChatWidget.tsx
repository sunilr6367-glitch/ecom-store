'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, X, Minimize2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { storefrontTrust } from '@/config/storefront-trust';
import { cn } from '@/lib/utils';
import Input from '@/components/ui/Input';
import { IconButton, UnstyledButton } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { TawkToWidget } from '@/components/ui/TawkToWidget';

declare global {
  interface Window {
    Tawk_API?: {
      embedded?: string;
    };
    Tawk_LoadStart?: Date;
  }
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<
    { role: 'user' | 'bot'; text: string }[]
  >([
    {
      role: 'bot',
      text: 'Hello! Welcome to Odhvica. How can we help you today?',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const TAWK_PROPERTY_ID = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;

  if (TAWK_PROPERTY_ID) {
    return <TawkToWidget propertyId={TAWK_PROPERTY_ID} />;
  }

  const quickReplies = [
    { label: 'Track my order', action: 'I want to track my order' },
    { label: 'Return an item', action: 'How do I return an item?' },
    { label: 'Shipping info', action: 'What are the shipping options?' },
    { label: 'Payment help', action: 'I need help with payment' },
  ];

  const getBotResponse = (message: string) => {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('track') || lowerMsg.includes('order')) {
      return `You can track your order at ${storefrontTrust.policyRoutes.track}. Enter your order ID and email to see live status updates.`;
    }

    if (lowerMsg.includes('return') || lowerMsg.includes('refund')) {
      return `Eligible return guidance is available at ${storefrontTrust.policyRoutes.returns}. Signed-in customers can also open an order and request a return from their account when the order is eligible.`;
    }

    if (lowerMsg.includes('shipping') || lowerMsg.includes('delivery')) {
      return storefrontTrust.shippingSummary;
    }

    if (lowerMsg.includes('payment') || lowerMsg.includes('failed')) {
      return `Use ${storefrontTrust.policyRoutes.paymentHelp} if a payment attempt fails or you are unsure whether you were charged.`;
    }

    if (lowerMsg.includes('contact') || lowerMsg.includes('support')) {
      return `Reach us at ${storefrontTrust.supportEmail} or ${storefrontTrust.supportPhone} during ${storefrontTrust.supportHours}.`;
    }

    return `Thank you for your message. For order issues, payments, or policy questions, our support team can help at ${storefrontTrust.supportEmail}.`;
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInputText('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: getBotResponse(userMessage) },
      ]);
    }, 500);
  };

  const handleQuickReply = (action: string) => {
    setMessages((prev) => [...prev, { role: 'user', text: action }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: getBotResponse(action) },
      ]);
    }, 500);
  };

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  return (
    <>
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-40 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ds-text-primary)] text-inverse shadow-xl transition-colors hover:bg-[var(--ds-accent-hover)] md:bottom-6 md:right-6"
          onClick={handleOpenChat}
          aria-label="Open chat support"
        >
          <MessageCircle size={24} />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              cardClasses,
              'fixed bottom-40 right-4 z-50 w-[calc(100vw-1rem)] max-w-80 overflow-hidden shadow-2xl md:bottom-6 md:right-6 md:w-96',
              isMinimized ? 'h-14' : 'h-[500px]'
            )}
          >
            <div className="flex items-center justify-between bg-[var(--ds-text-primary)] p-4 text-inverse">
              <div className="flex items-center gap-[var(--ds-space-xs)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(var(--ds-cream-rgb),0.2)]">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <h3 className="font-medium text-body-sm">Customer Support</h3>
                  <p className="text-body-xs text-[rgba(var(--ds-cream-rgb),0.72)]">
                    We&apos;re here to help
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <IconButton
                  onClick={() => setIsMinimized(!isMinimized)}
                  variant="ghost"
                  size="sm"
                  className="rounded-full border-transparent text-inverse hover:bg-[rgba(var(--ds-cream-rgb),0.12)]"
                  aria-label="Minimize chat"
                >
                  <Minimize2 size={16} />
                </IconButton>
                <IconButton
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="rounded-full border-transparent text-inverse hover:bg-[rgba(var(--ds-cream-rgb),0.12)]"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </IconButton>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex flex-col h-[calc(100%-64px)]">
                <div className="flex-1 overflow-y-auto bg-surface p-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-[var(--ds-space-sm)] py-[var(--ds-space-xs)] text-body-sm ${
                            message.role === 'user'
                              ? 'rounded-tr-sm bg-[var(--ds-text-primary)] text-inverse'
                              : 'rounded-tl-sm border border-border-subtle bg-[var(--ds-surface-paper)] text-secondary'
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-wrap gap-[var(--ds-space-xs)]">
                      {quickReplies.map((reply) => (
                        <UnstyledButton
                          key={reply.label}
                          type="button"
                          onClick={() => handleQuickReply(reply.action)}
                          className="rounded-full border border-border-subtle bg-[var(--ds-surface-paper)] px-3 py-1.5 text-body-xs text-secondary transition-colors hover:border-[var(--ds-accent-primary)] hover:text-accent"
                        >
                          {reply.label}
                        </UnstyledButton>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border-subtle bg-[var(--ds-surface-paper)] p-4">
                  <form
                    className="flex gap-[var(--ds-space-xs)]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleSendMessage();
                    }}
                  >
                    <Input
                      type="text"
                      placeholder="Type your message..."
                      value={inputText}
                      onChange={(event) => setInputText(event.target.value)}
                      containerClassName="flex-1"
                      className="h-10 rounded-[var(--ds-radius-pill)]"
                    />
                    <IconButton
                      type="submit"
                      variant="secondary"
                      size="md"
                      className="rounded-[var(--ds-radius-pill)]"
                      aria-label="Send message"
                    >
                      <Send size={16} />
                    </IconButton>
                  </form>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-body-xs text-muted">
                    <Link href={storefrontTrust.policyRoutes.paymentHelp} className="underline underline-offset-4">
                      Payment Help
                    </Link>
                    <Link href={storefrontTrust.policyRoutes.returns} className="underline underline-offset-4">
                      Returns
                    </Link>
                    <Link href={storefrontTrust.policyRoutes.contact} className="underline underline-offset-4">
                      Contact
                    </Link>
                  </div>
                  <p className="mt-2 text-center text-body-xs text-muted">
                    {storefrontTrust.supportHours}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


