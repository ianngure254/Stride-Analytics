weza/
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── public/
│   ├── placeholder.svg
│   └── robots.txt
└── src/
    ├── main.tsx
    ├── App.tsx                    # Routes
    ├── App.css
    ├── index.css                  # Design tokens (green/gold)
    ├── vite-env.d.ts
    │
    ├── pages/
    │   ├── Index.tsx              # Landing page
    │   ├── Dashboard.tsx          # Revenue, M-Pesa vs Cash, AI summary
    │   ├── Sales.tsx              # Transactions + New Sale dialog
    │   ├── Inventory.tsx          # Stock + low-stock alerts
    │   ├── Customers.tsx          # Deni / credit tracking
    │   └|-Google Auth + Admin
    │
    ├── components/
    │   ├── DashboardLayout.tsx    # Shell: sidebar + main + AI + modal
    │   ├── AppSidebar.tsx         # Desktop nav
    │   ├── MobileNav.tsx          # Bottom nav (mobile)
    │   ├── NavLink.tsx
    │   |
    │   |
    │   |
    │   └── ui/                    # shadcn components (button, card, dialog…)
    │
    ├── data/
    │   └── mockData.ts            # Products, customers, sales, AI replies
    │
    ├── hooks/
    │   ├── use-mobile.tsx
    │   └── use-toast.ts
    │
    ├── lib/
    │   └── utils.ts              
    │
    └── test/
        ├── setup.ts
        └── example.test.ts