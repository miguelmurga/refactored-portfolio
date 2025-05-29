# 🌳 Estrategia de Ramas (Branching Strategy)

Este documento define la estrategia de ramas organizada para el repositorio.

## 📋 **Estructura de Ramas**

### **🏠 Ramas Principales**

- **`main`** - Rama principal y protegida
  - Contiene código estable y listo para producción
  - Todas las features se mergean aquí
  - Deployments automáticos desde esta rama
  - **🔒 Protegida**: Requiere Pull Request para cambios

### **🚀 Ramas de Feature**

- **Nomenclatura**: `feature/descripcion-breve`
- **Ejemplos**:
  - `feature/chat-improvements`
  - `feature/user-authentication`
  - `feature/performance-optimization`

- **Flujo**:
  1. Crear desde `main`: `git checkout -b feature/nueva-funcionalidad`
  2. Desarrollar y commitear cambios
  3. Push: `git push -u origin feature/nueva-funcionalidad`
  4. Crear Pull Request → `main`
  5. Review y merge
  6. Eliminar rama después del merge

### **🐛 Ramas de Hotfix**

- **Nomenclatura**: `hotfix/descripcion-breve`
- **Ejemplos**:
  - `hotfix/critical-security-patch`
  - `hotfix/production-bug-fix`

- **Flujo**:
  1. Crear desde `main` para fixes urgentes
  2. Aplicar fix mínimo
  3. Pull Request → `main`
  4. Deploy inmediato
  5. Eliminar rama después del merge

### **🔬 Ramas de Experimental**

- **Nomenclatura**: `experiment/descripcion`
- **Ejemplos**:
  - `experiment/new-ui-framework`
  - `experiment/ai-model-testing`

- **Características**:
  - Para pruebas y POCs
  - No requieren merge a `main`
  - Se eliminan cuando el experimento termina

## 📝 **Convenciones de Commits**

### **Formato**
```
tipo(scope): descripción breve

Descripción más detallada si es necesaria.

- Cambio específico 1
- Cambio específico 2

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### **Tipos de Commit**
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bugs
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato (no afectan lógica)
- `refactor:` - Refactoring de código
- `test:` - Añadir o modificar tests
- `chore:` - Mantenimiento (dependencias, configs)
- `perf:` - Mejoras de rendimiento
- `ci:` - Cambios en CI/CD

### **Scopes Comunes**
- `chat` - Sistema de chat
- `auth` - Autenticación
- `ui` - Interfaz de usuario
- `api` - API y servicios
- `config` - Configuración
- `deps` - Dependencias

## 🔄 **Flujo de Trabajo Estándar**

### **1. Nueva Feature**
```bash
# 1. Actualizar main
git checkout main
git pull origin main

# 2. Crear rama feature
git checkout -b feature/mi-nueva-funcionalidad

# 3. Desarrollar
# ... hacer cambios ...

# 4. Commit
git add .
git commit -m "feat(chat): add message search functionality

- Implement semantic search in chat history
- Add search bar to chat interface  
- Include message highlighting"

# 5. Push
git push -u origin feature/mi-nueva-funcionalidad

# 6. Crear Pull Request
gh pr create --title "feat: add message search functionality" --body "..."

# 7. Después del merge
git checkout main
git pull origin main
git branch -d feature/mi-nueva-funcionalidad
```

### **2. Hotfix Urgente**
```bash
# 1. Crear desde main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Aplicar fix
# ... hacer cambio mínimo ...

# 3. Commit y push rápido
git add .
git commit -m "fix: resolve critical authentication vulnerability"
git push -u origin hotfix/critical-bug

# 4. Pull Request prioritario
gh pr create --title "URGENT: fix authentication vulnerability" --body "..."
```

## 🛡️ **Protecciones y Reglas**

### **Rama `main`**
- ✅ Requiere Pull Request
- ✅ Requiere reviews (recomendado: 1 reviewer)
- ✅ Requiere estado CI green
- ✅ No permite force push
- ✅ Auto-delete branches después de merge

### **Pull Requests**
- 📝 Template con checklist estándar
- 🧪 CI/CD debe pasar (build, tests, lint)
- 📖 Documentación actualizada si es necesario
- 🔍 Review obligatorio para cambios críticos

## 🧹 **Limpieza de Ramas**

### **Automática**
- GitHub auto-elimina ramas mergeadas
- CI limpia branches stale (>30 días sin actividad)

### **Manual**
```bash
# Listar ramas mergeadas
git branch --merged

# Eliminar ramas locales mergeadas
git branch --merged | grep -v "\*\|main" | xargs -n 1 git branch -d

# Limpiar referencias remotas
git remote prune origin
```

## 📊 **Estado Actual del Repositorio**

### **✅ Organización Completada (2025-05-29)**
- 🧹 Eliminadas 4 ramas obsoletas
- ✅ `main` actualizada con últimos cambios
- 🔄 Merge de `feature/latest-improvements` exitoso
- 📝 Documentación de estrategia creada

### **🎯 Ramas Activas**
- `main` - Código estable y production-ready

### **🗑️ Ramas Eliminadas**
- `feature/latest-improvements` (merged exitosamente)
- `imported-changes` (obsoleta, Feb 2025)
- `azure-pipelines` (obsoleta, Dic 2024)
- `setup-refactor-pipeline` (obsoleta, Dic 2024)
- `imported-portfolio` (obsoleta, Dic 2024)

## 🚀 **Próximos Pasos**

1. **Configurar Branch Protection** en GitHub
2. **Crear PR Template** en `.github/pull_request_template.md`
3. **Setup CI/CD** para auto-deployment desde `main`
4. **Documentar** releases y changelogs

---

**📝 Nota**: Esta estrategia sigue el modelo **GitHub Flow** simplificado, ideal para desarrollo ágil y deployments continuos.