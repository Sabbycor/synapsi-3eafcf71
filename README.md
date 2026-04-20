# 🧠 Synapsi

**Synapsi** nasce dall'esigenza di evolvere. Il progetto rappresenta il salto tecnologico di una soluzione core precedentemente commissionata su **Microsoft Access**, oggi trasformata in una piattaforma SaaS cloud-native all'avanguardia. Il sistema automatizza la gestione clinica, il monitoraggio dei pazienti a rischio abbandono e la fatturazione, integrando un assistente AI per supportare il professionista nella comunicazione quotidiana.

🔗 **Live Demo**: [https://mental-ease-ops.lovable.app/](https://mental-ease-ops.lovable.app/)

---



## 🚀 Caratteristiche Principali

### 📊 Dashboard Clinica
Un pannello di controllo completo per monitorare appuntamenti, ricavi previsti e statistiche della settimana in tempo reale.

### 🤖 AI-Driven Patient Engagement
- **Rilevamento Pazienti a Rischio**: Algoritmo proprietario che identifica i pazienti che non hanno prenotato sedute da oltre 21 giorni.
- **Suggerimenti Messaggi IA**: Generazione di messaggi empatici e professionali tramite **OpenRouter AI** per riallacciare il contatto con i pazienti.

### 📅 Gestione Appuntamenti e Pazienti
Anagrafiche complete, storico sedute e tracciamento dello stato dei contatti.

### 🔑 Autenticazione Passwordless
Accesso sicuro e rapido tramite **Magic Links** (invio email gestito tramite **Brevo SMTP**), eliminando la necessità di gestire password complesse.

### 💳 Fatturazione e Abbonamenti
Integrazione nativa con **Stripe** per la gestione del piano Premium, checkout sicuro e portale clienti dedicato.

### 📝 Weekly Briefing
Ogni lunedì, il sistema genera un riassunto strategico della settimana tramite intelligenza artificiale, analizzando l'agenda e le priorità amministrative.

---

## 🛠 Tech Stack

- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Linguaggio**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Analytics**: [PostHog](https://posthog.com/)
- **Email Service**: [Brevo](https://www.brevo.com/) (SMTP per Magic Links)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Backend Logic**: [Supabase Edge Functions](https://supabase.com/docs/guides/functions) (Deno)
- **AI Service**: [OpenRouter](https://openrouter.ai/)
- **Pagamenti**: [Stripe API](https://stripe.com/)

---

## 📁 Struttura del Progetto

```text
├── src/
│   ├── components/       # Componenti UI (Shadcn + Custom)
│   ├── hooks/            # Logica di stato e chiamate API (React Query)
│   ├── integrations/     # Configurazione Supabase Client
│   ├── pages/            # View principali dell'applicazione
│   └── lib/              # Utility e helper
├── supabase/
│   ├── functions/        # Edge Functions (Node/Deno)
│   │   ├── at-risk-patients    # Analisi AI pazienti
│   │   ├── weekly-briefing     # Report settimanale AI
│   │   └── stripe-webhook      # Gestione eventi pagamenti
│   └── config.toml       # Configurazione gateway e JWT
└── README.md
```

---

> [!NOTE]
> **Eredità del Progetto**: I file relativi alla soluzione originale basata su Microsoft Access sono conservati nella directory `/access_db` per consultazione e confronto storico.

---

## ⚙️ Configurazione Ambiente

Per far girare il progetto localmente o in produzione, sono necessarie le seguenti variabili d'ambiente nel file `.env`:

```env
VITE_SUPABASE_URL=tuo_url_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=tua_anon_key
VITE_PUBLIC_POSTHOG_HOST=tuo_host_posthog
VITE_PUBLIC_POSTHOG_KEY=tua_key_posthog
OPENROUTER_API_KEY=tua_chiave_openrouter
STRIPE_SECRET_KEY=tua_chiave_segreta_stripe
```

---

## 🛠 Installazione e Sviluppo

1. **Clona il repository**:
```bash
git clone https://github.com/tuo-username/synapsi.git
```

2. **Installa le dipendenze**:
```bash
npm install
```

3. **Lancia l'ambiente di sviluppo**:
```bash
npm run dev
```

4. **Deploy delle funzioni Supabase**:
```bash
npx supabase functions deploy --all
```

---

## 🗺 Roadmap

- [x] Monitoraggio Pazienti a Rischio
- [x] Integrazione AI Coach (OpenRouter)
- [x] Gestione Abbonamenti Stripe
- [ ] **Prossima Funzionalità**: Implementazione Cartella Clinica Elettronica (EHR) con crittografia end-to-end per la massima privacy dei dati sensibili.
Il progetto è WIP

---

## 📄 Licenza

Questo progetto è distribuito sotto licenza **MIT**. Consulta il file `LICENSE` per ulteriori dettagli.

