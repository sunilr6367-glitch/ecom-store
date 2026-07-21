'use client';


import { Heading } from '@/design-system';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useStudioChatSocket } from '@/hooks/useStudioChatSocket';
import { api } from '@/lib/api';
import { Textarea } from '@/design-system';
import { Button, UnstyledButton } from '@/design-system';

interface StudioMessage {
  id: string;
  sender_type: 'customer' | 'admin' | string;
  sender_name: string | null;
  message: string;
  created_at: string;
}

interface StudioInquiry {
  id: string;
  product_title: string;
  product_url: string | null;
  status: string;
  inquiry_type: string;
}

export default function AccountMessageDetailPage() {
  const { customer, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<StudioInquiry | null>(null);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [studioTyping, setStudioTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !customer) router.push(`/login?redirect=/account/messages/${params.id}`);
  }, [customer, loading, params.id, router]);

  const appendMessage = useCallback((message: StudioMessage) => {
    setMessages((prev) => {
      if (message.id && prev.some((item) => item.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const { isConnected: liveConnected, sendTyping } = useStudioChatSocket({
    inquiryId: params.id,
    authMode: 'account',
    enabled: Boolean(customer && !loading),
    onMessage: ({ message }) => appendMessage(message),
    onTyping: ({ senderType, isTyping }) => {
      if (senderType === 'admin') setStudioTyping(isTyping);
    },
  });

  const loadConversation = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomerStudioInquiry(params.id);
      setInquiry(data.inquiry);
      setMessages(data.messages || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (loading || !customer) return;
    void loadConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, loading, params.id]);

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const data = await api.sendCustomerStudioMessage(params.id, reply.trim());
      appendMessage(data.message);
      setReply('');
      sendTyping(false);
    } finally {
      setSending(false);
    }
  };

  const handleReplyChange = (value: string) => {
    setReply(value);
    sendTyping(Boolean(value.trim()));
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTyping(false), 1200);
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  if (loading || !customer) {
    return <div className="kv-page-gutter min-h-screen bg-parchment px-6 py-12 md:px-12 lg:px-20" />;
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link href="/account/messages" className="account-muted hover:text-primary">
              Messages
            </Link>
            <Heading role="page" className="account-page-title mt-2">{inquiry?.product_title || 'Studio Chat'}</Heading>
            <p className={`account-caption mt-2 ${liveConnected ? 'text-success' : 'text-muted'}`}>
              {liveConnected ? 'Live chat connected' : 'Connecting live chat...'}
            </p>
            {inquiry?.product_url && (
              <a href={inquiry.product_url} className="account-muted mt-2 inline-block underline underline-offset-4">
                View product
              </a>
            )}
          </div>
          <UnstyledButton type="button" onClick={() => void loadConversation()} className="text-muted hover:text-primary" aria-label="Refresh messages">
            <RefreshCw size={20} />
          </UnstyledButton>
        </div>

        <div className="border border-border-subtle bg-surface-paper">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-muted">
              <RefreshCw className="mr-2 animate-spin" size={20} />
              Loading conversation...
            </div>
          ) : (
            <div className="max-h-[560px] space-y-4 overflow-y-auto p-5">
              {messages.map((message) => {
                const isAdmin = message.sender_type === 'admin';
                return (
                  <div key={message.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-4/5 rounded-lg px-4 py-3 ${isAdmin ? 'bg-surface-soft text-primary' : 'bg-primary text-inverse'}`}>
                      <p className={`account-message-meta mb-1 ${isAdmin ? 'text-muted' : 'text-disabled'}`}>
                        {isAdmin ? message.sender_name || 'Odhvica Studio' : 'You'}
                      </p>
                      <p className="account-message-body whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                );
              })}
              {studioTyping && (
                <div className="flex justify-start">
                  <div className="account-muted rounded-lg bg-surface-soft px-4 py-3">
                    Studio is typing...
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={sendReply} className="border-t border-border-subtle p-5">
            <Textarea
              required
              rows={4}
              value={reply}
              onChange={(event) => handleReplyChange(event.target.value)}
              className="resize-none"
              placeholder="Write a message..."
              aria-label="Reply message"
            />
            <Button
              type="submit"
              disabled={sending || !reply.trim()}
              variant="secondary"
              size="md"
              className="mt-4"
              leadingIcon={<MessageCircle size={15} />}
            >
              {sending ? 'Sending' : 'Send Message'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
