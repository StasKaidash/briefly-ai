# briefly-ai — Build Prompt

> **Назначение этого файла:** это не обычный README, а **build-промпт**. Когда Стас скажет «прочитай README в briefly-ai и начни делать» — нужно прочитать этот файл целиком и идти по нему сверху вниз, не отклоняясь без согласования. Все решения по стеку, схеме БД, роутам, UI и порядку реализации уже зафиксированы ниже. Уточнять только тонкие моменты, где явно стоит **(ASK)**.

---

## 1. Концепт

**briefly-ai** — веб-приложение, которое превращает сохранённые ссылки в короткие, читабельные AI-саммари.

**Пользовательский флоу:**
1. Логин через Supabase (magic link на email).
2. Вставляет URL статьи → жмёт «Brief it».
3. Сервер парсит контент статьи → отправляет в Claude API → получает: TL;DR (3 предложения), 5 ключевых поинтов, 3–5 тегов, оценку времени чтения оригинала.
4. Результат сохраняется в Supabase, появляется карточкой в дашборде.
5. Пользователь может: открыть полный бриф, отредактировать теги, удалить, искать по заголовку/тегам, переключать dark/light.

**Не делаем в MVP:** платежи, шаринг между юзерами, мобильное приложение, чат с документом, RAG, экспорт.

---

## 2. Зачем этот проект (контекст портфолио)

- Закрывает три gap в портфолио Стаса: **нет Next.js**, **нет реального API**, **нет настоящей AI-интеграции** (FutureTech не считается — там одна Netlify Function на summary).
- Это 6-й проект в гибридном Frontend + AI резюме на job-hunt июнь 2026.
- Должен выглядеть как маленький production-продукт, а не «учебный таск». Polish > scope.

---

## 3. Стек (фиксированный, не менять без явного запроса)

| Слой | Технология | Версия |
|------|------------|--------|
| Framework | Next.js | 15.x (App Router, RSC, Server Actions) |
| Язык | TypeScript | strict mode |
| Styling | Tailwind CSS | 4.x |
| UI primitives | shadcn/ui | latest |
| Иконки | lucide-react | latest |
| Auth + DB + Storage | Supabase | latest JS SDK (`@supabase/ssr` + `@supabase/supabase-js`) |
| AI | Anthropic Claude API | `@anthropic-ai/sdk`, модель `claude-sonnet-4-6` для саммари |
| Парсинг статьи | `@mozilla/readability` + `jsdom` | latest |
| Формы | react-hook-form + zod | latest |
| Валидация env | `@t3-oss/env-nextjs` + zod | latest |
| Линт | ESLint flat config (Next 15 preset) + Prettier | latest |
| Деплой | Vercel | — |
| Package manager | npm | (Стас использует npm в остальных проектах) |

**Никаких:** Redux, tRPC, Prisma (используем supabase-js напрямую), Jest (только Vitest, если будут тесты).

---

## 4. Структура проекта

```
briefly-ai/
├── .env.local                  # gitignored, см. раздел 8
├── .env.example                # коммитим, со значениями-заглушками
├── README.md                   # этот файл
├── next.config.ts
├── tsconfig.json               # strict: true, noUncheckedIndexedAccess: true
├── tailwind.config.ts
├── components.json             # shadcn config
├── eslint.config.mjs
├── src/
│   ├── app/
│   │   ├── layout.tsx          # root layout: providers, ThemeProvider, Toaster
│   │   ├── page.tsx            # landing (если не залогинен) / редирект на /dashboard
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── auth/callback/route.ts   # supabase oauth callback
│   │   ├── (app)/
│   │   │   ├── layout.tsx      # требует auth, sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── briefs/[id]/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   └── briefs/
│   │   │       └── route.ts    # POST: создаёт бриф (вызывает Claude)
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # shadcn: button, card, input, dialog, dropdown, toast, skeleton
│   │   ├── brief-card.tsx
│   │   ├── brief-form.tsx      # input URL + submit
│   │   ├── briefs-grid.tsx
│   │   ├── empty-state.tsx
│   │   ├── tag-chip.tsx
│   │   ├── search-bar.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── sidebar.tsx
│   │   └── user-menu.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # browser client
│   │   │   ├── server.ts       # server client (cookies)
│   │   │   └── middleware.ts   # auth refresh
│   │   ├── anthropic.ts        # Claude client + summarize() функция
│   │   ├── extract.ts          # readability + jsdom → { title, content, byline }
│   │   ├── env.ts              # t3-env validation
│   │   ├── utils.ts            # cn(), formatDate(), etc
│   │   └── types.ts            # Brief, Tag, User
│   ├── actions/
│   │   ├── create-brief.ts     # server action
│   │   ├── delete-brief.ts
│   │   └── update-tags.ts
│   └── middleware.ts           # supabase auth middleware
└── supabase/
    └── migrations/
        └── 0001_init.sql       # schema, см. раздел 5
```

---

## 5. Схема Supabase (Postgres)

Создать через SQL-миграцию (`supabase/migrations/0001_init.sql`), не через UI — чтобы было воспроизводимо.

