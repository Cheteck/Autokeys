# 🔑 AutoKeys (@ijideals/autokeys)

Outil CLI d'extraction i18n automatique via parsing AST. Transforme les textes en dur en appels `t()` et génère les fichiers JSON.

## 🚀 Fonctions principales

- **Extraction Intelligente** : Détecte le texte JSX et les attributs (`placeholder`, `alt`, `title`, `label`, `aria-label`).
- **Namespacing Automatique** : Clés préfixées par le nom du fichier (ex: `header.welcome`).
- **Injection framework-specific** : Inyecte automatiquement les imports et les hooks (`useTranslation` pour React, `useTranslations` pour Next.js).
- **Mode Dry-Run** : Prévisualisation des changements sans modification de fichier.
- **Fusion JSON** : Regroupe et fusionne les clés extraites dans les fichiers de messages existants.
- **Filtrage** : Ignore automatiquement les URLs, IDs techniques et classes CSS.

## 📦 Installation & Build

```bash
cd packages/autokeys
npm install
npm run build
```

## 🛠 Usage

### Transformer un dossier
```bash
# React + i18next (défaut)
autokeys transform ./src/components

# Next.js + next-intl
autokeys transform ./src/app --framework next --i18n next-intl
```

### Options CLI
| Option | Description | Défaut |
| :--- | :--- | :--- |
| `--framework <type>` | `react` ou `next` | `react` |
| `--i18n <library>` | `react-i18next` ou `next-intl` | `react-i18next` |
| `--locale <lang>` | Langue cible du JSON | `fr` |
| `--outDir <dir>` | Dossier de sortie des messages | `./messages` |
| `--dry-run` | Affiche les changements sans écrire | `false` |
| `--no-namespace` | Désactive le préfixe de fichier | `false` |

## 📝 Exemple

### Entrée (`User.tsx`)
```tsx
export const User = () => <div>Bonjour le monde</div>;
```

### Sortie (`User.tsx`)
```tsx
import { useTranslation } from 'react-i18next';
export const User = () => {
  const { t } = useTranslation();
  return <div>{t("user.bonjour_le_monde")}</div>;
};
```

### JSON (`messages/fr.json`)
```json
{
  "user.bonjour_le_monde": "Bonjour le monde"
}
```

## 🏗 Architecture

1. **Scanner** : Filtre les nœuds AST non pertinents.
2. **Transformer** : Utilise `jscodeshift` pour manipuler l'AST (remplacement de texte + injection de hooks).
3. **Adapters** : Gèrent les spécificités syntaxiques de chaque framework/librairie.
4. **CLI** : Orchestre le scan des fichiers et la persistance des ressources.

## 📊 État du projet
Consulter [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) pour la roadmap et les limitations actuelles (interpolation complexe, template literals dynamiques).
