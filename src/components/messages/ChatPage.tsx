"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Send,
  Smile,
  Trash2,
  Users,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Role = 'coach' | 'client';

interface ChatThread {
  id: string;
  coach_id: string;
  title: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
}

interface ChatMember {
  thread_id: string;
  user_id: string;
  role: Role;
}

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_user_id: string;
  text: string | null;
  message_type: string;
  parent_id: string | null;
  created_at: string;
}

interface ChatAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface ChatRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

interface ClientSummary {
  id: string;
  display_name: string;
}

interface CoachNote {
  id: string;
  notes: string | null;
}

const reactionOptions = [':+1:', ':)', ':D', ':P', '<3', 'ok'];

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

const formatFileSize = (size: number | null) => {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ChatPage({ role }: { role: Role }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [coachId, setCoachId] = useState('');
  const [coachBrandName, setCoachBrandName] = useState('Coach');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [reactions, setReactions] = useState<ChatReaction[]>([]);
  const [reads, setReads] = useState<ChatRead[]>([]);
  const [threadLastMessages, setThreadLastMessages] = useState<Record<string, ChatMessage>>({});
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerFiles, setComposerFiles] = useState<File[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [creatingThread, setCreatingThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadClientIds, setNewThreadClientIds] = useState<string[]>([]);
  const [newDirectClientId, setNewDirectClientId] = useState('');
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [note, setNote] = useState('');
  const [noteId, setNoteId] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [announcementMode, setAnnouncementMode] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const missingAttachmentsRef = useRef<Set<string>>(new Set());
  const loadingMessagesRef = useRef(false);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const threadLastMessagesRef = useRef<Record<string, ChatMessage>>({});

  const messagePageSize = 50;

  const cleanupMissingAttachment = useCallback(async (attachmentId: string) => {
    if (missingAttachmentsRef.current.has(attachmentId)) return;
    missingAttachmentsRef.current.add(attachmentId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return;
      await fetch('/api/messages/cleanup-attachment-missing', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attachmentId }),
      });
    } catch (error) {
      console.warn('Failed to cleanup missing attachment:', error);
    }
  }, []);

  const messageMap = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    messages.forEach((message) => map.set(message.id, message));
    return map;
  }, [messages]);

  useEffect(() => {
    messageIdsRef.current = new Set(messages.map((message) => message.id));
  }, [messages]);

  useEffect(() => {
    threadLastMessagesRef.current = threadLastMessages;
  }, [threadLastMessages]);

  const threadMembers = useMemo(() => {
    return members.filter((member) => member.thread_id === selectedThreadId);
  }, [members, selectedThreadId]);

  const clientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((client) => map.set(client.id, client.display_name));
    return map;
  }, [clients]);

  const loadUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId(user.id);

      if (role === 'client') {
        const { data: client } = await supabase
          .from('clients')
          .select('coach_id')
          .eq('id', user.id)
          .single();
        if (!client) throw new Error('Client not found');
        setCoachId(client.coach_id);
        const { data: branding } = await supabase
          .from('coach_branding')
          .select('brand_name')
          .eq('coach_id', client.coach_id)
          .maybeSingle();
        if (branding?.brand_name) {
          setCoachBrandName(branding.brand_name);
        }
      } else {
        setCoachId(user.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      router.push('/auth/login');
    }
  }, [role, router]);

  const loadThreads = useCallback(async () => {
    try {
      const { data: threadData, error } = await supabase
        .from('chat_threads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const list = (threadData as ChatThread[]) || [];
      setThreads(list);

      if (list.length === 0) {
        setSelectedThreadId('');
      } else {
        const hasSelected = selectedThreadId
          ? list.some((thread) => thread.id === selectedThreadId)
          : false;
        const nextSelected = hasSelected ? selectedThreadId : list[0].id;
        if (nextSelected !== selectedThreadId) {
          setSelectedThreadId(nextSelected);
        }
      }

      const threadIds = list.map((thread) => thread.id);
      if (threadIds.length > 0) {
        const { data: memberData } = await supabase
          .from('chat_members')
          .select('thread_id, user_id, role')
          .in('thread_id', threadIds);
        setMembers((memberData as ChatMember[]) || []);

        const { data: lastMessages } = await supabase
          .from('chat_messages')
          .select('id, thread_id, text, message_type, created_at, sender_user_id, parent_id')
          .in('thread_id', threadIds)
          .order('created_at', { ascending: false });

        const map: Record<string, ChatMessage> = {};
        (lastMessages as ChatMessage[] | null)?.forEach((message) => {
          if (!map[message.thread_id]) {
            map[message.thread_id] = message;
          }
        });
        setThreadLastMessages(map);
      } else {
        setMembers([]);
        setThreadLastMessages({});
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      toast.error('Impossible de charger les messages.');
    }
  }, [selectedThreadId]);

  const bootstrapClientThread = useCallback(async () => {
    if (role !== 'client') return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return;
      const response = await fetch('/api/messages/bootstrap', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) return;
      await loadThreads();
    } catch (error) {
      console.error('Error bootstrapping chat:', error);
    }
  }, [loadThreads, role]);

  const loadClients = useCallback(async () => {
    if (role !== 'coach') return;
    const { data } = await supabase
      .from('clients')
      .select('id, display_name')
      .order('display_name', { ascending: true });
    setClients((data as ClientSummary[]) || []);
  }, [role]);

  const loadMessages = useCallback(async (before?: string) => {
    if (!selectedThreadId) return;
    if (loadingMessagesRef.current) return;
    loadingMessagesRef.current = true;
    setLoadingMessages(true);
    try {
      const baseQuery = supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', selectedThreadId)
        .order('created_at', { ascending: false })
        .limit(messagePageSize);

      const query = before ? baseQuery.lt('created_at', before) : baseQuery;
      const { data: messageData, error } = await query;

      if (error) throw error;
      const list = ((messageData as ChatMessage[]) || []).reverse();
      if (before) {
        setMessages((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          const merged = [...list.filter((item) => !seen.has(item.id)), ...prev];
          return merged;
        });
      } else {
        setMessages(list);
      }
      setHasMoreMessages(list.length === messagePageSize);

      const messageIds = list.map((message) => message.id);
      if (messageIds.length > 0) {
        const [{ data: attachmentData }, { data: reactionData }, { data: readData }] =
          await Promise.all([
            supabase
              .from('chat_attachments')
              .select('*')
              .in('message_id', messageIds),
            supabase
              .from('chat_reactions')
              .select('*')
              .in('message_id', messageIds),
            supabase
              .from('chat_reads')
              .select('*')
              .in('message_id', messageIds),
          ]);

        const attachmentsList = (attachmentData as ChatAttachment[]) || [];
        const nextReactions = (reactionData as ChatReaction[]) || [];
        const nextReads = (readData as ChatRead[]) || [];

        const urlMap: Record<string, string> = {};
        const signedResults = await Promise.all(
          attachmentsList.map(async (attachment) => {
            if (missingAttachmentsRef.current.has(attachment.id)) return null;
            try {
              const { data: signed, error } = await supabase.storage
                .from('chat-attachments')
                .createSignedUrl(attachment.file_path, 3600);
              if (signed?.signedUrl) {
                urlMap[attachment.id] = signed.signedUrl;
                return attachment;
              }
              if (error || !signed?.signedUrl) {
                await cleanupMissingAttachment(attachment.id);
                return null;
              }
            } catch (err) {
              await cleanupMissingAttachment(attachment.id);
              console.warn('Failed to sign attachment URL:', err);
            }
            return null;
          })
        );
        const validAttachments = signedResults.filter(
          (item): item is ChatAttachment => Boolean(item)
        );
        if (before) {
          setAttachments((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            return [...validAttachments.filter((item) => !seen.has(item.id)), ...prev];
          });
          setAttachmentUrls((prev) => ({ ...urlMap, ...prev }));
          setReactions((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            return [...nextReactions.filter((item) => !seen.has(item.id)), ...prev];
          });
          setReads((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            return [...nextReads.filter((item) => !seen.has(item.id)), ...prev];
          });
        } else {
          setAttachments(validAttachments);
          setAttachmentUrls(urlMap);
          setReactions(nextReactions);
          setReads(nextReads);
        }
      } else {
        if (!before) {
          setAttachments([]);
          setReactions([]);
          setReads([]);
          setAttachmentUrls({});
        }
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      loadingMessagesRef.current = false;
      setLoadingMessages(false);
    }
  }, [cleanupMissingAttachment, selectedThreadId]);

  const markRead = useCallback(async () => {
    if (!userId || messages.length === 0) return;
    const readSet = new Set(
      reads
        .filter((read) => read.user_id === userId)
        .map((read) => read.message_id)
    );
    const unread = messages.filter(
      (message) =>
        message.sender_user_id !== userId && !readSet.has(message.id)
    );
    if (unread.length === 0) return;
    const payload = unread.map((message) => ({
      message_id: message.id,
      user_id: userId,
    }));
    const { error } = await supabase
      .from('chat_reads')
      .upsert(payload, { onConflict: 'message_id,user_id' });
    if (error) {
      console.warn('Failed to mark reads:', error);
    }
  }, [messages, reads, userId]);

  const loadNote = useCallback(async () => {
    if (role !== 'coach' || !selectedThreadId) return;
    const activeThread = threads.find((thread) => thread.id === selectedThreadId);
    if (activeThread?.is_group) return;
    const clientMember = threadMembers.find((member) => member.role === 'client');
    if (!clientMember) return;
    const { data } = await supabase
      .from('coach_notes')
      .select('id, notes')
      .eq('client_id', clientMember.user_id)
      .eq('coach_id', coachId)
      .maybeSingle();
    if (data) {
      setNoteId((data as CoachNote).id);
      setNote((data as CoachNote).notes || '');
    } else {
      setNoteId('');
      setNote('');
    }
  }, [coachId, role, selectedThreadId, threadMembers, threads]);

  useEffect(() => {
    loadUser().then(() => {
      loadClients();
    });
  }, [loadClients, loadUser]);

  useEffect(() => {
    loadThreads().finally(() => setLoading(false));
  }, [loadThreads]);

  useEffect(() => {
    if (!loading && role === 'client' && threads.length === 0) {
      bootstrapClientThread();
    }
  }, [bootstrapClientThread, loading, role, threads.length]);

  useEffect(() => {
    if (!selectedThreadId) return;
    loadMessages();
  }, [loadMessages, selectedThreadId]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  useEffect(() => {
    if (!selectedThreadId || !userId) return;
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
    }

    const channel = supabase.channel(`thread:${selectedThreadId}`);
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${selectedThreadId}`,
        },
        (payload) => {
          const nextMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, nextMessage]);
          setThreadLastMessages((prev) => ({
            ...prev,
            [nextMessage.thread_id]: nextMessage,
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${selectedThreadId}`,
        },
        (payload) => {
          const deleted = payload.old as ChatMessage;
          setMessages((prev) => prev.filter((item) => item.id !== deleted.id));
          setAttachments((prev) => {
            const removed = prev.filter((item) => item.message_id === deleted.id);
            if (removed.length > 0) {
              setAttachmentUrls((prevUrls) => {
                const next = { ...prevUrls };
                removed.forEach((item) => delete next[item.id]);
                return next;
              });
            }
            return prev.filter((item) => item.message_id !== deleted.id);
          });
          setReactions((prev) =>
            prev.filter((item) => item.message_id !== deleted.id)
          );
          setReads((prev) => prev.filter((item) => item.message_id !== deleted.id));
          if (
            threadLastMessagesRef.current[deleted.thread_id]?.id === deleted.id
          ) {
            loadThreads();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_reactions' },
        (payload) => {
          const reaction = payload.new as ChatReaction;
          if (messageIdsRef.current.has(reaction.message_id)) {
            setReactions((prev) => [...prev, reaction]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_attachments' },
        async (payload) => {
          const attachment = payload.new as ChatAttachment;
          if (messageIdsRef.current.has(attachment.message_id)) {
            try {
              if (missingAttachmentsRef.current.has(attachment.id)) return;
              const { data: signed, error } = await supabase.storage
                .from('chat-attachments')
                .createSignedUrl(attachment.file_path, 3600);
              if (signed?.signedUrl) {
                setAttachments((prev) => [...prev, attachment]);
                setAttachmentUrls((prev) => ({
                  ...prev,
                  [attachment.id]: signed.signedUrl,
                }));
              } else if (error || !signed?.signedUrl) {
                await cleanupMissingAttachment(attachment.id);
              }
            } catch (err) {
              await cleanupMissingAttachment(attachment.id);
              console.warn('Failed to sign attachment URL:', err);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_attachments' },
        (payload) => {
          const deleted = payload.old as ChatAttachment;
          missingAttachmentsRef.current.delete(deleted.id);
          setAttachments((prev) => prev.filter((item) => item.id !== deleted.id));
          setAttachmentUrls((prev) => {
            const next = { ...prev };
            delete next[deleted.id];
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_reads' },
        (payload) => {
          const read = payload.new as ChatRead;
          if (messageIdsRef.current.has(read.message_id)) {
            setReads((prev) => [...prev, read]);
          }
        }
      )
      .subscribe();

    realtimeRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cleanupMissingAttachment, loadThreads, selectedThreadId, userId]);

  useEffect(() => {
    if (!selectedThreadId || !userId) return;
    if (presenceRef.current) {
      supabase.removeChannel(presenceRef.current);
    }

    const presence = supabase.channel(`presence:${selectedThreadId}`, {
      config: { presence: { key: userId } },
    });

    presence.on('presence', { event: 'sync' }, () => {
      const state = presence.presenceState();
      setOnlineCount(Object.keys(state).length);
    });

    presence.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presence.track({ online_at: new Date().toISOString() });
      }
    });

    presenceRef.current = presence;

    return () => {
      supabase.removeChannel(presence);
    };
  }, [selectedThreadId, userId]);

  const handleCreateGroup = async () => {
    if (!coachId || !userId) {
      toast.error('Session invalide.');
      return;
    }
    if (!newThreadTitle.trim() || newThreadClientIds.length === 0) {
      toast.error('Ajoute un nom et des clients.');
      return;
    }
    setCreatingThread(true);
    try {
      const { data: thread, error } = await supabase
        .from('chat_threads')
        .insert({
          coach_id: coachId,
          title: newThreadTitle.trim(),
          is_group: true,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      const threadId = (thread as ChatThread).id;
      const memberRows: ChatMember[] = [
        { thread_id: threadId, user_id: userId, role: 'coach' },
        ...newThreadClientIds.map(
          (clientId): ChatMember => ({
            thread_id: threadId,
            user_id: clientId,
            role: 'client',
          })
        ),
      ];
      const { error: memberError } = await supabase
        .from('chat_members')
        .insert(memberRows);
      if (memberError) throw memberError;

      setMembers((prev) => [...prev, ...memberRows]);
      setNewThreadTitle('');
      setNewThreadClientIds([]);
      setThreads((prev) => [thread as ChatThread, ...prev]);
      setSelectedThreadId(threadId);
      toast.success('Groupe cree.');
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Impossible de creer le groupe.');
    } finally {
      setCreatingThread(false);
    }
  };

  const handleCreateDirect = async () => {
    if (!coachId || !userId) {
      toast.error('Session invalide.');
      return;
    }
    if (!newDirectClientId) {
      toast.error('Choisis un client.');
      return;
    }
    setCreatingThread(true);
    try {
      const existingThread = threads.find((thread) => {
        if (thread.is_group) return false;
        const threadMembersList = members.filter(
          (member) => member.thread_id === thread.id
        );
        const hasClient = threadMembersList.some(
          (member) =>
            member.user_id === newDirectClientId && member.role === 'client'
        );
        const hasCoach = threadMembersList.some(
          (member) =>
            member.user_id === userId && member.role === 'coach'
        );
        return hasClient && hasCoach;
      });

      if (existingThread) {
        setSelectedThreadId(existingThread.id);
        toast.message('Conversation deja existante.');
        setNewDirectClientId('');
        return;
      }

      const clientName = clientNameMap.get(newDirectClientId) || 'Client';
      const { data: thread, error } = await supabase
        .from('chat_threads')
        .insert({
          coach_id: coachId,
          title: clientName,
          is_group: false,
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw error;
      const threadId = (thread as ChatThread).id;
      const directMembers: ChatMember[] = [
        { thread_id: threadId, user_id: userId, role: 'coach' },
        { thread_id: threadId, user_id: newDirectClientId, role: 'client' },
      ];
      const { error: memberError } = await supabase
        .from('chat_members')
        .insert(directMembers);
      if (memberError) throw memberError;
      setMembers((prev) => [...prev, ...directMembers]);
      setNewDirectClientId('');
      setThreads((prev) => [thread as ChatThread, ...prev]);
      setSelectedThreadId(threadId);
      toast.success('Conversation creee.');
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Impossible de creer la conversation.');
    } finally {
      setCreatingThread(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!selectedThreadId) return;
    if (!activeThread) return;
    if (!window.confirm('Supprimer cette conversation ?')) return;
    try {
      const { error } = await supabase
        .from('chat_threads')
        .delete()
        .eq('id', activeThread.id);
      if (error) throw error;

      const nextThreads = threads.filter((thread) => thread.id !== activeThread.id);
      setThreads(nextThreads);
      setMembers((prev) =>
        prev.filter((member) => member.thread_id !== activeThread.id)
      );
      setThreadLastMessages((prev) => {
        const next = { ...prev };
        delete next[activeThread.id];
        return next;
      });
      setSelectedThreadId(nextThreads[0]?.id || '');
      setMessages([]);
      setAttachments([]);
      setReactions([]);
      setReads([]);
      setAttachmentUrls({});
      toast.success('Conversation supprimee.');
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Impossible de supprimer la conversation.');
    }
  };

  const handleLeaveThread = async () => {
    if (!selectedThreadId) return;
    if (!window.confirm('Quitter cette conversation ?')) return;
    try {
      const { error } = await supabase
        .from('chat_members')
        .delete()
        .eq('thread_id', selectedThreadId)
        .eq('user_id', userId);
      if (error) throw error;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
        await fetch('/api/messages/cleanup-thread', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ threadId: selectedThreadId }),
        });
      }
      setSelectedThreadId('');
      await loadThreads();
      toast.success('Conversation quittee.');
    } catch (error) {
      console.error('Error leaving thread:', error);
      toast.error('Impossible de quitter la conversation.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Missing session');

      const response = await fetch('/api/messages/delete-message', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Delete failed');
      }

      const payload = (await response.json().catch(() => ({}))) as {
        deletedAttachmentIds?: string[];
      };
      if (payload.deletedAttachmentIds?.length) {
        setAttachments((prev) =>
          prev.filter((item) => !payload.deletedAttachmentIds?.includes(item.id))
        );
        setAttachmentUrls((prev) => {
          const next = { ...prev };
          payload.deletedAttachmentIds?.forEach((id) => delete next[id]);
          return next;
        });
      }

      await loadMessages();
      await loadThreads();
      toast.success('Message supprime.');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Impossible de supprimer le message.');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm('Supprimer ce fichier ?')) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Missing session');

      const response = await fetch('/api/messages/delete-attachment', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attachmentId }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Delete failed');
      }

      setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
      setAttachmentUrls((prev) => {
        const next = { ...prev };
        delete next[attachmentId];
        return next;
      });
      toast.success('Fichier supprime.');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Impossible de supprimer le fichier.');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThreadId) return;
    if (!userId) {
      toast.error('Session invalide.');
      return;
    }
    if (!composerText.trim() && composerFiles.length === 0) {
      toast.error('Ecris un message ou ajoute un fichier.');
      return;
    }
    setSending(true);
    try {
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: selectedThreadId,
          sender_user_id: userId,
          text: composerText.trim() || null,
          message_type: announcementMode ? 'announcement' : 'text',
          parent_id: replyTo?.id || null,
        })
        .select()
        .single();
      if (error) throw error;

      const newMessage = message as ChatMessage;
      const messageId = newMessage.id;

      // Optimistic update: ajouter le message immediatement a l'etat local
      setMessages((prev) => [...prev, newMessage]);

      if (composerFiles.length > 0) {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          throw new Error('Missing session');
        }

        for (const file of composerFiles) {
          const formData = new FormData();
          formData.append('threadId', selectedThreadId);
          formData.append('messageId', messageId);
          formData.append('file', file);

          const response = await fetch('/api/storage/chat-attachments', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Upload failed');
          }

          const { path } = (await response.json()) as { path: string };

          const { error: attachError } = await supabase
            .from('chat_attachments')
            .insert({
              message_id: messageId,
              file_name: file.name,
              file_path: path || `${selectedThreadId}/${messageId}/${file.name}`,
              file_type: file.type,
              file_size: file.size,
            });
          if (attachError) throw attachError;
        }
      }

      setComposerText('');
      setComposerFiles([]);
      setReplyTo(null);
      setAnnouncementMode(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Impossible d envoyer le message.');
    } finally {
      setSending(false);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      const existing = reactions.find(
        (reaction) =>
          reaction.message_id === messageId &&
          reaction.user_id === userId &&
          reaction.emoji === emoji
      );
      if (existing) {
        const { error } = await supabase
          .from('chat_reactions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        setReactions((prev) => prev.filter((item) => item.id !== existing.id));
        return;
      }
      const { data, error } = await supabase
        .from('chat_reactions')
        .insert({ message_id: messageId, user_id: userId, emoji })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setReactions((prev) => [...prev, data as ChatReaction]);
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Impossible de mettre a jour la reaction.');
    }
  };

  const handleSaveNote = async () => {
    if (role !== 'coach') return;
    const clientMember = threadMembers.find((member) => member.role === 'client');
    if (!clientMember) return;
    setNoteSaving(true);
    try {
      const payload = {
        coach_id: coachId,
        client_id: clientMember.user_id,
        notes: note.trim() || null,
      };
      if (noteId) {
        await supabase.from('coach_notes').update(payload).eq('id', noteId);
      } else {
        const { data } = await supabase
          .from('coach_notes')
          .insert(payload)
          .select()
          .single();
        if (data) setNoteId((data as CoachNote).id);
      }
      toast.success('Notes mises a jour.');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Impossible de sauvegarder.');
    } finally {
      setNoteSaving(false);
    }
  };

  const renderSenderName = (message: ChatMessage) => {
    if (message.sender_user_id === userId) return 'Moi';
    const member = threadMembers.find(
      (item) => item.user_id === message.sender_user_id
    );
    if (!member) return 'Membre';
    if (member.role === 'coach') return 'Coach';
    return clientNameMap.get(member.user_id) || 'Client';
  };

  const getThreadTitle = (thread: ChatThread) => {
    if (thread.is_group) return thread.title;
    if (role === 'coach') {
      const member = members.find(
        (item) => item.thread_id === thread.id && item.role === 'client'
      );
      if (member) {
        return clientNameMap.get(member.user_id) || thread.title;
      }
    }
    if (role === 'client') {
      return coachBrandName || thread.title;
    }
    return thread.title;
  };

  const threadList = useMemo(() => {
    return threads.map((thread) => ({
      ...thread,
      lastMessage: threadLastMessages[thread.id],
    }));
  }, [threadLastMessages, threads]);

  const activeThread = threads.find((thread) => thread.id === selectedThreadId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-text-secondary mt-1">
              Discussions, groupes, et suivi rapide
            </p>
          </div>
          <Badge variant="info">En ligne: {onlineCount}</Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <Card className="border border-border/60 bg-background-surface/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Conversations</h2>
              {role === 'coach' && (
                <Badge variant="info">{threads.length}</Badge>
              )}
            </div>

            {role === 'coach' && (
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs text-text-tertiary mb-2">Nouveau chat</p>
                  <div className="flex gap-2">
                    <select
                      className="input"
                      value={newDirectClientId}
                      onChange={(event) => setNewDirectClientId(event.target.value)}
                    >
                      <option value="">Choisir un client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.display_name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="secondary"
                      onClick={handleCreateDirect}
                      loading={creatingThread}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-text-tertiary mb-2">Nouveau groupe</p>
                  <Input
                    placeholder="Nom du groupe"
                    value={newThreadTitle}
                    onChange={(event) => setNewThreadTitle(event.target.value)}
                  />
                  <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-2">
                    {clients.map((client) => (
                      <label
                        key={client.id}
                        className="flex items-center gap-2 text-sm text-text-secondary"
                      >
                        <input
                          type="checkbox"
                          checked={newThreadClientIds.includes(client.id)}
                          onChange={(event) => {
                            setNewThreadClientIds((prev) =>
                              event.target.checked
                                ? [...prev, client.id]
                                : prev.filter((id) => id !== client.id)
                            );
                          }}
                        />
                        {client.display_name}
                      </label>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-3"
                    onClick={handleCreateGroup}
                    loading={creatingThread}
                  >
                    <Users className="w-4 h-4" />
                    Creer le groupe
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {threadList.length === 0 ? (
                <p className="text-sm text-text-tertiary">
                  Aucune conversation pour l instant.
                </p>
              ) : (
                threadList.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left rounded-lg border px-3 py-3 transition-all ${
                      selectedThreadId === thread.id
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-border bg-background-elevated/50 hover:bg-background-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm">
                        {getThreadTitle(thread)}
                      </p>
                      {thread.is_group && <Badge variant="info">Groupe</Badge>}
                    </div>
                    {thread.lastMessage && (
                      <p className="text-xs text-text-tertiary mt-1 line-clamp-2">
                        {thread.lastMessage.text || 'Fichier joint'}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="border border-border/60 bg-background-surface/80">
            {selectedThreadId ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {activeThread ? getThreadTitle(activeThread) : 'Conversation'}
                    </h2>
                    <p className="text-xs text-text-tertiary">
                      {threadMembers.length} membre(s)
                    </p>
                  </div>
                  {role === 'coach' && (
                    <div className="flex items-center gap-2">
                      <Badge variant={announcementMode ? 'warning' : 'default'}>
                        {announcementMode ? 'Annonce' : 'Message'}
                      </Badge>
                      <Button
                        variant="secondary"
                        onClick={handleDeleteThread}
                        disabled={!activeThread}
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </Button>
                    </div>
                  )}
                  {role === 'client' && (
                    <Button
                      variant="secondary"
                      onClick={handleLeaveThread}
                      disabled={!activeThread}
                    >
                      <Trash2 className="w-4 h-4" />
                      Quitter
                    </Button>
                  )}
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[520px]">
                  {hasMoreMessages && (
                    <div className="flex justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const oldest = messages[0]?.created_at;
                          if (oldest) {
                            loadMessages(oldest);
                          }
                        }}
                        loading={loadingMessages}
                      >
                        Charger plus
                      </Button>
                    </div>
                  )}
                  {messages.length === 0 ? (
                    <p className="text-sm text-text-tertiary">
                      Aucun message pour l instant.
                    </p>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.sender_user_id === userId;
                      const messageReactions = reactions.filter(
                        (reaction) => reaction.message_id === message.id
                      );
                      const groupedReactions = messageReactions.reduce<
                        Record<string, number>
                      >((acc, reaction) => {
                        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                        return acc;
                      }, {});
                      const messageAttachments = attachments.filter(
                        (attachment) => attachment.message_id === message.id
                      );
                      const readCount = reads.filter(
                        (read) => read.message_id === message.id
                      ).length;
                      const parent = message.parent_id
                        ? messageMap.get(message.parent_id)
                        : null;

                      return (
                        <div
                          key={message.id}
                          className={`rounded-lg p-4 border ${
                            isMine
                              ? 'border-primary/40 bg-primary/10 ml-8'
                              : 'border-border bg-background-elevated/60'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs text-text-tertiary mb-2">
                            <span>{renderSenderName(message)}</span>
                            <div className="flex items-center gap-2">
                              <span>{formatTimestamp(message.created_at)}</span>
                              {isMine && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="text-text-tertiary hover:text-red-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {parent && (
                            <div className="text-xs text-text-tertiary border-l-2 border-border pl-2 mb-2">
                              Reponse a: {parent.text || 'Message'}
                            </div>
                          )}

                          {message.message_type === 'announcement' && (
                            <Badge variant="warning">Annonce</Badge>
                          )}
                          {message.message_type === 'system' && (
                            <Badge variant="info">Plan</Badge>
                          )}

                          {message.text && (
                            <p className="text-sm text-text-secondary mt-2 whitespace-pre-line">
                              {message.text}
                            </p>
                          )}

                          {messageAttachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {messageAttachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-3 p-2 rounded-lg bg-background-surface border border-border/60 text-sm"
                                >
                                  <a
                                    href={attachmentUrls[attachment.id]}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 flex-1"
                                  >
                                  {attachment.file_type?.startsWith('image') ? (
                                    <ImageIcon className="w-4 h-4 text-primary" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-primary" />
                                  )}
                                    <span className="font-medium">
                                      {attachment.file_name}
                                    </span>
                                    <span className="text-xs text-text-tertiary ml-auto">
                                      {formatFileSize(attachment.file_size)}
                                    </span>
                                  </a>
                                  {isMine && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAttachment(attachment.id)}
                                      className="text-text-tertiary hover:text-red-400"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mt-3">
                            {Object.entries(groupedReactions).map(
                              ([emoji, count]) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => toggleReaction(message.id, emoji)}
                                  className="text-xs border border-border rounded-full px-2 py-1"
                                >
                                  {emoji} {count}
                                </button>
                              )
                            )}
                            <div className="flex gap-1">
                              {reactionOptions.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => toggleReaction(message.id, emoji)}
                                  className="text-xs border border-border rounded-full px-2 py-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 text-xs text-text-tertiary">
                            <button
                              type="button"
                              onClick={() => setReplyTo(message)}
                              className="text-primary hover:underline"
                            >
                              Repondre
                            </button>
                            {isMine && readCount > 0 && (
                              <span>Vu</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {replyTo && (
                  <div className="mt-4 p-3 rounded-lg bg-background-elevated border border-border">
                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <span>Reponse a {renderSenderName(replyTo)}</span>
                      <button
                        type="button"
                        onClick={() => setReplyTo(null)}
                        className="text-primary"
                      >
                        Annuler
                      </button>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">
                      {replyTo.text || 'Message'}
                    </p>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {role === 'coach' && (
                    <label className="flex items-center gap-2 text-xs text-text-tertiary">
                      <input
                        type="checkbox"
                        checked={announcementMode}
                        onChange={(event) =>
                          setAnnouncementMode(event.target.checked)
                        }
                      />
                      Envoyer comme annonce
                    </label>
                  )}

                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex-1">
                      <Input
                        placeholder="Ton message..."
                        value={composerText}
                        onChange={(event) => setComposerText(event.target.value)}
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-text-tertiary cursor-pointer">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          const files = Array.from(event.target.files || []);
                          setComposerFiles(files);
                        }}
                      />
                      <Paperclip className="w-4 h-4" />
                      Fichiers
                    </label>
                    <Button
                      variant="primary"
                      onClick={handleSendMessage}
                      loading={sending}
                    >
                      <Send className="w-4 h-4" />
                      Envoyer
                    </Button>
                  </div>
                  {composerFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-text-tertiary">
                      {composerFiles.map((file) => (
                        <span key={file.name} className="px-2 py-1 rounded-full bg-background-elevated/60">
                          {file.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Smile className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary">Choisis une conversation.</p>
              </div>
            )}
          </Card>
        </div>

        {role === 'coach' &&
          selectedThreadId &&
          !activeThread?.is_group && (
          <Card className="border border-border/60 bg-background-surface/80 mt-6">
            <h3 className="text-lg font-semibold mb-3">Notes privees coach</h3>
            <textarea
              className="input min-h-[120px]"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Notes internes sur ce client..."
            />
            <div className="mt-3">
              <Button
                variant="secondary"
                onClick={handleSaveNote}
                loading={noteSaving}
              >
                Sauvegarder
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
