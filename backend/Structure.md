apps/api/
├── src/
│   ├── app.ts                  # express config
│   ├── server.ts               # entry point
│
│   ├── config/
│   │   ├── env.ts
│   │   ├── db.ts
│   │   ├── firebase.ts
│   │   └── logger.ts
│
│   ├── modules/                # DOMAIN MODULES
│   │
│   │   ├── auth/
│   │   ├── business/
│   │   ├── users/
│   │   ├── products/
│   │   ├── sales/
│   │   ├── payments/
│   │   ├── customers/
│   │   ├── credit/
│   │   ├── inventory/
│   │   ├── reports/
│   │   └── billing/            # ⭐ plans + subscriptions
│
│   │       # EACH MODULE STRUCTURE
│   │       └── products/
│   │           ├── product.model.ts
│   │           ├── product.service.ts
│   │           ├── product.controller.ts
│   │           ├── product.routes.ts
│   │           └── product.validation.ts
│
│   ├── agent/                  # ⭐ CORE ENGINE
│   │   ├── agent.controller.ts
│   │   ├── agent.service.ts
│   │   ├── agent.prompt.ts
│   │   │
│   │   ├── tools/              # AI ACTIONS
│   │   │   ├── sales.tool.ts
│   │   │   ├── credit.tool.ts
│   │   │   ├── inventory.tool.ts
│   │   │   ├── payments.tool.ts
│   │   │   └── quotation.tool.ts
│   │   │
│   │   ├── executor/
│   │   │   └── toolExecutor.ts
│   │   │
│   │   └── types/
│   │       └── agent.types.ts
│
│   ├── integrations/
│   │
│   │   ├── ai/
│   │   │   ├── openai.client.ts
│   │   │   └── anthropic.client.ts
│   │   │
│   │   ├── mpesa/
│   │   │   ├── daraja.client.ts
│   │   │   ├── stkPush.ts
│   │   │   ├── callback.handler.ts
│   │   │   └── reconciliation.ts
│   │   │
│   │   └── sms/
│   │       └── africastalking.client.ts
│
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── plan.middleware.ts   # ⭐ enforce paywall
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│
│   ├── jobs/
│   │   ├── dailySummary.job.ts
│   │   ├── creditReminder.job.ts
│   │   └── stockAlert.job.ts
│
│   ├── routes/
│   │   └── index.ts
│
│   ├── utils/
│   │   ├── currency.ts
│   │   ├── ids.ts
│   │   └── logger.ts
│
│   └── types/
│
├── drizzle/ or prisma/
├── tsconfig.json
└── package.json