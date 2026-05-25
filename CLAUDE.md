# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo for **Rabisko**, a tattoo-booking marketplace (clients ↔ artists ↔ studios, Brazil). All user-facing copy, domain names, and API messages are in **Brazilian Portuguese** — keep new code consistent with that.

- `backend/` — Spring Boot 4.0.6 REST API, Java 21, PostgreSQL (Supabase), JWT auth, BoofCV (computer vision).
- `mobile/` — Expo SDK 54 / React Native 0.81 / React 19 app (TypeScript).
- `mobile/design/DESIGN.md` — the design-system contract for the mobile UI (color/type/spacing tokens, screen specs). Treat its tokens as hard requirements; the app's current screens predate it and use an ad-hoc palette (e.g. `#eaddd7`/`#bfa094` in `src/routes/app.routes.tsx` and `src/theme/index.ts`), not these tokens.

## Commands

### Backend (`cd backend`)
- Run: `./mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`)
- Build: `./mvnw clean package`
- All tests: `./mvnw test`
- Single test: `./mvnw test -Dtest=MvpApplicationTests#contextLoads`
- Requires env var `JWT_SECRET` (falls back to `my-secret-key`). The PostgreSQL (Supabase) JDBC URL is hardcoded in `src/main/resources/application.properties`; server runs on port 8080.

### Mobile (`cd mobile`)
- Install: `npm install`. Add new native/Expo modules with `npx expo install <pkg>` so versions stay aligned with SDK 54 (`node_modules/expo/bundledNativeModules.json`) — e.g. `react-native-svg` is pinned to that file's version because `lucide-react-native` needs it.
- Start (Metro, offline by default): `npm start` — use `npm run tunnel` if devices can't reach the LAN. Runs in Expo Go (SDK 54); no native build needed yet.
- Platform shortcuts: `npm run android` / `npm run ios` / `npm run web`
- Lint: `npm run lint` (`expo lint`)
- There is no test runner configured for the mobile app.

## Backend architecture

**Modular monolith** under `com.rabisko.mvp`. Each business domain is a self-contained vertical slice with its own `domain/`, `controller/`, `service/`, and `repository/` sub-packages. Do **not** add new classes to a flat `controller/`, `service/`, or `domain/` root — always place them inside the appropriate module.

### Module map

| Module | Package | Contents |
|---|---|---|
| `user` | `com.rabisko.mvp.user` | `User`, `UserRole`, auth DTOs, `UserRepository`, `AuthorizationService`, `UserService`, `AuthenticationControler`, `UserController` |
| `artist` | `com.rabisko.mvp.artist` | `Artist`, `PortfolioImagem`, `AvaliacaoDTO`, all artist DTOs, `ArtistRepository`, `PortfolioImagemRepository`, `ArtistService`, `ArtistController` |
| `client` | `com.rabisko.mvp.client` | `Client`, `ClientDTO`, `ClientRepository`, `ClientService` |
| `studio` | `com.rabisko.mvp.studio` | `Studio`, `StudioDTO`, `RegisterEstudioDTO`, `StudioRepository`, `StudioService` |
| `estilo` | `com.rabisko.mvp.estilo` | `Estilo`, `EstiloDTO`, `EstiloRepository`, `EstiloService`, `EstiloController` |
| `chat` | `com.rabisko.mvp.chat` | `Chat`, `Message`, all chat/message DTOs, `ChatRepository`, `MessageRepository`, `ChatService`, `ChatController`, `ChatWsController` |
| `appointment` | `com.rabisko.mvp.appointment` | `Appointment`, `AppointmentSession`, `AppointmentStatus`, all appointment DTOs, `AppointmentRepository`, `AppointmentSessionRepository`, `AppointmentService`, `AppointmentController` |
| `simulation` | `com.rabisko.mvp.simulation` | `SimulationService`, `SimulationController` (BoofCV background removal) |
| `shared` | `com.rabisko.mvp.shared` | `StorageService` (Supabase Storage), `SecurityConfiguration`, `SecurityFilter`, `TokenService`, `WebSocketConfig`, `JwtChannelInterceptor` |

### Cross-module dependencies (via Spring DI — expected and correct)
- `UserService` → `ArtistService`, `ClientService`, `StudioService` (orchestrates registration)
- `ArtistService` → `ChatRepository`, `AppointmentRepository` (dashboard metrics)
- `AppointmentService` → `ChatRepository`, `ArtistRepository`, `ClientRepository`, `UserRepository`
- `ChatService` → `ArtistRepository`, `ClientRepository`, `UserRepository`
- `shared.SecurityFilter` → `user.UserRepository`
- `shared.SecurityConfiguration` → `user.AuthorizationService`

