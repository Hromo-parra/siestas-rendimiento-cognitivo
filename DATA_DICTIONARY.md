# Diccionario de datos

Los archivos usan identificadores de fila UUID y fechas ISO 8601. Los números capturados desde formularios pueden aparecer como texto en el respaldo JSON; el resumen CSV expone las variables analíticas principales.

## `profiles`

| Variable | Descripción |
|---|---|
| `participant_id` | Código anónimo normalizado |
| `age` | Edad en años |
| `chronotype` | Cronotipo autopercibido |
| `nap_habit` | Frecuencia habitual de siestas |
| `condition_order` | Orden asignado: `nap`, `rest` |
| `task_order` | Orden estable de tareas |
| `consented_at` | Momento de confirmación del consentimiento |

## `sessions`

| Variable | Descripción |
|---|---|
| `session_number` | 1 o 2 |
| `condition` | `nap` o `rest` |
| `status` | Estado del flujo |
| `session_code` | Código breve de reanudación local |
| `interval_started_at` | Inicio registrado del intervalo |
| `pre_task_summary`, `post_task_summary` | Métricas calculadas por tarea |

## `assessments`

Una fila por fase y sesión. La fase previa contiene sueño, cafeína, somnolencia, ánimo, expectativas y culpa anticipada. La fase posterior contiene sueño real, método de verificación, adherencia, intervalo, inercia, descanso, vitalidad, culpa y desempeño subjetivo. Las escalas exploratorias tienen rango 0–10.

## `trials`

Una fila por ensayo. Campos comunes: participante, sesión, condición, fase, tarea, índice y hora. PVT añade tiempo de reacción, anticipación y expiración. 2-back añade estímulo, objetivo, respuesta, tiempo de reacción y exactitud.

## Convención de cambio

- `pvt_change_ms = posterior − previo`: un valor negativo indica respuesta más rápida.
- `nback_change = posterior − previo`: un valor positivo indica mayor exactitud.

