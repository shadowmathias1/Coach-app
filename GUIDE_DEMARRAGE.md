# Guide de Démarrage - Coach App

## Lancement rapide

### 1. Installer les dépendances (si pas déjà fait)
```bash
npm install
```

### 2. Lancer en mode développement
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### 3. Build production
```bash
npm run build
npm start
```

## Découvrir les nouveautés graphiques

### Landing Page
Visitez [http://localhost:3000](http://localhost:3000) pour voir :
- ✨ Nouveaux dégradés animés
- 🎨 Effets glass morphism
- 🌊 Animations fluides au scroll
- 💫 Hero section avec gradient 3 couleurs
- 🔮 Orbs lumineux flottants

### Dark Mode / Light Mode
Testez les deux thèmes avec le bouton de thème dans le header :
- 🌙 Dark : Noir profond avec contrastes améliorés
- ☀️ Light : Blanc lumineux avec ombres subtiles

### Composants interactifs

#### Boutons
```tsx
// Primary avec gradient animé
<button className="btn-primary">Action</button>

// Secondary avec glass effect
<button className="btn-secondary">Secondaire</button>

// Danger avec glow rouge
<button className="btn-danger">Supprimer</button>
```

#### Cards
```tsx
// Card simple
<div className="card">Contenu</div>

// Card interactive avec hover
<div className="card-hover">Cliquable</div>

// Glass effect fort
<div className="glass-strong">Glass</div>
```

#### Badges
```tsx
<span className="badge-success">Succès</span>
<span className="badge-warning">Attention</span>
<span className="badge-danger">Erreur</span>
<span className="badge-info">Info</span>
<span className="badge-primary">Primary</span>
```

#### Gradients de texte
```tsx
<h1 className="text-gradient">Gradient Primary</h1>
<h1 className="text-gradient-secondary">Gradient Secondary</h1>
<h1 className="text-gradient-vivid">Gradient Animé</h1>
```

### Animations

Toutes les pages bénéficient des nouvelles animations :

```tsx
// Apparition en fondu
<div className="animate-fade-in">...</div>

// Slide depuis le bas
<div className="animate-slide-up">...</div>

// Scale élégant
<div className="animate-scale-in">...</div>

// Avec délai
<div
  className="animate-slide-up"
  style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
>
  ...
</div>
```

### Effects spéciaux

```tsx
// Shimmer effect
<div className="shimmer">
  <div className="card">En chargement...</div>
</div>

// Border gradient animée
<div className="border-gradient rounded-xl p-6">
  Contenu avec border animée
</div>

// Glow effects
<div className="glow-primary">Glow bleu</div>
<div className="glow-success">Glow vert</div>
```

## Structure des couleurs

### Palette principale
```css
/* Primary - Blue moderne */
--color-primary: 37 99 235
--color-primary-light: 96 165 250
--color-primary-dark: 30 64 175

/* Secondary - Purple vibrant */
--color-secondary: 147 51 234
--color-secondary-light: 192 132 252
--color-secondary-dark: 107 33 168

/* Accent - Cyan */
--color-accent: 6 182 212
--color-accent-light: 103 232 249

/* Success - Emerald */
--color-success: 16 185 129

/* Warning - Amber */
--color-warning: 245 158 11

/* Danger - Rose/Red */
--color-danger: 244 63 94

/* Info - Indigo */
--color-info: 99 102 241
```

### Utilisation en Tailwind
```tsx
// Background
className="bg-primary"
className="bg-secondary/50"  // 50% opacity

// Text
className="text-primary"
className="text-danger"

// Border
className="border-primary"
className="border-accent/30"

// Hover
className="hover:bg-primary-light"
className="hover:text-secondary"
```

## Pages à tester

### Public
- `/` - Landing page refonte complète
- `/auth/login` - Connexion
- `/auth/register` - Inscription

### Coach
- `/coach/dashboard` - Tableau de bord avec stats
- `/coach/clients` - Liste clients
- `/coach/programs` - Programmes
- `/coach/messages` - Messagerie
- `/coach/settings` - Paramètres

### Client
- `/client/dashboard` - Tableau de bord client
- `/client/program` - Programme assigné
- `/client/progress` - Progression
- `/client/messages` - Messages
- `/client/settings` - Paramètres

## Astuces de développement

### Hot reload
Les modifications CSS/Tailwind sont appliquées instantanément grâce au HMR.

### Debug des animations
Pour désactiver temporairement les animations :
```css
* {
  animation: none !important;
  transition: none !important;
}
```

### Tester les états
```tsx
// Hover forcé (DevTools)
element:hover

// Focus visible
<button className="focus-visible:ring-2">Bouton</button>

// Disabled
<button className="btn-primary" disabled>Désactivé</button>
```

### Responsive
Testez avec les DevTools en mode mobile :
- Mobile : 375px (iPhone SE)
- Tablet : 768px (iPad)
- Desktop : 1024px+

Les breakpoints Tailwind :
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px
- `2xl:` 1536px

## Performance

### Vérifier les Core Web Vitals
```bash
npm run build
npm start
```

Puis ouvrir Chrome DevTools > Lighthouse :
- Performance : viser 90+
- Accessibility : viser 95+
- Best Practices : viser 95+
- SEO : viser 90+

### Optimisations appliquées
- ✅ CSS-in-JS via Tailwind (zero runtime)
- ✅ Animations GPU-accelerated
- ✅ Lazy loading des images (Next.js)
- ✅ Code splitting automatique
- ✅ Static generation pour landing

## Accessibilité

### Tests recommandés
```bash
# Installer axe DevTools
# Chrome Extension: axe DevTools

# Tester avec clavier
Tab - Navigation
Enter/Space - Activation
Esc - Fermeture modals
```

### Features A11Y
- ✅ Focus visible styles
- ✅ ARIA labels sur icons
- ✅ Contrastes WCAG AA
- ✅ Reduced motion support
- ✅ Semantic HTML

## Troubleshooting

### Build échoue
```bash
# Nettoyer .next et node_modules
rm -rf .next node_modules
npm install
npm run build
```

### Styles ne s'appliquent pas
```bash
# Redémarrer le serveur
Ctrl+C
npm run dev
```

### Animations saccadées
Vérifier :
- GPU acceleration active
- Pas de extensions Chrome conflictuelles
- Performance mode activé (DevTools)

## Support

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)

### Fichiers importants
- `src/styles/globals.css` - Toutes les classes custom
- `tailwind.config.ts` - Configuration Tailwind
- `src/app/page.tsx` - Landing page
- `REFONTE_GRAPHIQUE.md` - Documentation complète

## Prochaines étapes

1. **Tester l'application** : `npm run dev`
2. **Explorer les pages** : Toutes les routes listées ci-dessus
3. **Jouer avec les composants** : Modifier les classes dans le code
4. **Créer vos variations** : Utiliser les classes comme base
5. **Optimiser** : Mesurer et améliorer les performances

Amusez-vous bien avec la nouvelle interface ! 🚀✨
