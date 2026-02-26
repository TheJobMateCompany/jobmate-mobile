# 🗺️ Parcours Utilisateur (User Flow) - JobMate

Ce document détaille l'expérience pas à pas d'un candidat utilisant JobMate, de son inscription jusqu'à la signature de son contrat. Le parcours est pensé pour minimiser la charge mentale tout en maximisant l'impact de chaque candidature.



---

## 1. Onboarding & Création du Dossier Candidat

L'objectif de cette phase est de constituer une base de données personnelle riche, qui servira de contexte à l'IA pour toutes les futures candidatures.

* **Authentification :** Création de compte classique (Email / Mot de passe).
* **Remplissage du Profil (Automatisé ou Manuel) :** * *Informations de base :* Nom, prénom, statut professionnel (Étudiant, Jeune Diplômé, Senior, etc.).
    * *Importation intelligente :* L'utilisateur peut uploader son CV (PDF) ou importer son profil LinkedIn. L'IA extrait automatiquement les données pour pré-remplir les champs.
    * *Éléments du profil :* Compétences (Hard & Soft skills), Éducation, Expériences professionnelles, Projets pertinents, Certifications.
    * *Flexibilité :* Toutes ces informations restent modifiables manuellement à tout moment depuis les paramètres.

---

## 2. Configuration du "Chasseur" (Recherche d'emploi)

L'utilisateur ne scrolle plus à l'infini sur les job boards. Il configure une "Recherche" qui va travailler pour lui en arrière-plan.

* **Critères de base :** Type d’emploi, mode de travail (Remote, Hybride, Présentiel), prétentions salariales, date de disponibilité, durée de la mission, localisation cible.
* **Ciblage par Mots-clés :** * *Mots-clés recherchés :* Secteur d'activité, technologies spécifiques (ex: "React", "Python"), intitulé du poste.
* **Le Bouclier Anti-Perte de Temps (Red Flags) :** L'utilisateur définit des mots-clés éliminatoires (ex: "ESN", "Déplacement fréquent", "Stage"). Dès que l'algorithme repère un Red Flag, l'offre est silencieusement ignorée.
* **Modèle de Lettre (Optionnel) :** Ajout d'une lettre de motivation "template" qui servira de base de style et de ton pour l'IA générative.

---

## 3. Le Tri Quotidien (L'Inbox des Opportunités)

C'est ici que JobMate remplace la recherche active par une curation intelligente.

* **La File d'attente (Pending) :** Chaque jour, de nouvelles offres correspondant aux critères (et ayant survécu aux Red Flags) apparaissent dans le tableau de bord.
* **L'Action de Tri (Tinder de l'emploi) :** L'utilisateur examine rapidement les offres.
    * *Rejeter :* L'offre disparaît.
    * *Approuver :* L'offre passe à l'étape d'enrichissement IA.
* **L'Ajout Manuel (Bypass) :** Si l'utilisateur trouve une offre intéressante ailleurs, il peut coller l'URL ou remplir un formulaire rapide (Nom de l'entreprise, description, attentes, etc.). Ces offres arrivent dans l'inbox avec le statut `PENDING` et sont triées exactement comme les offres scrapées automatiquement — l'utilisateur les approuve ou les rejette dans la même file d'attente.

---

## 4. L'Enrichissement IA (La Magie JobMate)

Une fois une offre approuvée, l'IA (le "Copilote") se met au travail pour préparer une candidature de haute précision.

* **Analyse de Compatibilité :** * Génération d'un **Score de Matching** (ex: 85%).
    * Extraction des **Points forts** (pourquoi le profil correspond).
    * Identification des **Points d'attention/Amélioration** (ce qui manque ou pourrait coincer).
* **Génération de Contenu Sur-Mesure :**
    * *CV Optimisé ATS :* L'IA suggère des reformulations spécifiques pour les expériences du candidat afin d'intégrer naturellement les mots-clés de l'offre.
    * *Lettre de motivation :* Rédaction d'une lettre hyper-personnalisée croisant l'ADN de l'entreprise et les forces du candidat.
* **Espace Personnel :** L'utilisateur peut ajouter une note de 1 à 5 étoiles (rating personnel) et des commentaires textuels libres pour préparer ses futurs entretiens.

---

## 5. Le CRM de Carrière (Pilotage et Relances)

L'utilisateur possède maintenant des armes sur-mesure pour postuler. JobMate devient alors son outil d'organisation.

* **Candidature :** L'utilisateur postule sur le site de l'entreprise avec le contenu généré, puis clique sur *"J'ai postulé"* dans JobMate.
* **Le Tableau Kanban :** L'offre bascule dans le pipeline de suivi.
    * *Colonnes types :* À postuler ➡️ Postulé ➡️ Entretien RH ➡️ Test Technique ➡️ Offre ➡️ Refusé.
* **Suivi Proactif :** Le tableau permet de trier, filtrer et met en évidence les candidatures qui nécessitent une relance.
* **Le Succès (End Game) :** L'utilisateur décroche le poste. La recherche est marquée comme "Terminée" et archivée.

---