# Jour 7 - Accessibilite, Tests Manuels, Handoff

## 1) Checklist accessibilite (WCAG 2.1 AA)

- [ ] Tous les boutons avec icone seule ont un `accessibilityLabel`
- [ ] Tous les elements pressables ont `accessibilityRole="button"`
- [ ] Les actions non triviales ont un `accessibilityHint`
- [ ] Les messages d'erreur sont annonces comme alertes
- [ ] Les textes importants supportent `allowFontScaling`
- [ ] Les badges portent un texte explicite (pas seulement la couleur)

## 2) Checklist manuelle Feed

- [ ] La liste se charge avec GPS actif
- [ ] La liste se charge avec adresse manuelle (permission refusee)
- [ ] Les filtres s'appliquent correctement et le badge se met a jour
- [ ] Le pull-to-refresh fonctionne
- [ ] L'infinite scroll charge la page suivante
- [ ] L'etat empty s'affiche si aucun resultat
- [ ] La navigation vers le detail fonctionne depuis chaque card

## 3) Checklist manuelle Auth

- [ ] Inscription email -> email de verification -> deep link -> redirection Feed
- [ ] Connexion email -> Feed
- [ ] Erreur "email deja utilise" affichee
- [ ] Erreur "identifiants incorrects" affichee
- [ ] Forgot password -> email envoye -> reset via deep link -> login
- [ ] OAuth Google fonctionne

## 4) Handoff Dev 3

- [ ] auth.store complet et fonctionnel
- [ ] filters.store complet
- [ ] client axios avec refresh automatique operationnel
- [ ] Routes de navigation declarees
- [ ] Composants partages utilisables
- [ ] Interface upload API disponible
