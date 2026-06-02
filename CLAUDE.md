# CLAUDE.md — Projet Lido (Vision V1)

> Fichier lu automatiquement par Claude Code à chaque session.
> Source de vérité du projet : produit, vocabulaire métier, stack, données, conventions.
> Tenir à jour.
>
> ⚙️ Note technique : voir aussi `AGENTS.md` — cette version de Next.js comporte
> des changements récents ; consulter `node_modules/next/dist/docs/` avant de coder.

---

## 1. Produit

**Lido** n'est pas un simple CRM. C'est une plateforme **hybride CRM + ERP** pour les entreprises
de filtration et de traitement de l'eau :

- un **CRM métier** côté Aqualistes (prospection, vente, suivi client) ;
- un **ERP opérationnel** côté dirigeants (pilotage, facturation, stock, rentabilité, maintenance).

Objectif : remplacer progressivement Excel, Dropbox, agendas dispersés, notes papier, suivi manuel
des entretiens, gestion manuelle des commissions et des stocks, et une partie de la facturation —
par une plateforme unique.

> **Note d'architecture à confirmer :** Lido est conçu d'abord pour **Eauriginelle** (entreprise de
> référence et premier client). La base est néanmoins **multi-tenant** (isolation par
> `organization_id`) pour pouvoir être revendue à d'autres entreprises du secteur ensuite.

---

## 2. Vocabulaire métier (à respecter dans le code et l'UI)

- **Eauriginelle** : l'entreprise qui exploite Lido (le tenant principal).
- **Aqualiste** : l'utilisateur terrain. Deux profils :
  - **Aqualiste commercial** : reçoit des leads, les transforme en clients, vend.
  - **Aqualiste technico-commercial** : vend + installe + entretient + fidélise.
- **Dirigeant** : pilote l'activité d'Eauriginelle.
- **Lead** : contact non qualifié.
- **Opportunité** : lead qualifié (avec montant, probabilité, échéance).

---

## 3. Utilisateurs et besoins

- **Aqualiste commercial** : pipeline performant, relances, opportunités, objectifs, prévisions de revenus.
- **Aqualiste technico-commercial** : portefeuille client, historique technique, planning des entretiens,
  gestion des stocks, comptes-rendus d'intervention, calcul auto des revenus et commissions.
- **Dirigeant** : vision temps réel (CA, marges, stocks, performance des Aqualistes, entretiens à venir,
  prévisions de CA).

---

## 4. Principe fondamental (avantage concurrentiel #1)

**Une information n'est saisie qu'une seule fois.** Toute la chaîne s'enchaîne sans ressaisie manuelle :

```
Lead → Opportunité → Client → Installation → Entretien → Consommation de stock → Facturation → Reporting dirigeant
```

Chaque étape alimente automatiquement la suivante. C'est le coeur du produit : tout ce qui est construit
doit servir ce flux automatisé.

---

## 5. Stack technique (à respecter sauf indication contraire)

- **Framework** : Next.js (App Router) + TypeScript strict.
- **UI** : Tailwind CSS + shadcn/ui + Radix. Animations subtiles via Framer Motion.
- **Backend / DB** : Supabase — PostgreSQL, Auth, Storage (photos, documents), Realtime, Edge Functions.
- **Multi-tenant + sécurité** : Row Level Security (RLS) sur toutes les tables, isolation par `organization_id`.
- **Cartographie** : Mapbox GL JS (markers, filtres, distinction B2B/B2C, tournées).
- **PDF** : génération devis / factures côté serveur.
- **Signature électronique** : capture canvas stockée dans Supabase Storage (V1).
- **Facturation / paiement** : structure compatible Stripe pour la suite.
- **Mobile Aqualiste** : PWA installable d'abord (réutilise le code web).
- **Déploiement** : Vercel (front) + Supabase (back).

> ⚠️ État actuel (à régulariser) : pour aller vite en démo, le projet est déployé en **export
> statique sur GitHub Pages** avec appels Supabase côté navigateur et **sans Auth ni RLS par
> organisation**. À aligner sur cette section (Vercel + Auth + RLS multi-tenant) dès l'étape sécurité.

---

## 6. Design system

Inspirations : Attio (fiches épurées, espaces blancs), Linear (rapidité, fluidité), Notion (bases de
données élégantes, vues multiples), HubSpot/Pipedrive (CRM lisible), Stripe/Apple (simplicité,
animations subtiles, sensation premium). **Pas un ERP années 2000.**

Palette (tokens Tailwind) : bleu profond (primaire), blanc (fond), gris clair (surfaces/bordures),
turquoise (accent). Sensation : fiabilité, technologie, pureté, eau, professionnalisme.

---

## 7. Modèle de données (Postgres / Supabase)

Toutes les tables sont liées à `organization_id` (multi-tenant) avec RLS.

- `organizations`, `users` (rôle : `aqualiste_commercial`, `aqualiste_technico_commercial`, `dirigeant`)
- `leads` : nom, téléphone, email, adresse, source, notes, segment (`b2b` / `b2c`), statut.
  Actions : appeler, mailer, RDV, tâche, **convertir en opportunité**.
