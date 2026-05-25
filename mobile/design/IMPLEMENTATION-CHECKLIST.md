# Rabisko mobile — checklist de alinhamento ao design

Comparação dos comps em `design/` (protótipo-fonte `design/src/ui_kits/mobile-app/` + `design/src/colors_and_type.css` — o contrato; os PNGs em `screenshots/` são crops do topo do frame 402×874) com as telas em `src/screens/`.

Prioridades: **F = fundação** (fazer primeiro, destrava o resto) → **P1** = corrigir telas existentes → **P2** = telas faltando → **P3** = extras a reconciliar.

Status: `[ ]` a fazer · `[~]` em andamento · `[x]` feito.

---

## F — Fundação (design system)

- [x] **F1. Padrão de bordas arredondadas — anchor = seletor de perfil do Cadastro (RoleSwitch).**
  Curvatura canônica do design: **container externo = 12px, botão interno = 8px** (12 − 4 de padding). Toda outra borda escala disso:

  | token | valor | uso |
  |---|---|---|
  | `rd-xs` | **8px** | item interno dentro de um container `md` (cada botão do RoleSwitch) |
  | `rd-sm` | 10px | micro-chips / tags inline |
  | **`rd-md`** | **12px** | **DEFAULT** — botões, fields, abas, role-switch (container), maioria dos containers |
  | `rd-lg` | 16px | cards, sheets, tiles de superfície |
  | `rd-xl` | 22px | hero cards, mídia grande |
  | `rd-2xl` | 28px | modal sheets, bloco de logo |
  | `rd-pill` | 9999px | status pills, botões de ícone redondos, segmented "full" |

  - [x] Escala em `tailwind.config.js` → `theme.extend.borderRadius` (`rd-xs`…`rd-pill`) → classes `rounded-rd-xs` … `rounded-rd-pill`.
  - [x] Espelhar em `src/theme/index.ts` → `radius` (`xs:8 … pill:9999`).
  - [x] **Banir hardcode**: trocou todo `rounded-[..]`/`rounded-2xl`/`rounded-3xl`/`rounded-xl`/`rounded-full` (e os `borderRadius:` inline de `SearchScreen.web.tsx`) pelos tokens `rounded-r-*`. Mapeamento aplicado: botões/inputs/icon-chips/time-slots/markers → `rd-md`; cards → `rd-lg`; portfólio → `rd-xl`; sheets (Register form, Profile header, ArtistProfile content sheet) → `rd-2xl` (com `rounded-t-r-2xl`/`rounded-b-r-2xl`); chips/pills/avatares-redondos/radio → `rd-pill`. Exceções legítimas (inline geométrico em px) preservadas: `Stepper.tsx:38` (28×28 círculo → 14) e `app.routes.tsx:45` (indicador de aba 3px → 2). Lint limpo (0 erros).
  - [x] Comentário/regra no `tailwind.config.js` e nota no `CLAUDE.md`.

- [x] **F2. Cores — tokens reais (substituir a ramp `primary` rosada).**
  - [x] Tokens `rbk` em `tailwind.config.js`: `background #F8F9FA`, `surface #EAE0D5`, `surface-2 #F2EBE0`, `ink #000`, `ink-soft #1A1A1A`, `paper #FFF`, `hairline #D9D9D9`, `plum #602C66`, `plum-deep #4A2150`, `plum-tint #EFE6F0`, `fg-2 #404040`, `fg-3 #6B6B6B`, `on-ink #FFF`, `success #1F7A4D`, `warning #B5752A`, `error #B33A3A`.
  - [x] Espelhar em `src/theme/index.ts`.
  - [x] Migrou usos: `bg-primary-100`/`bg-[#eaddd7]` → `bg-surface`; `bg-primary-100/30` e `/50` → `bg-surface-2`; `bg-[#f8f9fa]` → `bg-background`; `border-primary-100` → `border-hairline`; `text-primary-500` → `text-ink`; `#666`/`#999`/`#ccc`/`#bfa094` inline → `#6B6B6B`/`#D9D9D9`/`#602C66`. PaymentScreen MethodTile e BookingScreen time-slot selecionados agora usam **plum**; o `react-native-calendars` (legacy) recebeu `selectedColor: '#602C66'` e `todayTextColor: '#000000'` (encerra antes do CalendarMini substituir).
  - [x] Status pills `bg-green-100`/`bg-yellow-100` (BookingsScreen) → Confirmado = `bg-plum` + `text-on-ink`; Pendente = `bg-surface border border-ink` + `text-ink`. Sign-out (SettingsScreen) `bg-red-50`/`bg-red-500`/`text-red-500` → `bg-error/10`/`bg-error`/`text-error`. Switch track ativo `#000` → plum `#602C66`.
  - [x] Removeu do `tailwind.config.js` os keys `primary` (ramp), `secondary`, `card`, `text`, `muted`; do `src/theme/index.ts` removeu `colors.primary`, `colors.secondary`, `colors.gray`, `colors.white`, `colors.black`, e o bloco `borderRadius` legado. `npx expo lint` e `npx tsc --noEmit` limpos (0 erros).