### Key conventions
- **Auth is stateless JWT.** `AuthenticationControler` (`POST /auth/login`) authenticates via `AuthenticationManager` and returns a token from `TokenService` (HMAC256, issuer `auth-api`, 2h expiry, timezone `-03:00`). `SecurityFilter` (a `OncePerRequestFilter`) reads the `Authorization: Bearer …` header, validates the token, loads the user, and populates the `SecurityContext`. `SecurityConfiguration` permits only `POST /auth/login` and `POST /user/cadastro`; everything else requires authentication; CSRF disabled, sessions `STATELESS`.
- `User` implements `UserDetails`; `UserRole` enum values are lowercase (`admin`, `cliente`, `tatuador`, `estudio`) to match the Postgres native enum. `AuthorizationService` is the `UserDetailsService` (`findByEmail`). Passwords are BCrypt-hashed in `UserService.cadastrarUser`.
- On registration, `UserService` saves the `User` then conditionally creates an `Artist` or `Client` profile. **Caveat:** it currently compares the `UserRole` enum against the string literals `"tatuador"`/`"cliente"`, so that branch never fires — fix the comparison if you touch profile creation.
- Lombok is used heavily (`@Getter/@Setter/@Builder/@AllArgsConstructor/@EqualsAndHashCode`) and configured as an annotation processor in `pom.xml` — keep IDE annotation processing enabled.
- `boofcv-all` backs `SimulationService.removeBackground` (PNG transparency from a black-on-white sketch); the mobile "Simulação" screen is not yet built.

## Mobile architecture

The project was scaffolded from `create-expo-app` (the **expo-router** template) but the running app does **not** use expo-router. Entry is `package.json` `main` → `node_modules/expo/AppEntry.js` → root `App.tsx` (wraps `GestureHandlerRootView` → `SafeAreaProvider` → `<Router/>`, also imports `src/styles/global.css` for NativeWind). `src/routes/index.tsx` (`Router`) renders a `@react-navigation` tree gated on `useAuthStore().isAuthenticated`: unauthenticated → `AuthRoutes` (native-stack: `Login` / `Register` / `ForgotPassword` / `NewPassword`); authenticated → `AppRoutes` (bottom tabs: `Home` / `Search` / `Bookings` / `Profile` / `Settings`, where `Home` is a nested `HomeStack` native-stack of `HomeList` / `EstablishmentProfile` / `BookingFlow` / `Payment`).

- **Real app code lives under `mobile/src/`.** Screens are flat files: `src/screens/Auth/*.tsx` and `src/screens/App/*.tsx` (with a `SearchScreen.web.tsx` platform variant — `react-native-maps` is native-only). Shared UI in `src/components/common/` (`Button`, `Input` — built with NativeWind `className` + Reanimated). State in `src/store/authStore.ts` (Zustand + `persist` middleware over `@react-native-async-storage/async-storage`, key `auth-storage`). `src/services/api/index.ts` is an `axios` instance whose `baseURL` is still a placeholder (`https://api.example.com`) — **not wired to the Spring backend yet**. `src/theme/index.ts` is a plain TS token object (colors/spacing/borderRadius), separate from the Tailwind/NativeWind config. `src/mocks/react-native-maps.js` exists but is **not** referenced by `metro.config.js`, so it's currently dead code. `src/assets`, `src/utils` are still `.gitkeep` placeholders.
- **Styling is NativeWind v4 + Tailwind.** `babel.config.js` uses `babel-preset-expo` (with `jsxImportSource: "nativewind"`) + `nativewind/babel` + `react-native-reanimated/plugin`; `metro.config.js` wraps the config in `withNativeWind` with input `src/styles/global.css`; `tailwind.config.js` scans `App.tsx` + `src/**`. Use `className` for new components (some older code mixes inline `StyleSheet`/`theme` values).
- **Design tokens.** `tailwind.config.js` + `src/theme/index.ts` carry the Rabisko design tokens (source of truth: `design/src/colors_and_type.css` and `design/DESIGN.md`). Border radii: use the `rounded-r-xs … rounded-r-pill` classes (anchor = the Cadastro RoleSwitch — 12px outer / 8px inner = `r-md`/`r-xs`) — never hardcode `rounded-[24px]`/`rounded-full`/etc. Colors: use semantic tokens (`bg-surface`, `text-ink`, `bg-plum`, `text-fg-2`, …); `plum` (`#602C66`) is the only selection/activation color. The `primary`/`card`/`text`/`muted` color keys and `theme.borderRadius` are deprecated — `design/IMPLEMENTATION-CHECKLIST.md` tracks the migration and the broader design-alignment work (the current screens predate the design system).
- **Leftover `create-expo-app` template files are unused — don't mistake them for project code:** top-level `mobile/components/`, `mobile/hooks/`, `mobile/constants/`, `mobile/scripts/reset-project.js`. The `expo-router` dependency was removed from `package.json` (2026-05) — it was unused but its native autolinking was double-registering `react-native-screens` v4 + `react-native-svg` views, causing the app to hang on the splash screen with `Invariant Violation: Tried to register two views with the same name RNS*` errors. When adding shared UI, put it in `src/components/`, not the top-level `components/`.
- TS path alias: `@/*` → the `mobile/` directory root. New-architecture and React Compiler are enabled (`app.json`).
