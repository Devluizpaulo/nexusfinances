'use client';

import { PageHeader } from '@/components/page-header';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, orderBy, query, doc, deleteDoc } from 'firebase/firestore';
import type { EducationTrack } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminEducationPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [trackToDelete, setTrackToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tracksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'education'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: tracks, isLoading } = useCollection<EducationTrack>(tracksQuery);

  const handleDelete = async () => {
    if (!firestore || !trackToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'education', trackToDelete));
      toast({
        title: '🎉 Trilha Excluída!',
        description: 'A trilha foi removida do sistema com sucesso.',
      });
    } catch (err) {
      console.error('Error deleting track:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a trilha educacional.',
      });
    } finally {
      setIsDeleting(false);
      setTrackToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trilhas de Educação"
        description="Gerencie o conteúdo da Jornada Financeira."
      />

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {isLoading
            ? 'Carregando trilhas...'
            : `${tracks?.length ?? 0} trilha(s) cadastrada(s)`}
        </div>
        <Button asChild>
          <Link href="/admin/education/new">Nova trilha</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trilhas cadastradas</CardTitle>
          <CardDescription>
            Conteúdo lido pelas páginas de usuário em <code>/education</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && (!tracks || tracks.length === 0) && (
            <p className="text-sm text-muted-foreground">
              Nenhuma trilha cadastrada ainda. Clique em &quot;Nova trilha&quot; para criar a primeira.
            </p>
          )}

          {!isLoading && tracks && tracks.length > 0 && (
            <div className="space-y-2">
              {tracks.map((track) => (
                <Card key={track.slug} className="border-muted-foreground/20">
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{track.title}</span>
                        <Badge variant="outline" className="text-xs">{track.slug}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-xl">
                        {track.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        Ordem: {track.order ?? 0}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                          <Link href={`/admin/education/${track.slug}`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setTrackToDelete(track.slug)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!trackToDelete} onOpenChange={(open) => !open && setTrackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a trilha educacional
              e todo o seu conteúdo do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Excluir Trilha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