- [~] **F3. Tipografia.**
  - [x] `@expo-google-fonts/bebas-neue` + `@expo-google-fonts/inter` + `@expo-google-fonts/dm-sans` instalados; `useFonts` no `App.tsx` carregando Bebas 400, Inter 300/400/400i/500/600/700/800, DM Sans 400/700; `expo-splash-screen` segura até carregar.
  - [x] Tokens de família em `tailwind.config.js` → classes `font-display` (Bebas), `font-body`/`font-body-medium`/`font-body-semibold`/`font-body-bold`/`font-body-extrabold`/`font-body-light`/`font-body-italic` (Inter), `font-aux`/`font-aux-bold` (DM Sans).
  - [ ] Substituir nas telas os `font-black uppercase tracking-tighter` que imitam display → `font-display` / `font-aux-bold` / etc., e aplicar a escala de tamanhos (`t-display-lg = 32`, `t-h1 = 32`, `t-h3 = 20`, `t-body-lg = 16`, `t-button = 20`, `t-caption = 11`...). (P1)

- [x] **F4. Sombras → flat.** Removidos os `shadow-lg/xl/2xl` que sobravam: `ProfileScreen` (avatar 32×32), `SearchScreen` (search bar, marker bubble, card de seleção), `SearchScreen.web` (search bar). Onde fazia sentido para definir o card sem sombra, a search bar virou `border border-hairline`. `rg "shadow-(sm|md|lg|xl|2xl)"` agora vazio em `src/`. Sombras ficam reservadas pra elementos que de fato flutuam (sheets/modais/FAB), quando aparecerem.

- [x] **F5. Espaçamento.** Escala 8pt da Tailwind já vinha sendo usada; o que faltava era a padronização lateral. Padrão definitivo: **padding lateral de tela = 24 (`px-6` / `paddingHorizontal: 24`)**. Migrações desta volta: `Header` (`px-8` → `px-6`, agora alinha o chevron-back com a borda do conteúdo), `LoginScreen` e `RegisterScreen` (`paddingHorizontal: 32 → 24`), `LandingScreen` (`px-8 → px-6`), `ChatScreen` (`px-8 → px-6`), `SettingsScreen` (`px-8 → px-6`). `rg "\bpx-(7|8|10)\b|paddingHorizontal:\s*(28|30|32|36|40)"` em `src/` agora só retorna o `px-10` interno do `Button` (padding 18×40 do F6, intencional). Topo sob status bar = `useSafeAreaInsets().top + 8` via `Header`. Gap entre `SessionRow` = 10 (espelha o proto), gap entre cards = 12 (default `gap-3`). Bottom-nav reserva = 96 (altura do `tabBarStyle` em `app.routes.tsx`) — `react-navigation` já tira essa área do `children`, então `paddingBottom: 24` no `contentContainerStyle` é folga interna, não reserva pra nav. Telas P3 (`ForgotPassword`/`NewPassword`/`Profile`) foram intencionalmente deixadas de fora — entram na própria reescrita P3 com `<Header />` + `Field` + tokens.

