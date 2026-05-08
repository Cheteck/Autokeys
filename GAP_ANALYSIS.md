# 📊 Analyse Détaillée des Gaps & Roadmap de Modernisation — AutoKeys

## 🎯 État Actuel (v0.1.0)
L'outil AutoKeys actuel remplit les fonctions de base :
- ✅ Extraction de texte JSX et d'attributs prédéfinis (`placeholder`, `alt`, `title`, `label`).
- ✅ Génération automatique de clés via slugification.
- ✅ Injection d'imports et de hooks framework-specific (React-i18next, Next-intl).
- ✅ Gestion et fusion des fichiers JSON de messages.
- ✅ Filtrage intelligent des URLs, IDs techniques et classes CSS.

---

## 🔍 Identification des Gaps Stratégiques

### 1. 🏗️ Adaptabilité (Complexité Structurelle)
- **Gap [JSX Interpolation]** : L'extraction actuelle remplace `{_count.echoes} échos` par `{_count.echoes}{t("chos")}`. Cela perd l'espace naturel du texte et rend la traduction rigide.
- **Gap [Template Literals]** : Les chaînes comme `` `${count} items` `` sont ignorées.
- **Gap [Attribute Coverage]** : De nombreux attributs ARIA (`aria-label`, `aria-description`) ou spécifiques au projet ne sont pas couverts.
- **Gap [Class Components]** : Incompatibilité totale avec les anciens composants de classe.

### 2. 🤖 Automatisation (Workflow & DX)
- **Gap [Dry-Run]** : Impossible de voir l'impact sur le code sans le modifier physiquement.
- **Gap [Interactive Mode]** : L'utilisateur ne peut pas valider ou modifier une clé générée avant qu'elle ne soit écrite.
- **Gap [Incremental Scanning]** : Pas de détection des fichiers déjà traduits, ce qui peut ré-extraire des clés.

### 3. 🛡️ Fiabilité (Qualité & Sécurité)
- **Gap [Namespacing]** : Les clés sont globales (`valider`). Dans un grand projet, `valider` (bouton) et `valider` (titre) pourraient nécessiter des traductions différentes.
- **Gap [Context Loss]** : La slugification perd le contexte (ex: "ID" technique vs "ID" identité).
- **Gap [Duplication]** : Pas de vérification si une clé avec la même valeur existe déjà sous un autre nom.

---

## 🚀 Solutions de Modernisation Priorisées

### A. Fiabilité (Levier : Namespacing)
- **Action** : Préfixer les clés par le nom du composant (`Post.validation_button`).
- **Bénéfice** : Élimine 90% des collisions de clés.

### B. Automatisation (Levier : Dry-Run)
- **Action** : Ajouter un flag `--dry-run` qui utilise un moteur de diff (type `jscodeshift` report) pour afficher les changements dans la console.
- **Bénéfice** : Donne confiance au développeur avant d'exécuter l'outil sur des milliers de lignes.

### C. Adaptabilité (Levier : Template Literals)
- **Action** : Détecter les `TemplateLiteral` et générer des appels `t('key', { var })`.
- **Bénéfice** : Supporte enfin les textes dynamiques, cœur des applications modernes.

---

## 🏁 Conclusion
Pour passer de "MVP" à "Outil de Production", la priorité immédiate est la **Fiabilité** via le namespacing et la **Transparence** via le mode dry-run. Ces deux ajouts transformeront AutoKeys en un assistant de migration sécurisé.
