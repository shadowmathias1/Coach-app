'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import CoachLayout from '@/components/layout/CoachLayout';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/components/shared/LanguageProvider';

interface Client {
  id: string;
  display_name: string;
  joined_at: string;
  last_activity_at: string | null;
}

export default function ClientsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const t = language === 'fr'
    ? {
        title: 'Clients',
        subtitle: 'Gere tes clients',
        searchPlaceholder: 'Rechercher un client...',
        active: 'Actif',
        never: 'Jamais',
        joined: 'Inscrit le',
        deleteTitle: 'Supprimer',
        deleteConfirm: (name: string) =>
          `Supprimer ${name} ? Les donnees du client seront perdues.`,
        deleteConfirm2: 'Action definitive. Continuer ?',
        deleteSuccess: 'Client supprime',
        deleteFail: 'Impossible de supprimer le client',
        loadFail: 'Impossible de charger les clients',
        noneFound: 'Aucun client trouve',
        noneYet: 'Aucun client pour le moment',
        tryAnother: 'Essaie un autre terme',
        inviteBody: 'Invite des clients pour demarrer',
        getInvite: 'Obtenir le code',
        createProgram: 'Creer un programme',
      }
    : {
        title: 'Clients',
        subtitle: 'Manage your clients',
        searchPlaceholder: 'Search clients by name...',
        active: 'Active',
        never: 'Never',
        joined: 'Joined',
        deleteTitle: 'Delete',
        deleteConfirm: (name: string) =>
          `Delete ${name}? This will remove the client and their data.`,
        deleteConfirm2: 'This is permanent and cannot be undone. Continue?',
        deleteSuccess: 'Client deleted',
        deleteFail: 'Failed to delete client',
        loadFail: 'Failed to load clients',
        noneFound: 'No clients found',
        noneYet: 'No clients yet',
        tryAnother: 'Try a different search term',
        inviteBody: 'Invite clients to get started',
        getInvite: 'Get invite code',
        createProgram: 'Create program',
      };

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  const loadClients = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('coach_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setClients((data as Client[]) || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error(t.loadFail);
    } finally {
      setLoading(false);
    }
  }, [router, t.loadFail]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients = clients.filter((client) =>
    client.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteClient = async (client: Client) => {
    const firstConfirm = confirm(t.deleteConfirm(client.display_name));
    if (!firstConfirm) return;

    const secondConfirm = confirm(t.deleteConfirm2);
    if (!secondConfirm) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;

      setClients((prev) => prev.filter((item) => item.id !== client.id));
      toast.success(t.deleteSuccess);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error(t.deleteFail);
    }
  };

  if (loading) {
    return (
      <CoachLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="min-h-screen bg-background">
        <header className="bg-background-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-text-secondary mt-1">
                  {t.subtitle} ({clients.length})
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6">
            <Input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="group cursor-pointer relative overflow-hidden   transition-all duration-300"
                  onClick={() => router.push(`/coach/clients/${client.id}`)}
                >
                  <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary/10 flex items-center justify-center group-hover:shadow-glow-sm transition-shadow duration-300">
                        <span className="text-xl font-bold text-gradient">
                          {client.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={client.last_activity_at ? 'success' : 'default'}>
                          {client.last_activity_at ? t.active : t.never}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteClient(client);
                          }}
                          aria-label={`${t.deleteTitle} ${client.display_name}`}
                        >
                          <Trash2 className="w-4 h-4 text-danger" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-gradient transition-all duration-300">
                      {client.display_name}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {t.joined} {new Date(client.joined_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary mb-2">
                  {searchQuery ? t.noneFound : t.noneYet}
                </p>
                <p className="text-sm text-text-tertiary">
                  {searchQuery ? t.tryAnother : t.inviteBody}
                </p>
                {!searchQuery && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => router.push('/coach/dashboard')}
                    >
                      {t.getInvite}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => router.push('/coach/programs')}
                    >
                      {t.createProgram}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </main>
      </div>
    </CoachLayout>
  );
}
