'use client';

import { PageHeader } from '@/components/page-header';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, orderBy, query } from 'firebase/firestore';
import type { EducationTrack } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function AdminEducationPage() {
  const firestore = useFirestore();

  const tracksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'education'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: tracks, isLoading } = useCollection<EducationTrack>(tracksQuery);

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
              Nenhuma trilha cadastrada ainda. Clique em "Nova trilha" para criar a primeira.
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Ordem: {track.order ?? 0}
                      </Badge>
                      {/* Espaço para futuro botão de edição */}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
