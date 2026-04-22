# Backend Wizard — Stage 2

API REST de recherche démographique pour Insighta Labs.

## Base URL
https://backend-wizard-production-ce55.up.railway.app

## Endpoints

| Méthode | Endpoint | Description |
|---|---|---|
| POST | /api/profiles | Créer un profil |
| GET | /api/profiles | Lister avec filtres, tri, pagination |
| GET | /api/profiles/search | Recherche en langage naturel |
| GET | /api/profiles/:id | Récupérer un profil |
| DELETE | /api/profiles/:id | Supprimer un profil |

## Filtres disponibles (GET /api/profiles)

| Paramètre | Type | Exemple |
|---|---|---|
| gender | string | male, female |
| age_group | string | child, teenager, adult, senior |
| country_id | string | NG, CM, KE |
| min_age | number | 18 |
| max_age | number | 60 |
| min_gender_probability | float | 0.7 |
| min_country_probability | float | 0.5 |
| sort_by | string | age, created_at, gender_probability |
| order | string | asc, desc |
| page | number | 1 |
| limit | number | 10 (max: 50) |

## Natural Language Search (GET /api/profiles/search?q=)

### Approche de parsing

Le parser utilise une approche **rule-based** (sans IA ni LLM).
Il analyse la requête en texte brut et extrait des filtres selon des mots-clés prédéfinis.

### Mots-clés supportés

**Genre:**
- `male`, `males` → gender = male
- `female`, `females` → gender = female

**Groupe d'âge:**
- `child`, `children` → age_group = child
- `teenager`, `teenagers` → age_group = teenager
- `adult`, `adults` → age_group = adult
- `senior`, `seniors` → age_group = senior

**Âge:**
- `young` → age entre 16 et 24
- `above X`, `over X` → min_age = X
- `under X`, `below X` → max_age = X

**Pays (via mot-clé "from"):**
- `from nigeria` → country_id = NG
- `from kenya` → country_id = KE
- `from cameroon` → country_id = CM
- (et 30+ autres pays supportés)

### Exemples de requêtes

| Requête | Filtres générés |
|---|---|
| `young males from nigeria` | gender=male, age 16-24, country_id=NG |
| `females above 30` | gender=female, min_age=30 |
| `adult males from kenya` | gender=male, age_group=adult, country_id=KE |
| `seniors from cameroon` | age_group=senior, country_id=CM |
| `teenagers above 17` | age_group=teenager, min_age=17 |

## Limitations du parser

- Ne supporte pas les requêtes négatives (ex: "not from nigeria")
- Ne supporte pas plusieurs pays dans une même requête
- Ne supporte pas les plages d'âge complexes (ex: "between 20 and 30")
- Les pays non listés dans le dictionnaire ne sont pas reconnus
- Les fautes d'orthographe ne sont pas gérées
- Requêtes trop vagues (ex: "people") retournent une erreur

## Stack
Node.js, Express, PostgreSQL, Prisma v5