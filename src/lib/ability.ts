
'use client';

import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import type { AppUser } from '@/firebase';

/**
 * Define as ações que um usuário pode realizar.
 * 'manage' é uma palavra-chave especial do CASL que representa qualquer ação.
 */
type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';

// Adiciona o subjectType diretamente ao tipo AppUser para que o CASL o reconheça.
// Isso simplifica a verificação de permissões nos componentes.
type UserSubject = AppUser & { subjectType: 'User' };

/**
 * Define os "assuntos" (subjects) sobre os quais as ações podem ser realizadas.
 * Pode ser uma string (como 'all' ou o nome de uma entidade) ou um objeto (a própria instância do dado).
 */
type Subjects = 'all' | UserSubject | 'User';

/**
 * Define o tipo da habilidade do aplicativo, combinando Ações e Assuntos.
 */
export type AppAbility = MongoAbility<[Actions, Subjects]>;

/**
 * Cria a habilidade vazia que será usada para criar o contexto do CASL.
 */
export const ability = createMongoAbility<AppAbility>();

/**
 * Define as permissões para um usuário com base em seu papel e ID.
 *
 * @param user - O objeto do usuário autenticado (ou nulo se não estiver logado).
 * @returns Um objeto de habilidade (`AppAbility`) com as regras definidas.
 */
export function defineAbilitiesFor(user: AppUser | null) {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (user) {
    // Regra base: usuários autenticados podem ler tudo
    can('read', 'all');

    if (user.role === 'superadmin') {
      // Super administradores podem gerenciar (fazer qualquer coisa) em todos os "assuntos".
      can('manage', 'all');
      
      // Mas não podem excluir a si mesmos.
      cannot('delete', 'User', { uid: user.uid });
      // Nem alterar a própria role ou status
      cannot('update', 'User', ['role', 'status'], { uid: user.uid });

    } else {
      // Usuários comuns podem gerenciar seu próprio perfil.
      // A condição `{ uid: user.uid }` garante que eles só possam gerenciar o objeto de usuário que tenha o mesmo ID que o deles.
      can('manage', 'User', { uid: user.uid });
      
      // Especifica que eles não podem alterar a própria 'role' ou 'status'
      cannot('update', 'User', ['role', 'status']);
      
      // Eles não podem, por exemplo, excluir outros usuários
      cannot('delete', 'User');
    }
  } else {
    // Regras para usuários não autenticados (convidados).
    // Nenhuma permissão por padrão, exceto as que forem explicitamente dadas para páginas públicas.
  }

  return build({
    // Adiciona uma função para detectar o tipo do "assunto" (subject)
    // Isso é crucial para o CASL saber que um objeto `AppUser` deve ser tratado como um 'User'.
    detectSubjectType: object => (object as any).subjectType || object.constructor,
  });
}
