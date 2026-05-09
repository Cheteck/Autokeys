# 📊 Analyse Détaillée des Gaps & Modernisation v0.3.0 — Inspired by i18next-cli

## 🎯 État Actuel (v0.3.0)
AutoKeys a franchi une nouvelle étape en adoptant les standards de l'industrie (i18next-cli, i18next-parser) :
- ✅ **Architecture Orientée Lexer** : Séparation claire entre l'extraction (Lexers) et la transformation AST.
- ✅ **Gestion de Catalogue i18next** : Tri alphabétique et archivage des clés inutilisées dans `locale_old.json`.
- ✅ **Support des Clés Dynamiques** : Extraction via commentaires `/* i18next-extract-mark: key */`.
- ✅ **Moteur de Filtrage Avancé** : Scanner Pro v3 avec détection sémantique améliorée.
- ✅ **Namespacing Hiérarchique** : Clés structurées selon l'arborescence projet par défaut.

---

## 🔍 Améliorations vs i18next-cli
- **Différence Majeure** : Là où i18next-cli se concentre souvent sur l'extraction, AutoKeys propose une **transformation interactive du code source** (injection automatique des appels `t()`, hooks et imports).
- **Modernité** : Support natif et optimisé pour Next.js 16 (App Router) et les directives "use client".

---

## 🚀 Roadmap Future

### A. Extensibilité Lexer
- **Action** : Ajouter des Lexers pour HTML pur, Vue SFC et Svelte.
- **Bénéfice** : Devenir l'outil universel de migration i18n.

### B. Internationalisation ICU & Pluriels
- **Action** : Détecter automatiquement les patterns de pluriels et proposer des clés adaptées (`key_one`, `key_other`).

---

## 🏁 Conclusion
Avec la v0.3.0, AutoKeys combine la puissance de l'analyse AST (jscodeshift) avec la rigueur de gestion de catalogue d'i18next-cli. C'est l'outil le plus avancé pour automatiser la transition i18n d'une application React/Next.js moderne.
