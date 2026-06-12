Vou executar a evolução em 3 fases. Esta é a Fase 1 — fundação. Fases 2 e 3 virão em respostas seguintes, após esta ser aprovada e funcionando.

## Fase 1 — Fundação (esta entrega)

**Objetivo:** habilitar backend real, autenticação de clientes e admins, sistema de roles seguro, proteção do `/admin`, e padronizar feedbacks com Sonner. Sem ainda migrar produtos/checkout para o banco — isso vem na Fase 2.

### O que vou fazer

1. **Habilitar Lovable Cloud** no projeto.

2. **Schema inicial** (migração SQL):
   - `profiles` (id = auth.users.id, full_name, phone, created_at) + trigger `handle_new_user` que cria profile no signup.
   - `app_role` enum (`admin`, `customer`).
   - `user_roles` (user_id, role) — tabela separada, nunca em profiles.
   - Função `has_role(_user_id, _role)` SECURITY DEFINER.
   - RLS: usuário lê/edita o próprio profile; user_roles é leitura própria + admin gerencia.

3. **Auth UI**:
   - `/login` (email + senha, link "esqueci a senha", link para cadastro).
   - `/cadastro` (nome, email, senha, confirmar senha) — `emailRedirectTo: window.location.origin`.
   - `/recuperar-senha` (envia email).
   - `/reset-password` (define nova senha após link do email).
   - `/minha-conta` (esqueleto: edita nome/telefone, lista vazia de pedidos com placeholder "em breve" — fluxo real de pedidos vem na Fase 3).
   - Logout no menu.

4. **Router context com auth** (`__root.tsx`):
   - Hook `useAuth` que escuta `onAuthStateChange` (ANTES de `getSession`), expõe `user`, `session`, `isAdmin`.
   - Layout pathless `_authenticated` (gate via `beforeLoad`).
   - Layout pathless `_admin` (gate via `beforeLoad` + `has_role('admin')`).
   - Mover `admin/*` para `_authenticated/_admin/*`.
   - Mover `minha-conta` para `_authenticated/`.
   - `/checkout` continua público por enquanto (Fase 3 ajusta).

5. **Navbar**:
   - Botão "Entrar" quando deslogado.
   - Avatar/dropdown com "Minha conta" + "Sair" quando logado.
   - Item "Admin" só aparece quando `isAdmin === true`.

6. **Toaster Sonner** — já existe no `_layout`. Vou padronizar e adicionar feedbacks em:
   - add/remove carrinho (ajustar mensagens existentes).
   - login sucesso/erro, cadastro sucesso/erro, logout, recuperar senha enviado, senha alterada.
   - erros de formulário com mensagens claras em português.

7. **Como criar o primeiro admin**: vou documentar (e fazer no chat após a entrega) o INSERT em `user_roles` via Cloud para promover o seu usuário a admin. Não exponho criação de admin pelo front.

### O que NÃO entra nesta fase

- Migração de produtos/categorias/cupons/energias para o banco (Fase 2).
- Checkout real, pedidos, pagamentos, cupons aplicáveis (Fase 3).
- Busca melhorada com debounce (Fase 2).
- Painel de pedidos no admin (Fase 3).

Carrinho e admin de produtos continuam em Zustand/localStorage até a Fase 2 — o site continua usável durante a transição.

### Detalhes técnicos

- Auth: sessao propria server-side com Neon, cookie HTTP-only e tabela `users`.
- Roles checadas via RPC `has_role` chamada após login para popular `isAdmin` no contexto.
- `beforeLoad` em `_admin` chama `has_role`; se falhar, `redirect({to: '/login'})` ou `/acesso-negado`.
- Validação de formulários com Zod (já em uso no checkout).
- Estilo dos forms seguindo `aura-input` e tokens existentes (roxo/dourado/Aboreto).
