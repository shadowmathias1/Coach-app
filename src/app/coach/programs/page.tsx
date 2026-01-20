'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Copy } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CoachLayout from '@/components/layout/CoachLayout';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/components/shared/LanguageProvider';

interface Program {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export default function ProgramsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');

  const t = language === 'fr'
    ? {
        title: 'Programmes',
        subtitle: 'Cree et gere tes programmes',
        newProgram: 'Nouveau programme',
        edit: 'Modifier',
        createProgram: 'Creer un programme',
        noPrograms: 'Aucun programme',
        createFirst: 'Cree ton premier programme',
        create: 'Creer',
        cancel: 'Annuler',
        name: 'Nom du programme',
        description: 'Description (optionnel)',
        descriptionPlaceholder: 'Decris ce programme',
        deleteConfirm: 'Supprimer ce programme ?',
        deleteSuccess: 'Programme supprime',
        deleteFail: 'Impossible de supprimer le programme',
        loadFail: 'Impossible de charger les programmes',
        createSuccess: 'Programme cree !',
        createFail: 'Impossible de creer le programme',
      }
    : {
        title: 'Programs',
        subtitle: 'Create and manage training programs',
        newProgram: 'New program',
        edit: 'Edit',
        createProgram: 'Create program',
        noPrograms: 'No programs yet',
        createFirst: 'Create your first training program',
        create: 'Create',
        cancel: 'Cancel',
        name: 'Program name',
        description: 'Description (optional)',
        descriptionPlaceholder: 'What is this program about?',
        deleteConfirm: 'Delete this program? This cannot be undone.',
        deleteSuccess: 'Program deleted',
        deleteFail: 'Failed to delete program',
        loadFail: 'Failed to load programs',
        createSuccess: 'Program created!',
        createFail: 'Failed to create program',
      };

  const loadPrograms = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms((data as Program[]) || []);
    } catch (error) {
      console.error('Error loading programs:', error);
      toast.error(t.loadFail);
    } finally {
      setLoading(false);
    }
  }, [router, t.loadFail]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const createProgram = async () => {
    try {
      if (!newProgramName.trim()) {
        toast.error(t.name);
        return;
      }

      const user = await getCurrentUser();
      if (!user) return;

      const { error } = await supabase
        .from('programs')
        .insert({
          coach_id: user.id,
          title: newProgramName,
          description: newProgramDescription || null,
        });

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      toast.success(t.createSuccess);
      setShowCreateModal(false);
      setNewProgramName('');
      setNewProgramDescription('');
      loadPrograms();
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error(t.createFail);
    }
  };

  const deleteProgram = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(t.deleteSuccess);
      loadPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{t.title}</h1>
                <p className="text-text-secondary mt-1">{t.subtitle}</p>
              </div>
              <Button
                variant="primary"
                className="w-full sm:w-auto"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4" />
                {t.newProgram}
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <Card
                  key={program.id}
                  className="group cursor-pointer relative overflow-hidden   transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-gradient transition-all duration-300">
                          {program.title}
                        </h3>
                        {program.description && (
                          <p className="text-sm text-text-secondary line-clamp-2">
                            {program.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => router.push(`/coach/programs/${program.id}`)}
                      >
                        {t.edit}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProgram(program.id)}
                      >
                        <Trash2 className="w-4 h-4 text-danger" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <Copy className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary mb-2">{t.noPrograms}</p>
                <p className="text-sm text-text-tertiary mb-4">
                  {t.createFirst}
                </p>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4" />
                  {t.createProgram}
                </Button>
              </div>
            </Card>
          )}
        </main>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">{t.createProgram}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">
                    {t.name}
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Beginner Strength"
                    value={newProgramName}
                    onChange={(e) => setNewProgramName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">
                    {t.description}
                  </label>
                  <textarea
                    placeholder={t.descriptionPlaceholder}
                    value={newProgramDescription}
                    onChange={(e) => setNewProgramDescription(e.target.value)}
                    className="w-full bg-background-elevated/50 backdrop-blur-md border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-tertiary min-h-[100px] resize-none focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background-elevated transition-all duration-200"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewProgramName('');
                      setNewProgramDescription('');
                    }}
                  >
                    {t.cancel}
                  </Button>
                  <Button variant="primary" fullWidth onClick={createProgram}>
                    <Save className="w-4 h-4" />
                    {t.create}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </CoachLayout>
  );
}