- [x] **F6. Componentes do kit → `src/components/common/`:**
  - [x] `Button` → retângulo `rounded-rd-md`, `font-body-bold` 20px, padding 18×40, press scale .97 (sem `opacity .8`), variantes `primary(ink)`/`secondary(surface)`/**`plum`**/`outline`/`ghost`, estados `loading`/`disabled`.
  - [x] `Input` (Field) → cream `bg-surface`, `rounded-rd-md`, label `font-body` 12px caixa normal em `text-fg-2`, sem borda em repouso, foco → **borda plum** (erro → borda `error`), ícone leading + `secure`(olho)/`trailingIcon` opcional.
  - [x] `Header` → back chevron + título Bebas centralizado (3 zonas), padding-top do safe-area inset.
  - [x] `Stepper` → 4 passos (Artista·Data·Pagamento·Concluído), done = plum+check, ativo = ink+nº, futuro = círculo outline; conectores preenchem em plum.
  - [x] `CalendarMini` → grade do mês (pt-BR, domingo primeiro), nav de mês, dia selecionado = bolinha plum, hoje = ink negrito sublinhado, dias antes de `minDate` mutados; controlado via `selectedDate`/`onSelectDate`.
  - [x] `Chip` → `FilterChip` (pill cream→ink, ícone), `PrefChip` (pill ink→plum, label branco uppercase), `StatusPill` (`ink` = cream+borda ink / `plum` = plum cheia).
  - [x] `ArtistCard` → bloco preto `rounded-rd-lg`, coração top-left (`favorited`/`onToggleFavorite`), nota+estrela top-right, foto 96px `rounded-rd-lg`, nome centro, tags pill outline branco, rodapé cream "ver mais...".
  - [x] `BottomNav` custom (`src/components/common/BottomNav.tsx`) — extraído do `app.routes.tsx`. Plugado no navigator via `tabBar={(props) => <BottomNav {...props} />}`. Encapsula a surface cream 96px, o `TabIcon` animado (spring 0→1 escalando 1.0→1.12 + pílula plum 0→18px), os mapas de ícones/labels por nome de rota e o handling de `tabPress`/`tabLongPress`. Honra `tabBarStyle: { display: 'none' }` setado por screens (`ConfirmedScreen` depende disso). O `app.routes.tsx` ficou enxuto: só registra os 4 `Screen` e o `tabBar` prop.
  - [ ] `Toast` (snackbar plum) — ainda não portado (baixa prioridade).

- [x] **F7. Bottom navigation** — componente `BottomNav` em `src/components/common/BottomNav.tsx` (refatorado para fora do `app.routes.tsx`); `app.routes.tsx` agora só declara os 4 `Screen`s e passa `tabBar={(props) => <BottomNav {...props} />}`. **4 abas — Home · Chat · Sessões · Settings** (Chat tem `ChatScreen` — lista de conversas estática; o thread completo com anexos é P2). Surface cream `#EAE0D5`, sem borda; ativo = **plum** + indicador "pill underline" animado (`withSpring`, largura 0→18) + ícone com escala 1.12. Abas **Search** (mapa) e **Profile** removidas da nav (os arquivos `SearchScreen`/`ProfileScreen` continuam no repo até a decisão de P3). Altura 96px (≈ design 80 + safe-area; refinar com inset depois é polish).

- [ ] **F8. Animações.** Padronizar: screen-enter `fadeUp` (10px→0, opacity 0→1, ~220ms `ease-out`), press scale .97, indicador de aba `width 0→18px` com mola, sucesso (Confirmed) = check com mola + 2 anéis expandindo, stagger de lista 30ms, respeitar reduced-motion.