- `opportunities` : montant estimé, probabilité de signature, date prévisionnelle, responsable,
  étape de pipeline.
- `clients` : champs communs + selon segment :
  - **B2C** : nom, prénom, téléphone, type d'habitation, composition du foyer.
  - **B2B** : société, SIRET, secteur, interlocuteurs, sites.
- `contacts` (interlocuteurs B2B)
- `installations` / `equipment` : modèle, numéro de série, date d'installation, garantie,
  **date du prochain entretien (calculée automatiquement)**.
- `maintenances` (entretiens) : échéance auto à l'installation, statut (à venir / fait / en retard).
- `interventions` (comptes-rendus) : date, durée, commentaire, photos, signature client,
  **pièces utilisées**, statut validé.
- `documents` : devis, contrats, photos, analyses d'eau, docs techniques (rattachés à lead/opportunité/client).
- `stock_items` + `stock_movements` : filtres, membranes, cartouches. Décrément automatique à
  chaque intervention validée ; alertes stock faible / rupture / réappro.
- `internal_invoices` + `invoice_lines` : facturation **Aqualiste → Eauriginelle** (voir bloc 5).
- `commissions` : calcul automatique par Aqualiste.
- `activities` : timeline unifiée (appels, emails, RDV, notes, documents, ventes, entretiens, factures).

---

## 8. Modules à construire

1. **CRM commercial**
   - **Leads** : contact non qualifié ; actions appeler / mailer / RDV / tâche / convertir.
   - **Opportunités** : pipeline → Nouveau · Qualification · Rendez-vous · Audit · Devis envoyé ·
     Négociation · Signé · Perdu (drag & drop, vue très visuelle).
   - **Gestion documentaire** par opportunité.
   - **Historique complet** centralisé.
2. **Gestion client** : fiche unique (coordonnées, type, historique), produits installés (modèle,
   n° série, date, garantie), historique (ventes, entretiens, dépannages, factures, photos).
3. **Gestion des entretiens** : chaque installation génère automatiquement le prochain entretien et sa
   date d'échéance (ex. install mai 2025 → entretien mai 2026). Dashboard Aqualiste : aujourd'hui /
   semaine / mois / **retards**. Objectif : aucun entretien oublié.
4. **Comptes-rendus d'intervention** : date, durée, commentaire, photos, signature client, pièces
   utilisées, puis validation.
5. **Facturation interne automatique** : chaque intervention validée crée une ligne de facturation ;
   en fin de mois, Lido génère automatiquement la facture **Aqualiste → Eauriginelle**. (Supprime la
   ressaisie manuelle des entretiens et la facture refaite à la main.)
6. **Prévision de revenus** (Aqualiste) : trois vues — **Gagné** (signé), **Prévu** (probable),
   **Potentiel** (pipeline ouvert). Objectif : un CRM motivant qui pousse à vendre.
7. **Gestion des stocks** : à chaque entretien, l'Aqualiste indique filtre / membrane / cartouche
   utilisés → stock mis à jour automatiquement. Alertes stock faible / rupture / réappro. (À détailler.)
8. **Segmentation B2B / B2C** : choisie dès la création du lead. Différenciation visuelle immédiate
   partout : leads, opportunités, clients, cartographie, reporting.
9. **ERP dirigeant** — dashboard direction temps réel :
   - **Commercial** : leads entrants, opportunités, taux de conversion, CA signé.
   - **Opérationnel** : entretiens à venir / réalisés / retards.
   - **Ressources** : stocks, pièces consommées.
   - **Financier** : factures générées, commissions dues, rentabilité.
   - **RH** : activité par Aqualiste (RDV, interventions, ventes).

---

## 9. Approche de développement (MVP par incréments livrables)

1. Auth + multi-tenant + RLS + schéma de base de données complet.
2. Leads (avec B2B/B2C) + conversion en opportunité.
3. Opportunités + pipeline drag & drop + documents.
4. Fiche client + produits installés + historique/timeline.
5. Entretiens auto + dashboard Aqualiste (échéances/retards).
6. Comptes-rendus d'intervention + signature + pièces utilisées.
7. Stock (décrément auto + alertes).
8. Facturation interne automatique + commissions.
9. Prévision de revenus.
10. Dashboard / ERP dirigeant.
11. Cartographie commerciale.

À chaque étape : code typé, RLS testée, écran réellement fonctionnel avant de passer au suivant.

---

## 10. Conventions

- TypeScript strict, pas de `any` non justifié.
- Composants UI réutilisables dans `components/ui` (shadcn).
- Toute requête DB via fonctions typées ; jamais de SQL brut côté client.
- RLS obligatoire sur chaque nouvelle table.
- Respecter le vocabulaire métier (Aqualiste, Eauriginelle, lead vs opportunité, segment B2B/B2C).
- Commits clairs et atomiques.
- Proposer avant d'installer une dépendance lourde.
- Demander avant toute action destructive (drop, reset DB, suppression de fichiers).
