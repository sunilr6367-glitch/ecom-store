'use client';


import { Heading } from '@/design-system';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useStudioChatSocket } from '@/hooks/useStudioChatSocket';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/design-system';
import { cardClasses } from '@/design-system';
import { ButtonLink } from '@/design-system';
import { EmptyState } from '@/design-system';
import { StatusBanner } from '@/design-system';

interface StudioInquirySummary {
  id: string;
  product_title: string;
  product_handle: string | null;
  inquiry_type: string;
  status: string;
  last_message_at: string | null;
  unread_by_customer: boolean | null;
  created_at: string;
}

export default function AccountMessagesPage() {
  const { customer, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<StudioInquirySummary[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    if (!loading && !customer) router.push('/login?redirect=/account/messages');
  }, [customer, loading, router]);

  useEffect(() => {
    if (loading || !customer) return;
    api
      .getCustomerStudioInquiries()
      .then((data) => setMessages(data.inquiries || []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [customer, loading]);

  const mergeMessageSummary = useCallback((incoming: StudioInquirySummary) => {
    setMessages((prev) => {
      const exists = prev.some((item) => item.id === incoming.id);
      const next = exists
        ? prev.map((item) => (item.id === incoming.id ? { ...item, ...incoming } : item))
        : [incoming, ...prev];
      return next.sort((a, b) =>
        new Date(b.last_message_at || b.created_at).getTime() -
        new Date(a.last_message_at || a.created_at).getTime()
      );
    });
  }, []);

  const live = useStudioChatSocket({
    authMode: 'account-inbox',
    enabled: Boolean(customer && !loading),
    onMessage: ({ inquiry }) => {
      if (inquiry && typeof inquiry === 'object' && 'id' in inquiry) {
        mergeMessageSummary(inquiry as StudioInquirySummary);
      }
    },
  });

  if (loading || !customer) {
    return <div className="kv-page-gutter min-h-screen bg-parchment px-6 py-12 md:px-12 lg:px-20" />;
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="ds-page-container mx-auto max-w-page py-token-xl md:py-token-2xl lg:py-token-3xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link href="/account" className="account-muted hover:text-primary">
              Account
            </Link>
            <Heading role="page" className="account-page-title mt-2">Messages</Heading>
            <p className="account-muted mt-2">Your product conversations with Odhvica Studio.</p>
            <StatusBanner
              tone={live.isConnected ? 'success' : 'info'}
              className="mt-4 max-w-sm px-3 py-2 text-body-xs"
            >
              {live.isConnected ? 'Live inbox connected' : 'Live inbox connecting...'}
            </StatusBanner>
          </div>
          <MessageCircle className="text-disabled" size={34} />
        </div>

        {loadingMessages ? (
          <div className="flex h-48 items-center justify-center text-muted">
            <RefreshCw className="mr-2 animate-spin" size={20} />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={44} />}
            title="No messages yet"
            description="Ask a question from any product page to start a studio chat."
            actions={
            <ButtonLink href="/products" variant="secondary" size="md">
              Browse Products
            </ButtonLink>
            }
          />
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <Link
                key={message.id}
                href={`/account/messages/${message.id}`}
                className={cn(
                  cardClasses,
                  'block p-5 transition hover:border-border'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="account-name">{message.product_title}</h2>
                      {message.unread_by_customer && (
                        <Badge variant="accent">New reply</Badge>
                      )}
                    </div>
                    <p className="account-muted mt-1 capitalize">{message.inquiry_type.replace('_', ' ')}</p>
                  </div>
                  <div className="account-caption text-right">
                    <p className="capitalize">{message.status.replace('_', ' ')}</p>
                    <p className="mt-1">{new Date(message.last_message_at || message.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