- [~] **F9. Papéis (Cliente/Artista/Estúdio).**
  - [x] `RoleSwitch` (`src/components/common/RoleSwitch.tsx`) — container `rounded-rd-md` 12px com `p-1` (4px), 3 botões `rounded-rd-xs` 8px, selecionado = `bg-ink` + texto branco, com ícones (User/Brush/Store). **Este é o anchor do F1.**
  - [x] `role: 'cliente' | 'artista' | 'estudio'` + `setRole` no `authStore` (persistido).
  - [~] Wiring: Login + Cadastro feitos (P1) — ambos renderizam `RoleSwitch` + copy/CTA por papel. Falta a divisão de `AppRoutes` por papel (artista/estúdio → Dashboard, P2 #13).

---

## P1 — Corrigir as telas que já existem

### Login (`src/screens/Auth/LoginScreen.tsx`) — `[x]`
- [x] `Header onBack={() => navigation.goBack()}` no topo — volta pra Landing (que agora é o initial route do `AuthRoutes`).
- [x] `RoleSwitch` (de `src/components/common/RoleSwitch.tsx`, controlado por `useAuthStore().role`/`setRole`) + copy por papel via `SUBTITLE_BY_ROLE` (cliente/artista/estudio).
- [x] Título "BEM-VINDO" em `font-display text-[32px]` — Bebas, sem `text-[44px] font-black uppercase tracking-tighter`.
- [x] "Esqueceu a Senha?" → `font-body-bold text-[12px] text-plum`, `hitSlop={8}` para área de toque.
- [x] Botão "Entrar" ancorado no rodapé via `<View className="flex-1" />` spacer; forma/label do `Button` (já `rounded-rd-md` + Inter 700/20 desde F6).
- [~] Cliente → Home (default do `AppRoutes`). Artista/estúdio → Dashboard ainda não existe (P2 #13); para já, `setRole` guarda o papel no store e todos os papéis caem em Home; quando o Dashboard for criado, a divisão do `AppRoutes` por papel resolve o roteamento real.

### Cadastro (`src/screens/Auth/RegisterScreen.tsx`) — `[~]`
- [x] `Header` + back chevron → `navigation.goBack()` (volta pra Login, que é o initial route do AuthRoutes).
- [x] `RoleSwitch` controlado por `useAuthStore().role`/`setRole`; `SUBTITLE_BY_ROLE` muda a copy de descrição; `CTA_BY_ROLE` muda o botão ("Criar conta" / "Sou artista" / "Sou estúdio").
- [x] Campos comuns a todos os papéis: **Nome completo / E-mail / Senha**. Removidos: Nascimento+CPF, "Confirmar Senha".
- [x] Condicionais por papel: artista → `@ Instagram` + 8 pills `PrefChip` multi-select de "Estilo principal" (`TATTOO_STYLES`); estúdio → `CNPJ` + `Endereço completo`.
- [x] Bloco "Localização / Horários de Atendimento" hardcodado removido.
- [x] Nota de Termos: ícone `Info` + texto `font-body 12/16 text-fg-3` com "Termos de Uso" e "Política de Privacidade" em `text-plum`.
- [~] CTA roteia via `setUser` (mock) — todos os papéis caem em Home enquanto Dashboard (P2 #13) não existir, igual à Login. "Já tem conta? Entrar" → `navigation.navigate('Login')`.

### Home (`src/screens/App/HomeScreen.tsx`) — `[x]`
- [x] Linha de saudação "OLÁ, {firstName}" (lê do `useAuthStore().user`, fallback "VOCÊ") + localização "São Paulo, SP" com ícone `MapPin` + botão `Bell` com bolinha plum (overlay 2.5×2.5 com borda do background pra parecer flutuando).
- [x] Headline editorial em 3 linhas, alinhada à esquerda: "ARTISTAS" `font-display text-[64px]` / "perto de" `font-body-italic text-[28px] text-plum lowercase` / "VOCÊ" `font-display text-[64px]`.
- [x] Search bar via `Input` (Field) com `icon=Search` + `trailingIcon=SlidersHorizontal`, placeholder "Artistas, estúdios, estilos...".
- [x] Filter chips `[Perto, Estilo, Preço, Disponível]` via `FilterChip` com ícones (`Compass`/`Palette`/`Tag`/`CalendarCheck`), "Perto" default ativo. "Dinheiro" e o uppercase pesado removidos.
- [x] Const `CATEGORIES` morta removida (junto com sabor "serviços em geral"); imports não-usados também.
- [x] Todas as seções: "Por estilo" (rail de `StyleTile` 96×128), "Flash do dia" (com `StatusPill` "HOJE" tone plum + rail de `FlashCard` 168×168), "Em destaque" (hero 16:11 com badge BOOST), "Favoritos" (rail de `FavoriteTile` redondo 72px com coração plum no canto), "Perto de você" (grid 2-col de `ArtistCard` real com FadeInDown stagger), card-dica "NOVIDADE → ABRIR" (entrada planejada do Simulador, fundo `bg-plum-tint`, ícone `Sparkles` em círculo plum).
- [x] Cards pretos `rounded-[32px]` ad-hoc substituídos pelo `ArtistCard` (`rd-lg`, footer "ver mais..."), com `onPress` navegando pra `EstablishmentProfile`.

### Artist Profile (`src/screens/App/EstablishmentProfileScreen.tsx`) — `[x]`
- [x] Layout centrado-no-chat: hero `items-center` com foto redonda 120px (`rounded-rd-pill`) → `StatusPill` tone `ink` com a 1ª tag ("Realismo") → nota "4,9" + `Star` ink → nome `font-aux-bold text-[32px] leading-[36px]`.
- [x] Coração no slot direito do `Header` (`right={...}`); estado `favorited` local — `fill={plum}` quando ativo, contorno preto quando inativo. Toggle de favorito local (TODO: persistir).
- [x] Card "Sobre" `bg-surface rounded-rd-lg p-5` com título DM Sans bold, copy `font-body text-fg-2 leading-[20px]`, e `@joão.santos` em `text-fg-3` 13px na última linha.
- [x] Portfólio: 2 imagens flex-1 com `aspectRatio: 1` e `rounded-rd-xl` (22px); header com "Ver Todos" linkado (TODO: navegar para a galeria completa).
- [x] Seção "Avaliações" nova — `ReviewCard` com avatar de iniciais 36×36 plum-on-ink, nome + "Há X horas" empilhados, fileira de 5 estrelas inks à direita; texto da review em `font-body text-fg-2`.
- [x] Removidos: seção "Horários", badge "Verificado", barra inferior com "A partir de R$ 250,00".
- [x] CTA full-width `<Button title="Iniciar Conversa" />` sticky no rodapé (absolute) com `paddingBottom: 24`. Por enquanto é no-op placeholder até a Chat thread (P2) existir como rota destino.

### Booking (`src/screens/App/BookingScreen.tsx`) — `[x]`
- [x] `Stepper current={1}` (DATA ativo).
- [x] Mini-linha do artista no topo: foto redonda 46px + nome `font-body-semibold 15` + tags `font-body 12 text-fg-3` separadas por · . (Artista ainda mockado; tipos do `BookingFlow` já recebem `id`, pronto pra buscar via API quando plumbar.)
- [x] `CalendarMini` substitui o `react-native-calendars` (também tirou o `LocaleConfig` antigo).
- [x] `Header title="Reserva"` Bebas centralizado. "Selecione a Data" removido. "Horário" DM Sans h3 + linha "{dia} de {mês} · {hora}" formatada com `date-fns` pt-BR.
- [x] 6 slots fixos `['10:00','12:00','14:00','16:00','18:00','20:00']`, 3 por linha (width 31.5%), `rounded-rd-md`, selecionado = `bg-ink text-on-ink`, não-selecionado = `bg-surface text-ink` (sem borda). 14:00 pré-selecionado.
- [x] Card "Resumo da Reserva" removido.
- [x] Botão sempre habilitado, sticky no rodapé, "Avançar para Pagamento" → `navigation.navigate('Payment', { bookingId })`.

### Payment (`src/screens/App/PaymentScreen.tsx`) — `[x]`
- [x] `Stepper current={2}` (PAGAMENTO ativo).
- [x] Tile "Projeto escolhido" — label `font-body 13 text-fg-2` + imagem 16:9 `rounded-rd-lg`.
- [x] Card cream `bg-surface rounded-rd-lg p-5` com `BreakdownRow` (label `text-fg-2` à esquerda, valor `text-ink` à direita): Valor R$ 200,00 / Sessões 3x / Taxa da Reserva R$ 20,00 / `h-px bg-ink my-3` / **Valor Total R$ 220,00** (ambos `font-body-bold`). Card preto antigo removido.
- [x] `MethodTile` lado a lado (3, gap 10) com ícone empilhado sobre label — Pix (`QrCode`), Cartão (`CreditCard`), Apple Pay (`Smartphone`). Selecionado = `border-2 border-plum`; não selecionado = `border-transparent`. Sem radio, sem linhas full-width.
- [x] Nota `<Lock size={12}>` + "Pagamento criptografado e processado com segurança." em `font-body 12 text-fg-3`.
- [x] Botão "Confirmar Pagamento" sticky no rodapé → vira "Processando…" com `loading={processing}` por ~700ms → `navigation.navigate('Confirmed', { artistName, dateTime, total })`. `alert()` removido.

### Bookings → "Sessões" (`src/screens/App/BookingsScreen.tsx`) — `[~]`
- [x] Header `<Header title="Sessões" />` Bebas centralizado + overline "MINHA AGENDA" `font-aux-bold text-[10px] tracking-widest text-fg-3`.
- [x] `CalendarMini` no topo (controlado por `selectedDate`/`setSelectedDate`); na aba "Concluídas", `minDate` afrouxa pra deixar navegar meses passados.
- [x] Segmented "Próximas"/"Concluídas" — container `bg-surface rounded-rd-pill p-1`, pílulas `flex-1 py-2.5 rounded-rd-pill`, ativa = `bg-ink text-surface`, inativa = transparente + `text-ink`. Estado funcional (`useState<Tab>`) filtrando a lista.
- [x] `SessionRow`: foto 52×52 `rounded-rd-md` (12px), nome `font-body-semibold 14`, estilo+data em `text-[11px]`, fundo ink invertido quando `status==='hoje'` (cream caso contrário). Pílula "HOJE" plum quando hoje. Trailing: pílula plum "CHECK-IN" + `QrCode` 14 (hoje) / `CheckCircle2` 22 plum (concluída) / `ChevronRight` 22 fg-3 (futura). Cores legacy `bg-green-100`/`bg-yellow-100` já não existiam (varridas no F2); aqui ratificado.
- [x] Datas pré-formatadas no mock seguindo o protótipo: "Hoje · 14:00", "Sex · 19 Out · 18:30", "Sáb · 27 Out · 11:00", "22 Set · 15:00". Removido "Barbearia VIP". `code` (RBK-NNNN) já no tipo `Session` pra alimentar futura Session Detail.
- [~] `onOpen` em `SessionRow` está como TODO até a tela Session Detail existir (P2 #9b).
- [x] Entrada de lista com `Animated.View entering={FadeInDown.delay(40 * i)}` para o stagger (combina com F8).

### Settings (`src/screens/App/SettingsScreen.tsx`) — `[x]`
- [x] Header `<Header title="Configurações" />` Bebas centralizado + subtítulo `font-body 14 text-fg-2` "Gerencie sua conta, pedidos, pagamentos e preferências".
- [x] Lista única (sem agrupamentos): "Meu Perfil / Meus Pedidos / Métodos de Pagamento / Notificações / Ajuda" — espelha exatamente `Screens.jsx#SettingsScreen`. Ícones lucide: `User` / `CalendarDays` / `CreditCard` / `Bell` / `HelpCircle`.
- [x] Cada linha: ícone "pelado" 22px + label `font-body 16 text-ink` + `ChevronRight` fg-3 22. Container `bg-surface rounded-rd-lg overflow-hidden`. Divisor entre linhas via `borderTopWidth: 1 / borderTopColor: rgba(0,0,0,0.06)` (mais leve que o `bg-hairline` que tinha antes — o hairline de 1px sobre cream ficava marcado demais). Removido o quadrado preto `bg-black p-3 rounded-rd-md` ao redor de cada ícone.
- [x] Toggles "Notificações Push" e "Modo Escuro" removidos — não estão no design pra essa tela; viram destinos dos seus rows (TODOs até existirem). (O `Switch trackColor: '#602C66'` plum continua sendo o padrão se voltar a aparecer em outra tela.)
- [x] "Sair da Conta": agora é um link discreto fora da lista (centered, ícone `LogOut` 16 + label `font-body-semibold 14 text-error`). Usa `error #B33A3A` (não `red-500`/`red-50`). Confirmando §10 do DESIGN.md ("Settings: …, sign out") — o stub do protótipo realmente omite, mas a especificação manda manter o logout reachable.

---

## P2 — Telas faltando do catálogo (criar)

- [x] **Landing (01)** — `src/screens/Auth/LandingScreen.tsx`. Vertical+horizontal centered: bloco-logo 132×132 `rounded-rd-2xl bg-ink` (placeholder "R" em Bebas 80px branco — TODO: trocar pela imagem `logo-bisko-mark.png` quando o asset chegar no repo), "RABISKO" `font-display text-[64px]` com tracking +1.3, tagline `font-body 14 text-fg-2` (max 280, centered), CTA primary "Entrar" → Login, link "Novo por aqui? Criar conta" → Register. Adicionado como `Screen` em `auth.routes.tsx` com `initialRouteName="Landing"`; Login agora tem `Header onBack={navigation.goBack}` voltando pra cá.
- [x] **Confirmed (06b)** — `src/screens/App/ConfirmedScreen.tsx`. Tela cheia, esconde a bottom tab via `parent.setOptions({ tabBarStyle: { display: 'none' } })` no `useEffect` e restaura no cleanup. `Stepper current={3}` (CONCLUÍDO ativo). Hero animado: círculo plum 100px com `Check` 48px branco — escala com `withSpring(1, { damping: 9, stiffness: 140 })` após 120ms; 2 anéis plum (borda 2px) expandindo (`withTiming` 1100ms `Easing.out.cubic`) com stagger 300ms. "RESERVA CONFIRMADA" Bebas 32. Copy 24h em `font-body 14 text-fg-2`. Card-resumo cream com foto 46 redonda + nome + "Ter 14 Out · 14:00 · R$ 220,00" + `StatusPill` "PAGO" tone `plum`. Botões "Abrir Chat com {primeiroNome}" (primary; TODO até Chat thread P2) + "Voltar para Home" (`ghost`) que faz `navigation.popToTop()`. Adicionado como Screen do `HomeStack` com `gestureEnabled: false`.
- [~] **Chat (08)** — `ChatScreen.tsx` (lista de conversas estática + empty-state + FAB) já feita e ligada na aba do bottom nav (F7). Falta: dados/estado reais e a tela de thread/mensagens com anexos de imagem (`ChatV2`).
- [ ] **Session Detail (09b)** — detalhe de uma sessão: dados completos, "Abrir chat" / "Check-in".
- [ ] **Check-in (10)** — QR code do cliente pra apresentar no estúdio.
- [ ] **Scanner (10b)** — leitor de QR (papel artista/estúdio).
- [ ] **Healing (11)** — timeline de cicatrização pós-tattoo.
- [ ] **Rating (12)** — estrelas + comentário pós-sessão.
- [ ] **Dashboard (13)** — overview de reservas + receita (artista/estúdio); definir `AppRoutes` por papel.
- [~] **Simulador (07)** — `src/screens/App/SimuladorScreen.tsx` agora é uma **aba do bottom nav** (3ª posição, ícone `Sparkles`, label "Simulador") — virou ponto de entrada de 1º nível em vez do card "NOVIDADE → ABRIR" da Home. Placeholder atual: header Bebas "Simulador" + selo plum "BISKO AI · NOVIDADE" + headline "VEJA NO SEU CORPO ANTES DE TATUAR" + copy explicativa + hero ilustrativo (ícone `Wand2` em círculo plum-tint dentro de surface 4:3) + dois CTAs ("Tirar foto" `bg-ink` / "Carregar do rolo" `bg-surface`) + nota de rodapé sobre envio direto no chat. Falta: plumbar `expo-image-picker` (`launchCameraAsync` / `launchImageLibraryAsync`), o passo de seleção da referência de tatuagem, e o pipeline com o `boofcv-all` no backend.

---

## P3 — Extras fora do design (reconciliar)

- [ ] **Search / mapa (`SearchScreen.tsx` + `.web.tsx`)** — o design não tem mapa; descoberta é o feed + filtro "Perto". Decidir: (a) remover a aba e dobrar a função no filtro "Perto" da Home, ou (b) se mapa for requisito, adicionar a tela ao DESIGN.md (sem sombras, raios `rounded-rd-lg/r-pill`, plum) antes de manter.
- [ ] **Profile (`ProfileScreen.tsx`)** — não existe no design; duplica "Meu Perfil" (lá é uma linha do Settings) e ocupa uma aba. Decidir: remover a aba (mover conteúdo pra um "Meu Perfil" dentro de Settings) ou formalizar no DESIGN.md.
- [ ] **ForgotPassword / NewPassword** — não estão no catálogo. Adicionar essas duas ao DESIGN.md (são necessárias na prática) e reescrevê-las usando `Header`/`Field`/`Button`, fundo `background #F8F9FA`, tokens de raio. Corrigir o bug de layout do botão "Enviar Link" (está fora da `View` com padding → estica de borda a borda).
- [ ] **`src/mocks/react-native-maps.js`** — dead code (não referenciado no `metro.config.js`); remover ou ligar de fato se for fazer fallback de mapa.