```sql
-- profiles: 1:1 с auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- briefs
create table public.briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  byline text,
  tldr text not null,                    -- 3 sentences
  key_points text[] not null default '{}',
  tags text[] not null default '{}',
  reading_time_min int,                  -- estimated original reading time
  status text not null default 'ready', -- 'pending' | 'ready' | 'failed'
  error text,
  created_at timestamptz not null default now()
);

create index briefs_user_id_created_at_idx on public.briefs (user_id, created_at desc);
create index briefs_tags_idx on public.briefs using gin (tags);

-- RLS
alter table public.profiles enable row level security;
alter table public.briefs enable row level security;

create policy "profiles: self read" on public.profiles
  for select using (auth.uid() = id);

create policy "briefs: owner all" on public.briefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

## 6. Auth-флоу

- **Provider:** Supabase Email magic link (passwordless).
- **Pages:** `/login` → форма с email → `signInWithOtp({ email, options: { emailRedirectTo: <site>/auth/callback } })` → пользователь жмёт ссылку в письме → `/auth/callback` обменивает code на сессию → редирект на `/dashboard`.
- **Middleware:** `src/middleware.ts` рефрешит сессию на каждом запросе и редиректит неавторизованных с `(app)/*` на `/login`. Использовать паттерн из официальной доки `@supabase/ssr` для Next.js App Router.
- **Logout:** в `user-menu.tsx`, server action → `supabase.auth.signOut()` → `redirect('/login')`.

---

## 7. Claude API — как генерируем бриф

**Модель:** `claude-sonnet-4-6`. **Не** Opus (дороже, тут не нужно).

**Промпт-структура (в `src/lib/anthropic.ts`):**

```ts
const SYSTEM = `You turn long articles into concise briefs.
Always reply with valid JSON matching this schema exactly:
{
  "tldr": string,            // exactly 3 sentences, plain language
  "key_points": string[],    // 5 bullet points, max 15 words each
  "tags": string[],          // 3-5 lowercase single-word or hyphenated tags
  "reading_time_min": number // estimated minutes to read the ORIGINAL article
}
No prose outside JSON. No markdown fences.`;

// user message:
// "Title: {title}\n\nArticle:\n{content}"  (content trimmed to ~12k chars)
```

- Использовать **tool use / structured output** через `tools` параметр SDK, чтобы гарантировать валидный JSON — НЕ парсить строку регэкспами.
- Добавить `prompt caching` на SYSTEM-блок (`cache_control: { type: 'ephemeral' }`) — это стандарт для Anthropic SDK проектов по правилам Стаса.
- Таймаут запроса: 60s. При ошибке/таймауте сохраняем бриф со `status='failed'` и `error=<msg>`.

**Пайплайн создания брифа (server action `create-brief.ts`):**
1. Валидация URL (zod).
2. INSERT строки в `briefs` со `status='pending'`.
3. `revalidatePath('/dashboard')` — карточка появляется сразу со скелетоном.
4. Fetch URL → Readability → `{ title, content, byline }`. Если не извлеклось — `status='failed'`.
5. Claude API call. Распарсить ответ.
6. UPDATE строки: `tldr`, `key_points`, `tags`, `reading_time_min`, `status='ready'`.
7. `revalidatePath('/dashboard')`.

---

## 8. Environment variables

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # серверные операции (создание профиля и т.п.)
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # на проде = домен Vercel
```

Валидировать через `@t3-oss/env-nextjs` в `src/lib/env.ts`. **Никогда** не трогать `process.env` напрямую вне этого файла.

---

## 9. UI / UX направление

- **Тема:** темная по умолчанию, переключаемая. Использовать `next-themes`.
- **Палитра:** нейтральный slate/zinc + один акцент (предложить electric violet `#7c3aed` или teal `#14b8a6` — **(ASK)** перед стартом, либо взять violet по умолчанию).
- **Типографика:** Inter для UI, JetBrains Mono для меток статусов / счётчиков.
- **Дашборд:** sidebar слева (`Dashboard`, `Settings`, user-menu внизу), контентная область с input-баром сверху и сеткой карточек (grid `lg:grid-cols-2 xl:grid-cols-3`).
- **Карточка брифа:** заголовок (clamp 2 строки), TL;DR (clamp 3 строки), теги-чипы, мета-строка (host, время чтения, дата), три-точки menu (View, Delete).
- **Skeleton loading:** во время `status='pending'` карточка-скелетон с pulse.
- **Empty state:** иллюстрация (можно lucide иконку) + копи «Paste a URL above to get your first brief».
- **Toast:** для всех server-action результатов (success / error).
- **Микро-анимации:** Tailwind transitions, без GSAP. fadeIn карточек через `motion-safe:animate-in`.

---

## 10. Страницы / роуты — что должно быть

| Route | Что делает | Auth |
|-------|------------|------|
| `/` | Landing с hero, 3 фича-блока, CTA «Try briefly». Если залогинен — redirect → `/dashboard`. | public |
| `/login` | Email-форма magic-link. После отправки — экран «Check your inbox». | public |
| `/auth/callback` | Обмен кода на сессию, redirect → `/dashboard`. | public |
| `/dashboard` | Input + grid брифов. Поиск, фильтр по тегам. | protected |
| `/briefs/[id]` | Полная карточка: TL;DR, key points, tags (редактируемые), ссылка на оригинал, дата, кнопка delete. | protected (owner only via RLS) |
| `/settings` | Email юзера, кнопка logout, кнопка «Delete all my data». | protected |

---

## 11. Порядок реализации (по шагам)

Выполнять строго по порядку. После каждого шага — короткий чек: «билд проходит, страница открывается».

1. **Init.** `npx create-next-app@latest briefly-ai --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`. Установить shadcn (`npx shadcn@latest init`).
2. **Env + lint.** Настроить `src/lib/env.ts` (t3-env), добавить prettier-config, проверить `npm run lint`.
3. **Supabase локально/облачно.** Создать проект на supabase.com, прогнать `0001_init.sql` через SQL Editor. Записать ключи в `.env.local`.
4. **Auth каркас.** `src/lib/supabase/{client,server,middleware}.ts` по официальной доке `@supabase/ssr`. Middleware. `/login` + `/auth/callback`. Проверить — magic link реально логинит.
5. **Layout (app).** Sidebar, user-menu, theme-toggle, route-protection.
6. **Dashboard read-only.** Запрос `briefs` через server component, grid + brief-card + empty-state. Пока без создания — вручную вставить тестовые строки в БД.
7. **Extract + Claude.** `lib/extract.ts` (Readability), `lib/anthropic.ts` с tool-use. Отдельный скрипт-проба `scripts/test-summarize.ts` — прогнать на 2-3 реальных URL, удостовериться что JSON валидный.
8. **Create brief.** Server action + API route + form. Pending-скелетон, revalidate. **Тест золотого пути в браузере.**
9. **Brief detail page** `/briefs/[id]`.
10. **Tag editing + search.** Inline-редактор тегов (chips + add-input), search-bar по title/tags на клиенте (если ≤200 брифов — клиентом, иначе full-text через Postgres `tsvector` — **(ASK)** на этом шаге).
11. **Delete brief + delete all data.**
12. **Landing.** Hero + 3 фичи + CTA. Можно сгенерировать через v0-стиль композицию, но без AI-блоков «Built with Next.js».
13. **Polish.** Skeleton states, error boundaries, 404 page, метатеги/OG-image, favicon, README (живой, не этот build-prompt — а нормальный README с инструкцией по запуску).
14. **Deploy.** Vercel + env vars + кастомный домен (если есть) или briefly-ai.vercel.app. Прогнать live smoke-test на 5 URL.
15. **Финал.** Запустить `argus` subagent для финального аудита (Lighthouse, скриншоты). Спросить Стаса, нужен ли code-review.

---

## 12. Что важно (не забыть)

- **TypeScript strict** + `noUncheckedIndexedAccess`. Никаких `any`. Если что-то приходит из внешнего API — zod-парсить.
- **Никаких console.log** в финальном коде. Логирование — через простой `lib/logger.ts` (можно `pino` или просто wrapper над console с env-gate).
- **Все секреты** — только server-side. `ANTHROPIC_API_KEY` и `SUPABASE_SERVICE_ROLE_KEY` ни в коем случае не в client-bundle.
- **RLS обязателен.** Проверить, что неавторизованный запрос к `briefs` возвращает 0 строк.
- **Rate limiting** на создание брифов: max 10/минута/юзер. Простейший вариант — таблица `rate_limits` или Vercel KV. **(ASK)** на шаге 8.
- **Стоимость Claude:** sonnet-4-6 ≈ $3/$15 per 1M tokens. Один бриф ≈ 5k input + 500 output ≈ $0.02. Это ок для портфолио, но в landing-копии не обещать unlimited.
- **README (финальный)** должен содержать: 1) что это, 2) скриншот/GIF, 3) стек с бэйджами, 4) `npm install && npm run dev`, 5) список env vars, 6) ссылку на live, 7) лицензию MIT.
- **GitHub repo:** название `briefly-ai`, description = одна строка, homepage = деплой URL, topics: `nextjs`, `typescript`, `supabase`, `claude-api`, `tailwindcss`, `ai`. Запинить в профиль StasKaidash.

---

## 13. Open questions (спросить перед стартом)

- **(ASK)** Акцентный цвет: violet `#7c3aed` (по умолчанию) или teal `#14b8a6`?
- **(ASK)** Logo / wordmark — сейчас текстовый «briefly» Inter Bold или подобрать иконку?
- **(ASK)** Имя репо `briefly-ai` или `briefly`? Если `briefly` свободно — короче лучше.
- **(ASK)** Использовать Vercel KV для rate-limit или Postgres-таблицу?
- **(ASK)** Полнотекстовый поиск через `tsvector` сразу или клиентский filter в MVP?

---

**Команда для старта:** «Стас сказал начать делать briefly-ai. Прочитай `C:\Users\kayda\WebstormProjects\briefly-ai\README.md` целиком и иди по разделу 11 шагами. Перед стартом задай вопросы из раздела 13.»
