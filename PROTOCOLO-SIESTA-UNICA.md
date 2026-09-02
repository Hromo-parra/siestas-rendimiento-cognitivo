# Protocolo técnico de una sola siesta · Equipo 8

## Alcance

Este flujo responde a la propuesta de una siesta en casa de 25 minutos con evaluación anterior y posterior. Es un piloto técnico; no implementa el diseño cruzado de `index.html` ni presume instrumentos validados o aprobación ética.

No se modificaron las tareas ni los registros del piloto cruzado anterior. El enlace de reclutamiento actualizado llega exclusivamente a `participar.html`.

## Consentimiento

Texto versionado `2026-09-02-piloto-1`, redactado con propósito, procedimiento, tiempo, criterios, posibles molestias, privacidad, voluntariedad, retiro y aspectos pendientes. Las tres casillas inician sin marcar y son obligatorias. Rechazar no crea un registro. Al aceptar se pasa al registro; la aceptación y su versión solo se guardan si la persona cumple criterios y envía ese formulario.

Pendiente antes de una recolección formal: revisión del texto, contacto, aprobación institucional aplicable, custodia y tiempo de conservación, reglas para datos de participantes retirados, interpretación del criterio sobre sustancias/cafeína, instrumentos y tiempos definitivos.

El aviso sobre inercia del sueño se apoya en [Hilditch y colaboradores, 2016](https://pubmed.ncbi.nlm.nih.gov/26715234/), un estudio de siestas nocturnas. No se extrapolan su frecuencia o duración de efectos a participantes de esta propuesta.

## Mediciones actuales y limitaciones

Las preguntas son ítems propios exploratorios, con opciones vacías permitidas y exportadas como faltantes. No se presentan como CATS, CESQT, SVS o Stanford Sleepiness Scale. El descanso se registra mediante una selección numérica discreta 0–10, **no una EVA continua**. Confirmar las versiones y condiciones de uso de los instrumentos definitivos antes de sustituirlos.

Antes: actitud hacia siestas (0–4), expectativa de descanso (0–10), desempeño esperado relativo al actual (0–4, extremos peor/mejor), autoevaluación de capacidad (0–10), cafeína en la hora previa, horas de sueño previo, descanso y somnolencia (0–10).

Después: sueño sí/no/incierto, minutos reales del intervalo, minutos estimados de sueño, interrupciones, culpa, vitalidad, descanso y somnolencia (0–10). Después de las tareas se pregunta la autoevaluación de desempeño (0–10). La autoevaluación previa de capacidad y la posterior del desempeño observado no son ítems equivalentes; no se calcula un cambio validado entre ambos.

Atención: 20 ensayos, espera variable de 700–1800 ms y ventana de respuesta de 1000 ms. Las omisiones tienen RT nulo; no se sustituyen por 1000 ms para calcular la mediana. Anticipaciones y omisiones se cuentan por separado. Se informa el número de respuestas válidas y de respuestas válidas con RT ≥500 ms. Es una tarea breve inspirada en vigilancia psicomotora, no un PVT clínicamente validado.

Memoria: 36 estímulos, exposición de 750 ms e intervalo de 180 ms. Los primeros dos estímulos no se puntúan porque no existe aún comparación 2-back. Secuencias reproducibles por código y fase; una repetición dentro de la fase reutiliza la secuencia, por lo que debe considerarse el efecto de práctica. No hay validación de equivalencia entre formas.

El desempeño depende del dispositivo, navegador y contexto. Se cuenta la pérdida de visibilidad durante tareas; esto no constituye vigilancia de atención ni detección completa de interrupciones. Se debe pilotear la duración y adecuación de los ensayos. La espera de atención es aleatoria y no reproducible entre personas; las respuestas y tiempos observados quedan registrados.

## Persistencia y estados

Base IndexedDB `equipo8-siesta-unica-v1`, almacén `sessions`. Cada registro conserva:

| Campo | Contenido |
|---|---|
| `id` | Código aleatorio S- seguido de 12 caracteres hexadecimales |
| `protocol` | `single-nap-v1` |
| `consent_version`, `consented_at` | Versión leída y momento de aceptación |
| `age`, `education` | Edad y grado/posgrado; sin nombre ni correo |
| `stage` | `pre`, `pre_battery`, `nap_ready`, `nap`, `post`, `post_battery`, `final_rating`, `complete` o `withdrawn` |
| `pre`, `post` | Respuestas; opcionales vacías como `null` |
| `interval_started_at` | Fecha absoluta usada para reanudar el contador |
| `attempts` | Intentos con ID, fase, estado, fechas y ensayos individuales |
| `summaries` | Métricas del último intento completo de cada fase |
| `interrupted_attempts` | Intentos interrumpidos; se conservan los datos parciales |
| `visibility_changes` | Veces que el documento pasó a oculto durante tareas |
| `completed_at`, `withdrawn_at` | Fechas cuando corresponda |

Las respuestas de formularios numéricos se guardan como texto o nulo salvo edad. Convertir explícitamente al analizar. Los ensayos registran números, booleanos y RT nulo cuando corresponda. Los filtros de elegibilidad no se almacenan como diagnósticos individuales; continuar supone cumplir los criterios de registro.

## Exportación y análisis

JSON conserva la estructura completa. CSV de ensayos incluye código, fase, ID y estado del intento; no mezclar intentos completos e incompletos sin una regla predefinida. CSV de resumen incluye respuestas, métricas, omisiones y diferencia posterior menos previa de mediana de atención y exactitud 2-back; faltantes no se convierten en cero.

Antes de analizar: revisar datos faltantes, omisiones, anticipaciones, intentos repetidos, tiempo real del intervalo, sueño estimado, cambios de visibilidad y distribución de métricas. Los registros de no sueño y retiro no deben ocultarse. Definir por adelantado la estrategia de inclusión, el resultado primario y los ajustes. Los cambios pre–post y las asociaciones no establecen causalidad.

## Prueba y uso

El modo docente ofrece una demostración con registro ficticio, 3 ensayos de atención, 6 estímulos de memoria y un botón para simular el paso de 25 minutos. La demo vive en memoria, no acepta consentimiento real y no entra a la base ni a exportaciones del conjunto de investigación.

Para uso local abrir mediante HTTP. Para sesiones reales, conservar el mismo navegador y dispositivo; la app no sincroniza datos entre computadoras. La alarma debe configurarse fuera de la página. Cerrar no borra datos; borrar datos del navegador puede perderlos. El equipo debe exportar y custodiar los archivos según el protocolo que apruebe.
