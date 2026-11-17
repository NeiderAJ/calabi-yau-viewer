# Control de versiones y recuperación

Este proyecto utiliza la siguiente convención:

- `main`: última versión estable y verificada.
- `develop`: trabajo de nuevas funcionalidades.
- `v1.0.0`: punto permanente de recuperación de Calabi–Yau Lab V1.
- `v0.0.0-legacy`: referencia al último commit de la implementación anterior.

Las etiquetas de versiones publicadas no deben moverse ni reutilizarse.

## A. Consultar qué versión tengo

Desde el directorio del proyecto:

```bash
git status --short --branch
git branch --show-current
git describe --tags --always
git log --oneline --decorate -10
```

`git status` también informa si existen archivos modificados todavía no guardados en un commit.

## B. Guardar nuevos cambios mediante commits

Trabaja normalmente en `develop` y revisa los cambios antes de confirmarlos:

```bash
git switch develop
git status
git diff
git add src README.md docs package.json package-lock.json
git diff --cached
git commit -m "Descripción breve del cambio"
```

Adapta la lista de `git add` a los archivos que realmente quieras incluir. No uses `git add .` sin revisar antes `git status`.

## C. Publicar los cambios de `develop`

```bash
git switch develop
git status
git push origin develop
```

Antes de publicar conviene ejecutar:

```bash
npm ci
npm test
npm run build
```

## D. Recuperar la V1 original sin destruir trabajo

La opción recomendada es crear una rama nueva desde la etiqueta inmutable:

```bash
git status
git switch -c recuperacion-v1 v1.0.0
npm ci
npm test
npm run build
```

Esto no elimina ni reescribe `develop`, `main` ni sus commits. Si ya existe una rama llamada `recuperacion-v1`, elige otro nombre, por ejemplo `recuperacion-v1-2`.

## E. Crear otra rama basada en V1

```bash
git switch -c experimento-desde-v1 v1.0.0
```

Para volver al trabajo actual:

```bash
git switch develop
```

Los cambios sin commit deben guardarse mediante un commit o `git stash` antes de cambiar de rama cuando Git lo solicite.

## F. Promover una versión estable de `develop` a `main`

Primero verifica `develop`:

```bash
git switch develop
git pull --ff-only origin develop
npm ci
npm test
npm run build
git status
git push origin develop
```

Después integra en `main` sin reescribir su historia:

```bash
git switch main
git pull --ff-only origin main
git merge --no-ff develop -m "Publicar nueva versión estable"
npm test
npm run build
git push origin main
```

Ese `push` activa `.github/workflows/deploy-pages.yml`. El workflow prueba y compila `main`, y después publica `dist/` en GitHub Pages. Comprueba el resultado en la pestaña **Actions** y en:

```text
https://neideraj.github.io/calabi-yau-viewer/
```

Cuando corresponda crear una nueva versión permanente, usa una etiqueta anotada nueva; nunca muevas `v1.0.0`:

```bash
git tag -a v1.1.0 -m "Calabi-Yau Lab V1.1.0"
git push origin v1.1.0
git switch develop
```

Si una prueba, el build o el merge falla, corrige el problema antes de publicar `main` o crear la nueva etiqueta.
