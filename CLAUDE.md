# CLAUDE.md — Projet Lido

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il décrit le produit, la stack, le design system et les conventions.
> Garde-le à jour : c'est la source de vérité du projet.
>
> ⚙️ Note technique : voir aussi `AGENTS.md` — cette version de Next.js comporte
> des changements récents ; consulter `node_modules/next/dist/docs/` avant de coder.

---

## 1. Produit

**Lido** = le système d'exploitation des entreprises de filtration et de traitement de l'eau
(osmose inverse, fontaines à eau, adoucisseurs, filtration professionnelle, maintenance/installation).

Objectif : remplacer Excel, Drive/Dropbox, agenda, emails, téléphone et les outils de facturation
séparés par **une seule plateforme**.

Modules réunis : CRM · prospection · gestion clients · interventions techniques ·
contrats d'entretien · facturation · cartographie · assistant IA.

Exigence transverse : produit **premium, moderne, fluide**. Pas un ERP années 2000.

---

## 2. Utilisateurs et besoins

- **Dirigeant** : vision globale, CA, contrats, rentabilité, activité commerciale et technique.
- **Commercial** : prospection, carte du secteur, pipeline, relances, devis, signature électronique.
- **Technicien** : planning, fiche client, historique d'interventions, photos, signature client, rapports.

---

## 3. Stack technique (à respecter sauf indication contraire)

- **Framework** : Next.js (App Router) + TypeScript en mode strict.
- **UI** : Tailwind CSS + shadcn/ui + Radix. Animations : Framer Motion (subtiles).
- **Backend / DB** : Supabase — PostgreSQL, Auth, Storage (photos), Realtime, Edge Functions.
- **Sécurité données** : Row Level Security (RLS) activée sur toutes les tables, multi-tenant
  isolé par `organization_id`.
- **Cartographie** : Mapbox GL JS (markers clusterisés, filtres, tracé de tournée).
- **PDF** : génération devis/factures côté serveur (react-pdf ou équivalent).
- **Signature électronique** : capture canvas stockée dans Supabase Storage (V1), prestataire
  certifié plus tard.
- **Paiement / facturation** : structure compatible Stripe pour la suite.
- **Mobile technicien** : PWA installable d'abord (réutilise le code web), Expo/React Native si besoin natif.
- **Déploiement** : Vercel (front) + Supabase (back).

---

## 4. Design system

Inspirations : Attio (fiches épurées, espaces blancs), Linear (rapidité, réactivité),
Notion (bases de données élégantes, vues multiples), HubSpot (CRM lisible), Apple/Stripe
(simplicité, animations subtiles, sensation premium).

Principes : minimalisme, beaucoup de blanc, navigation simple, interface ultra-réactive,
micro-animations discrètes.

Palette (à inscrire en tokens Tailwind) :

- Bleu profond (couleur primaire)
- Blanc (fond principal)
- Gris clair (surfaces, bordures)
- Turquoise (accent, états actifs)

Sensation à transmettre : fiabilité, technologie, pureté, eau, professionnalisme.

---

## 5. Modèle de données (entités principales)

À implémenter en Postgres/Supabase, toutes liées à `organization_id` (multi-tenant) :

- `organizations`, `users` (rôles : dirigeant, commercial, technicien)
- `clients` (identité, adresse géocodée, statut : prospect / client / à renouveler)
- `contacts` (rattachés à un client)
- `opportunities` (pipeline : étape, montant, propriétaire)
- `quotes` (devis : lignes catalogue, TVA, marge, remise, statut, PDF, signature)
- `invoices` + `payments` + `credit_notes` (facturation, relances)
- `contracts` (contrats d'entretien : dates, échéance, alertes)
- `equipment` (parc installé : n° série, référence, date install, photos, lié au client)
- `interventions` (planning, type, durée, technicien, checklist, photos, signature, rapport)
- `catalog_items` (machines, filtres, consommables, main d'œuvre)
- `activities` (timeline unifiée : appels, emails, devis, signatures, installs, interventions, factures)
- `health_scores` (score 0-100 par client, calculé)

---

## 6. Écrans (modules) à construire

1. **Dashboard** (façon Stripe) — CA du mois, contrats actifs, contrats à renouveler,
   interventions du jour, devis en attente, clients actifs + graphiques CA / contrats / activité.
2. **Carte commerciale** (Mapbox) — markers : 🟢 clients, 🔴 prospects, 🟠 à renouveler,
   ⚫ interventions urgentes. Filtres par type d'établissement. Construction de tournée.
3. **Pipeline commercial** (façon Pipedrive) — colonnes Nouveau → Contacté → RDV → Devis →
   Négociation → Gagné / Perdu, en drag & drop.
4. **Fiche client** — onglets Identité / Commercial / Technique / Financier.
5. **Timeline client** (façon Attio) — une chronologie unique de toutes les activités.
6. **Parc installé** — vue tableau moderne, fiche équipement détaillée.
7. **Planning technicien** (façon Google Calendar) — vues jour/semaine/mois.
8. **Intervention mobile** — tournée, scan QR, photos, checklist, signature client (< 60 s).
9. **Contrats d'entretien** — alertes à 90/60/30 jours, code couleur vert/orange/rouge.
10. **Générateur de devis** — catalogue intégré, calcul auto TVA/marge/remise, export PDF, signature.
11. **Facturation** (façon Pennylane) — factures, avoirs, relances, paiements.
12. **Assistant IA** — questions en langage naturel sur les données, résumés, comptes rendus,
    création de tâches, préparation des relances.

### Fonctionnalités premium (après le MVP)
- **Score santé client** (0-100 : ancienneté, paiements, consommation, maintenance) pour prédire le churn.
- **Carte thermique** : zones sous-exploitées / saturées / à potentiel.
- **Automatisations** : devis signé → crée le contrat → crée l'installation → prévient le technicien → génère la facture.

---

## 7. Approche de développement

Construire **par incréments livrables**, pas tout d'un coup. Ordre suggéré du MVP :

1. Auth + multi-tenant + RLS + schéma de base de données.
2. Clients + fiche client + timeline.
3. Pipeline commercial.
4. Devis + catalogue + PDF.
5. Contrats + alertes.
6. Planning + interventions + signature.
7. Dashboard.
8. Carte commerciale.
9. Facturation.
10. Assistant IA, puis fonctionnalités premium.

À chaque étape : code typé, composants réutilisables, RLS testée, et un écran réellement
fonctionnel avant de passer au suivant.

---

## 8. Conventions

- TypeScript strict, pas de `any` non justifié.
- Composants UI réutilisables dans `components/ui` (shadcn).
- Toute requête DB passe par des fonctions typées ; jamais de SQL brut côté client.
- RLS obligatoire sur chaque nouvelle table.
- Commits clairs et atomiques.
- Avant d'installer une dépendance lourde, proposer l'option et attendre validation.
- Demander avant toute action destructive (drop, reset DB, suppression de fichiers).
