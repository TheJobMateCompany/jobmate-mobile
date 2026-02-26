# ⚙️ Infrastructure & CI/CD - JobMate

Ce document décrit l'infrastructure d'hébergement et les pipelines de déploiement continu (CI/CD) de JobMate. L'objectif est de maximiser la valeur et la fiabilité tout en minimisant les coûts, en s'appuyant sur une architecture "Single VPS" optimisée et des outils Open Source / Free Tier.

---

## 1. Topologie de l'Infrastructure (Approche Hybride)

Pour optimiser les ressources du serveur (VPS 8 Go RAM) et garantir des temps de réponse rapides aux utilisateurs, l'hébergement est scindé en deux zones distinctes :

* **Zone Serveur (Backend & Data) :** Hébergée sur un VPS Hostinger unique, orchestrée par Docker Compose.
* **Zone Edge (Frontend Web) :** Hébergée sur un réseau CDN Serverless (Vercel, Netlify ou Cloudflare Pages) pour un déploiement gratuit, instantané et une charge nulle sur le VPS.

---

## 2. Architecture du Serveur VPS (Docker Compose)

Tout le backend fonctionne dans des conteneurs isolés sur le VPS, gérés par un fichier `docker-compose.prod.yml`.

### Composants Réseau & Routage
* **Traefik (Reverse Proxy) :** Le seul point d'entrée exposé à internet (Ports 80 et 443). Il analyse le trafic entrant, génère et renouvelle automatiquement les certificats SSL via Let's Encrypt, et route les requêtes vers l'API Gateway.
* **Réseaux Docker (Networks) :**
    * `web_network` : Connecte Traefik à l'API Gateway.
    * `internal_network` : Isole les bases de données (PostgreSQL, Redis) et les workers (AI Coach, Discovery). Ils sont invisibles depuis l'extérieur.

### Gestion des Ressources & Résilience (Garde-fous)
Pour éviter qu'un traitement IA lourd (Python/NLP) ne consomme toute la RAM et ne fasse crasher la base de données, des limites strictes sont configurées dans Docker Compose :
* **AI Coach (Python) :** Limité à ex: 2 Go de RAM. En cas de dépassement (fuite mémoire), Docker redémarre uniquement ce conteneur (`OOMKilled`) de manière transparente.
* **PostgreSQL & Redis :** Ressources garanties et volumes persistants (Docker Volumes) sauvegardés régulièrement.

---

## 3. Stratégie des Repositories

L'approche choisie est le **Multi-Repo**, ce qui permet de découpler les cycles de release :

1.  **`jobmate-backend`** : Contient l'API Node.js, les workers (Python, Go), et toute l'infrastructure (fichiers Docker, init SQL).
2.  **`jobmate-web`** : Application front-end (React/Next.js).
3.  **`jobmate-mobile`** : Application mobile (React Native/Expo).

---

## 4. Pipelines de Déploiement Continu (CI/CD)

L'automatisation est gérée par **GitHub Actions** pour un déploiement "Zero-Touch" une fois le code fusionné sur la branche principale.

### A. Pipeline Backend (`jobmate-backend`)
*Déclencheur : Push sur la branche `main`.*

1.  **Validation Proto :** `protoc` vérifie la syntaxe des fichiers `proto/tracker.proto`, `proto/user.proto` et `proto/discovery.proto` à chaque push. Garantit que les contrats gRPC restent valides sans avoir à générer les stubs en CI (les stubs Go sont versionnés directement dans le code).
2.  **Test & Lint :** Exécution des tests automatisés et des linters sur les microservices modifiés :
    * **Node.js** (Gateway) — ESLint + Vitest.
    * **Python** (profile-service, discovery-service, ai-coach-service) — Ruff (lint) + Pytest.
    * **Go** (tracker-service) — `golangci-lint` + `go test ./...`.
3.  **Build & Push (matrix) :** Construction des images Docker pour les 5 services (`gateway`, `profile-service`, `discovery-service`, `ai-coach-service`, `tracker-service`) et envoi vers le **GitHub Container Registry (GHCR)** (sécurisé et gratuit).
4.  **Déploiement VPS (via SSH) :**
    * L'Action GitHub se connecte en toute sécurité au VPS Hostinger via une clé SSH secrète.
    * Elle met à jour le fichier `docker-compose.prod.yml` si nécessaire.
    * Exécute `docker compose pull` pour télécharger les nouvelles images depuis GHCR.
    * Exécute `docker compose up -d` pour recréer uniquement les conteneurs mis à jour (temps d'arrêt quasi nul).
    * *Commande de nettoyage :* `docker image prune -f` pour libérer l'espace disque sur le VPS.

### B. Pipeline Frontend Web (`jobmate-web`)
*Déclencheur : Push sur la branche `main`.*

* Intégration native avec Vercel/Netlify. Le pipeline construit l'application statique et la déploie sur le CDN mondial en quelques secondes.

### C. Pipeline Frontend Mobile (`jobmate-mobile`)
*Déclencheur : Création d'une release ou tag.*

* Utilisation de services comme EAS (Expo Application Services) ou Fastlane pour compiler les binaires (`.apk`, `.aab`, `.ipa`) et les soumettre automatiquement aux plateformes de test (TestFlight / Google Play Internal Track).

#### Implémentation actuelle (GitHub Actions + EAS)

Le repository `jobmate-mobile` inclut un workflow dédié : `.github/workflows/mobile-eas-build.yml`.

**Déclencheurs :**
* `workflow_dispatch` (manuel) avec choix `platform` (`all|android|ios`) et `profile` (`preview|production`).
* `push` sur un tag `mobile-v*` (build `production` sur les deux plateformes).

**Pré-requis GitHub Secrets :**
* `EXPO_TOKEN` : token Expo (compte/service account ayant accès au projet EAS).

**Configuration mobile :**
* `jobmate-mobile/eas.json` contient les profils de build `preview` et `production`.

> Recommandé : stocker les secrets applicatifs natifs (si nécessaire) via `eas secret:create` côté projet Expo, pas dans GitHub.

---

## 5. Arborescence Cible (Infrastructure)

Voici comment les fichiers liés à l'infrastructure sont organisés dans le repository `jobmate-backend` :

```text
jobmate-backend/
├── .github/
│   └── workflows/
│       └── deploy-vps.yml        # Pipeline GitHub Actions
├── infra/
│   ├── traefik/
│   │   └── traefik.yml           # Configuration du Reverse Proxy
│   └── postgres/
│       └── init.sql              # Script d'initialisation de la DB
├── docker-compose.yml            # Orchestration locale (Dev)
├── docker-compose.prod.yml       # Orchestration VPS (Prod avec limites et SSL)
├── .env.example                  # Modèle des variables d'environnement
└── ... (dossiers des microservices)