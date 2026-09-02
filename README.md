# Equipo 8 · Siesta y desempeño

Aplicación estática en HTML, CSS y JavaScript vanilla para presentar y probar un estudio sobre actitudes hacia las siestas, expectativas, descanso, culpa y desempeño cognitivo. No requiere instalación ni compilación.

## Enlaces actuales

- [Información del estudio](https://hromo-parra.github.io/siestas-rendimiento-cognitivo/estudio.html).
- [Consentimiento y participación](https://hromo-parra.github.io/siestas-rendimiento-cognitivo/participar.html).
- [Piloto cruzado anterior](https://hromo-parra.github.io/siestas-rendimiento-cognitivo/).

El botón de la página informativa abre ahora un consentimiento dentro del proyecto. No requiere Google Forms ni una encuesta externa. `estudio.html` mantiene HTML y CSS integrados, sin JavaScript; el flujo funcional está en `participar.html` y sus módulos.

## Flujo de una sola siesta

1. Leer el consentimiento; aceptar explícitamente sus tres declaraciones o rechazar.
2. Registrar edad, nivel universitario y criterios de participación. Se genera un código aleatorio, sin nombre, matrícula ni correo.
3. Contestar preguntas previas y realizar tareas abreviadas de atención y memoria.
4. Preparar una alarma propia e iniciar un intervalo de 25 minutos. El contador no emite sonido; la página conserva la hora de inicio aunque se cierre.
5. Registrar sueño real, minutos e interrupciones; responder preguntas y repetir las tareas.
6. Autoevaluar el desempeño posterior y cerrar la sesión.

La duración de aproximadamente 75 minutos corresponde a la propuesta original. Las etapas originales suman 65 minutos y las tareas técnicas actuales son abreviadas; la duración definitiva debe ajustarse tras el pilotaje.

## Consentimiento e instrumentos

El texto completo está en `participar.html`; su versión también se identifica en `single-protocol.js`. Al modificar sustancialmente el texto, actualizar ambas referencias. Se guarda la versión y fecha de aceptación junto al registro; no se registra una aceptación al visitar la página o rechazar.

El texto es un **borrador para revisión del equipo**, con contacto, custodia y revisión ética pendientes, visibles antes de aceptar. No afirma aprobación institucional. Las preguntas son **exploratorias**, no versiones validadas de CATS, CESQT, SVS o Stanford Sleepiness Scale. Revisar [PROTOCOLO-SIESTA-UNICA.md](PROTOCOLO-SIESTA-UNICA.md) antes de una recolección formal.

## Modos y almacenamiento

- **Participante:** consentimiento, registro, evaluaciones, retiro y reanudación desde “Retomar sesión” en el mismo navegador.
- **Docente:** resumen de registros locales y exportación de respaldo JSON, resumen CSV y ensayos CSV.
- **Demostración:** dentro del modo docente, “Probar con datos ficticios” permite recorrer el registro y las actividades, con tareas abreviadas y un control explícito para simular los 25 minutos. No guarda datos de investigación ni crea una aceptación real.

El estudio nuevo usa IndexedDB `equipo8-siesta-unica-v1`; el piloto anterior conserva `nap-study-pilot-v1`. No se mezclan los diseños ni los datos. Las respuestas no se transmiten automáticamente a un servidor. Los formularios se guardan al enviarlos; los ensayos se guardan individualmente. Cerrar la página no borra los registros. El modo docente no tiene autenticación: quien acceda al navegador puede leer o exportar datos locales.

Al retirarse se cancela la tarea activa y la sesión queda marcada como retirada, conservando lo ya guardado. Al retomar una batería interrumpida se registra otro intento; los anteriores quedan marcados como incompletos. No se deben borrar ni ocultar al revisar calidad.

## Desarrollo y publicación

```bash
python3 -m http.server 8016 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8016/estudio.html`. Las tareas necesitan HTTP/HTTPS para cargar módulos y guardar datos; no abrir `participar.html` mediante `file://`.

GitHub Pages publica la raíz de `main`. Enviar los cambios actualiza el sitio sin compilación. Los archivos no contienen claves ni servicios externos de captura de respuestas.

## Archivos del flujo nuevo

- `estudio.html`: presentación informativa independiente.
- `participar.html`: consentimiento, estructura y estilos complementarios.
- `participar.js`: formularios, estados de sesión, navegación, retiro, demo y exportación.
- `single-protocol.js`: constantes, elegibilidad, validación y métricas del estudio nuevo.
- `single-storage.js`: persistencia local en una base independiente.
- `single-tasks.js`: tareas cancelables de atención y 2-back.
- `protocol.js`: se reutiliza únicamente el generador de secuencias 2-back; el flujo anterior conserva sus funciones.
- `PROTOCOLO-SIESTA-UNICA.md`: alcance científico y diccionario de esta versión.

Los documentos `PROTOCOL.md`, `DATA_DICTIONARY.md` y `MANUAL-DE-APLICACION.md` describen el **piloto cruzado anterior de dos sesiones**.

## Verificación

```bash
npm test
npm run check
```

Pruebas de elegibilidad, coherencia de minutos, mediana, omisiones, puntuación 2-back, reloj de 25 minutos y exportación de faltantes. Revisión de navegador: enlace al consentimiento, rechazo, declaraciones inicialmente sin marcar y obligatorias, recorrido de demostración previo–posterior, retiro durante tareas, validación del caso sin sueño, cierre, ausencia de registros de demo y diseño móvil de 375 px.
