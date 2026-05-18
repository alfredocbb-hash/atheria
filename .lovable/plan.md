# Bug: al abrir "Nuevo suministro" la pestaña vuelve a Suministros

## Causa

En `src/components/workspace/workspace-context.tsx`:

```ts
export function useEnsureTab(key: ModuleKey) {
  const ws = useContext(WorkspaceCtx);
  useEffect(() => {
    if (!ws) return;
    ws.openModule(key, { focus: true });
  }, [ws, key]);   // <-- ws cambia en cada render del provider
}
```

El valor `ws` del contexto se recalcula (vía `useMemo`) cada vez que cambian `openTabs` o `activeId`. Entonces:

1. Usuario hace clic en "Nuevo suministro" → `openView(...)` cambia `activeId` a `view:suministro.new`.
2. El provider re-renderiza, `ws` obtiene una referencia nueva.
3. `SuministrosPageTrigger` sigue montado (la URL aún es `/admin/suministros`), su `useEnsureTab("suministros")` re-ejecuta el efecto porque `ws` cambió.
4. Eso llama `openModule("suministros", { focus: true })` → `setActiveId(moduleId("suministros"))` → el foco vuelve a la pestaña "Suministros".

El mismo bug afecta a **todos** los botones "Nuevo …" de los módulos (Socios, Facturación, Reclamos, etc.). Por eso ninguna vista nueva queda visible.

## Fix

Hacer que `useEnsureTab` corra el efecto **una sola vez por `key`**, sin depender de la referencia inestable de `ws`. Usar un `ref` para acceder al contexto vigente:

```ts
export function useEnsureTab(key: ModuleKey) {
  const ws = useContext(WorkspaceCtx);
  const wsRef = useRef(ws);
  wsRef.current = ws;
  useEffect(() => {
    wsRef.current?.openModule(key, { focus: true });
  }, [key]);
}
```

Así el módulo se asegura/foca al montar la ruta, pero los cambios posteriores de `activeId` (al abrir un view tab) ya no re-disparan el foco.

## Archivos a modificar

- `src/components/workspace/workspace-context.tsx` — actualizar `useEnsureTab` (≈6 líneas).

## Verificación

- En `/admin/suministros`, clic en "Nuevo suministro" → la pestaña queda activa y muestra el formulario.
- Repetir con "Nuevo socio", "Nueva tarifa", "Nueva lectura", "Generar factura", "Nueva cuadrilla" → cada una abre y mantiene su panel.
- Navegar por la sidebar entre módulos sigue funcionando (cambia la URL y enfoca el módulo correcto).
