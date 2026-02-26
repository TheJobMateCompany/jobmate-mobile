# 🚀 JobMate - Le Copilote de Carrière propulsé par l'IA

> **"Passer d'une productivité manuelle de 2 candidatures par jour à 10 candidatures de haute précision, tout en contournant les barrières des ATS."**

JobMate est un assistant de recherche d’emploi intelligent conçu pour rééquilibrer le rapport de force entre les candidats et les algorithmes de recrutement. Contrairement aux outils d'automatisation aveugle (spamming), JobMate privilégie **la qualité à l'échelle industrielle** grâce à une approche centrée sur le coaching stratégique et l'hyper-personnalisation.

---

## 🛑 Le Constat : Un marché saturé et impitoyable

Aujourd'hui, les candidats sont piégés dans un dilemme :
1. **L'approche "Mass Market" :** Envoyer 100 CVs génériques. *Résultat : Rejet quasi-systématique (>95%) par les ATS (Applicant Tracking Systems).*
2. **L'approche "Artisanale" :** Passer 1h par offre pour tout personnaliser. *Résultat : Burnout rapide, perte de motivation et faible volume.*

À cela s'ajoutent une barrière technologique opaque, une charge cognitive colossale (décoder le jargon des offres) et un chaos organisationnel dans le suivi des candidatures.

---

## 💡 La Solution JobMate (Les 3 Piliers)

JobMate est une plateforme (Web & Mobile) qui agit comme un "Assistant de Poche", orchestré autour de trois piliers fondamentaux :

* 🎯 **Ciblage Intelligent (Smart Matching) :** Agrégation des offres pertinentes avec calcul d'un Score de Match instantané basé sur l'ADN du candidat et ses "Red Flags" (critères d'exclusion stricts).
* ✍️ **Hyper-Personnalisation Assistée (ATS Optimizer) :** Analyse IA des mots-clés de l'offre pour générer des suggestions de reformulation de CV et des lettres de motivation sur-mesure en quelques secondes. L'humain garde toujours le contrôle final.
* 📊 **Pilotage Centralisé (Career CRM) :** Un tableau de bord Kanban intuitif pour suivre l'état de chaque candidature, avec des suggestions d'actions proactives (relances, préparation d'entretien).

---

## 🛠️ Stack Technique Globale

L'architecture est pensée pour être robuste, asynchrone et optimisée en termes de coûts (hébergement sur VPS unique avec déploiement serverless pour le frontend).

* **Frontend Web :** React / Next.js (Déployé sur Vercel/Netlify)
* **Frontend Mobile :** React Native / Expo (iOS & Android)
* **Backend (Microservices) :** Node.js (API Gateway, GraphQL, SSE, gRPC clients), Python (AI Coach, CV Parsing, Discovery/Scraper), Go (Tracker gRPC server)
* **Communication interne (Service-to-Service) :** gRPC (Gateway → Profile Service port 9081, Gateway → Discovery Service port 9083 & Gateway → Tracker port 9082) + Redis Pub/Sub (Gateway → AI Coach)
* **Bases de Données & Cache :** PostgreSQL, Redis (Pub/Sub)
* **Infrastructure & DevOps :** Docker Compose, Traefik (TLS), GitHub Actions (CI/CD + protoc validation)

---

## 📂 Documentation du Projet

Pour plonger plus en détail dans le fonctionnement et la conception de JobMate, veuillez consulter les documents suivants :

1. [📖 Exemple de Parcours Utilisateur (User Flow)](./USER_FLOW_EXAMPLE.md) : Comprendre l'expérience pas à pas, de l'inscription à l'embauche.
2. [🏗️ Architecture Technique](./ARCHITECTURE_TECHNIQUE.md) : Détail des microservices, de la base de données et des communications internes.
3. [⚙️ Infrastructure & CI/CD](./INFRASTRUCTURE_CI_CD.md) : Architecture réseau, configuration Docker et pipelines de déploiement continu.

---
