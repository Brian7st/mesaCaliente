---
name: git-best-practices
description: "Manual de procedimientos para que un agente de IA (ej. Claude Code) opere Git de forma segura y siguiendo las mejores prácticas actuales: qué comandos ejecutar en cada situación (empezar una tarea, commitear, abrir PR, resolver conflictos, deshacer errores), qué acciones requieren confirmación explícita del usuario antes de ejecutarse, y qué comandos están prohibidos por defecto. Usar esta skill siempre que el agente vaya a ejecutar comandos git en un repositorio real (no solo cuando el usuario pregunte teoría), incluyendo antes de cualquier commit, push, rebase, merge o resolución de conflictos."
---

# Git para agentes de IA

Este SKILL.md no es una guía conceptual para humanos: es un procedimiento operativo. Antes de ejecutar cualquier comando `git`, ubica en qué situación estás (sección de abajo) y sigue exactamente los pasos indicados.

## Regla de oro: niveles de autonomía

Antes de cualquier comando, clasifícalo:

| Nivel | Acciones | Regla |
|---|---|---|
| 🟢 Autónomo | `status`, `diff`, `log`, `branch` (listar), `fetch`, `add`, `commit` local, crear rama nueva | Ejecutar sin pedir permiso |
| 🟡 Confirmar antes | `push` (primera vez de una rama), `merge`, `rebase`, `pull` con posibles conflictos, `checkout` que descarta cambios locales no commiteados | Anunciar la acción y su efecto, ejecutar solo tras confirmación explícita del usuario |
| 🔴 Prohibido sin permiso explícito y repetido | `push --force` (sin `--with-lease`), `reset --hard` sobre commits no respaldados, `clean -fd`, borrar ramas remotas, reescribir historial de `main`/`master`/rama de release | Nunca ejecutar de forma proactiva. Si el usuario lo pide, explicar el riesgo primero y pedir confirmación explícita separada |

Si no estás seguro del nivel de un comando, trátalo como 🟡.

## 1. Al empezar una tarea nueva

```bash
git status                     # verificar que no hay cambios sueltos sin explicar
git fetch origin
git switch main
git pull --ff-only origin main # si falla, NO forzar: informar al usuario que main divergió localmente
git switch -c <tipo>/<descripcion-corta>   # ej. feat/login-oauth, fix/null-pointer-cart
```

- Nombre de rama: `<tipo>/<slug>` usando los mismos prefijos que Conventional Commits (`feat`, `fix`, `chore`, `refactor`).
- Nunca trabajar directo sobre `main`/`master`. Si el usuario ya está ahí con cambios sin commitear, crear la rama antes de tocar nada (`git switch -c ...` conserva los cambios locales).

## 2. Al commitear

Antes de cada commit, correr internamente este checklist (no preguntarle al usuario, solo verificar):

1. `git diff --staged` — revisar que solo está lo que corresponde a este cambio lógico. Si hay archivos de formateo/generados mezclados con lógica, separar en commits distintos con `git add -p`.
2. Mensaje en formato Conventional Commits:
   ```
   <tipo>(<scope opcional>): <resumen en imperativo, ≤50 caracteres>

   <cuerpo explicando el POR QUÉ, no el qué — opcional, solo si no es obvio>
   ```
3. Nunca incluir secretos, tokens o credenciales en el diff. Si se detectan, detener el commit y avisar al usuario.
4. Un commit = un cambio lógico. Si el diff mezcla dos responsabilidades, dividir el commit.

## 3. Al abrir un Pull Request

- Verificar el tamaño del diff contra `main`: `git diff main...HEAD --stat`.
  - Si supera ~400 líneas cambiadas, avisar al usuario y sugerir dividir el PR antes de continuar.
- Generar la descripción del PR con esta estructura fija:
  ```
  ## Qué cambia
  ## Por qué
  ## Cómo probarlo
  ## Checklist
  - [ ] Tests pasan localmente
  - [ ] Sin secretos/credenciales en el diff
  ```
- Antes del primer `git push -u origin <rama>`, confirmar con el usuario el nombre de la rama remota y que CI está configurado para correr en el PR.

## 4. Al actualizar una rama feature con los cambios de main

Orden de preferencia (de más a menos preferido):

1. `git rebase origin/main` — historial lineal. **Usar solo si la rama es de un único autor y aún no fue revisada por otros**, o si el usuario confirma que puede reescribirse.
2. `git merge origin/main` — si la rama ya tiene commits de más de una persona o ya fue enlazada a un PR con comentarios de revisión (rebasear rompería las referencias de línea de la revisión).

Después de un rebase exitoso, el push requiere `--force-with-lease`, nunca `--force`:
```bash
git push --force-with-lease origin <rama>
```
Si `--force-with-lease` falla, significa que alguien más subió cambios a esa rama remota: **detenerse y avisar al usuario**, no reintentar con `--force`.

## 5. Al resolver conflictos

1. `git status` para listar archivos en conflicto.
2. Resolver archivo por archivo; después de cada uno, `git add <archivo>` y volver a revisar el diff completo antes de continuar (no asumir que la resolución fue correcta sin releer el bloque).
3. Nunca resolver un conflicto en un archivo que el agente no entiende completamente (ej. lockfiles binarios, migraciones de base de datos) sin señalarlo explícitamente al usuario para que lo revise.
4. Al terminar: `git rebase --continue` o `git commit` (según si era rebase o merge).
5. Si el conflicto es demasiado grande o riesgoso, ofrecer `git rebase --abort` / `git merge --abort` como salida segura antes de seguir.

## 6. Al deshacer errores (siempre el camino más reversible primero)

| Situación | Comando seguro | Evitar |
|---|---|---|
| Deshacer el último commit, conservar cambios | `git reset --soft HEAD~1` | `reset --hard` |
| Deshacer cambios de un commit ya pusheado y compartido | `git revert <commit>` | reescribir historial compartido |
| Recuperar un commit "perdido" tras rebase/reset | `git reflog` → `git checkout <hash>` | asumir que el trabajo se perdió |
| Aplicar un commit puntual de otra rama | `git cherry-pick <hash>` | rehacer el cambio a mano |

`git reset --hard` y `git clean -fd` solo se ejecutan si el usuario los pide explícitamente Y se le advirtió antes que son destructivos e irreversibles para cambios no commiteados.

## 7. Automatización esperada en el repo (verificar, no asumir)

Al entrar a un repo por primera vez en una sesión, revisar si existen:
- `.pre-commit-config.yaml` o hooks en `.git/hooks/` — si existen, no saltárselos con `--no-verify` salvo pedido explícito del usuario.
- Workflow de CI (`.github/workflows/`, `.gitlab-ci.yml`, etc.) — si el PR va a fallar CI de forma predecible (lint, tests), avisar antes de pushear en vez de dejar que el usuario descubra el fallo después.

## 8. Comandos de diagnóstico útiles para el propio agente

- `git bisect start` — para localizar el commit que introdujo un bug reportado.
- `git blame <archivo>` — antes de modificar código ajeno, entender quién y por qué lo escribió así (contexto, no para atribuir culpa).
- `git log --oneline --graph --all` — para entender la topología de ramas antes de decidir rebase vs merge.

## Resumen para el agente

Antes de cada acción con git, pregúntate: ¿en qué fila de la tabla de niveles de autonomía cae esto? Si es 🔴, detente y pide permiso explícito aunque el usuario ya haya dado una instrucción general como "sube los cambios". "Sube los cambios" nunca autoriza un --force sin --with-lease.
