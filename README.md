# GymApp 💪

App de gimnasio para iOS y Android hecha con **React Native + Expo** (Expo Router, TypeScript).

## Funciones

- **Inicio**: resumen semanal (entrenos, racha de semanas, kg levantados), calendario de la semana y acceso rápido para empezar.
- **Rutinas**: crea, edita, reordena y elimina rutinas. Incluye 3 de ejemplo (Empuje, Tirón, Pierna).
- **Entrenamiento en curso**: registra kg y repeticiones por serie, marca series como hechas, cronómetro de la sesión y temporizador de descanso (90 s, ajustable ±15 s). Los valores se rellenan con lo que hiciste la última vez.
- **Ejercicios**: biblioteca de más de 30 ejercicios con búsqueda, filtro por grupo muscular y tu récord personal (PR) en cada uno.
- **Historial**: todos tus entrenamientos con duración, series y volumen total.

Todos los datos se guardan en el teléfono con AsyncStorage.

## Cómo ejecutarla

```bash
npm install
npm start
```

Escanea el código QR con la app **Expo Go** en tu teléfono (Android o iOS).

Otros comandos:

```bash
npm run android     # abre en un emulador/dispositivo Android
npm run ios         # abre en el simulador de iOS (macOS)
npm run typecheck   # comprueba los tipos de TypeScript
```

## Estructura

```
src/
  app/                 # pantallas (Expo Router)
    (tabs)/            # Inicio, Rutinas, Ejercicios, Historial
    entrenamiento.tsx  # sesión de entrenamiento activa
    elegir-ejercicio.tsx
    rutina/[id].tsx    # editar rutina
    workout/[id].tsx   # detalle de un entrenamiento
  components/ui.tsx    # componentes reutilizables
  data/exercises.ts    # catálogo de ejercicios y rutinas de ejemplo
  store/GymContext.tsx # estado global + persistencia
  utils/stats.ts       # cálculos (volumen, PRs, rachas, formatos)
```
