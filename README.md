# Pausa y desempeño

Aplicación web del Equipo 8 para pilotear un estudio sobre oportunidad de siesta breve, descanso tranquilo, expectativas, culpa y rendimiento cognitivo.

## Estado

Piloto técnico, no instrumento clínico. La aplicación implementa un diseño cruzado intra-sujeto con dos sesiones contrabalanceadas:

1. Oportunidad de siesta de 25–30 minutos.
2. Descanso tranquilo de duración equivalente.

Cada sesión incluye medición previa, batería cognitiva, intervalo, reporte posterior y la misma batería cognitiva. Las escalas subjetivas son preguntas visuales exploratorias de 0 a 10; no sustituyen instrumentos validados.

## Uso

La aplicación está publicada en:

<https://hromo-parra.github.io/siestas-rendimiento-cognitivo/>

### Página informativa del estudio

<https://hromo-parra.github.io/siestas-rendimiento-cognitivo/estudio.html>

`estudio.html` presenta la información facilitada por el equipo sobre una siesta de 25 minutos, evaluaciones antes y después y una duración total aproximada de 75 minutos. Contiene requisitos, procedimiento, mediciones, privacidad, voluntariedad, riesgos mínimos pendientes de especificar, lista de revisión y seis preguntas frecuentes. Es un archivo autónomo con HTML y CSS integrados, sin JavaScript, formularios ni dependencias externas; puede abrirse directamente en el navegador.

Esta página describe la propuesta de una sola siesta suministrada para la presentación. La aplicación piloto de `index.html` implementa el diseño cruzado descrito arriba; ambas versiones deben armonizarse antes de vincular la página a un flujo de participación.

Para completar la página:

1. Sustituir `href="#link"` por el enlace definitivo al consentimiento o encuesta. Actualmente es un marcador sin destino operativo.
2. Completar el contacto `[por definir]`.
3. Confirmar instrumentos, criterios específicos y detalles del consentimiento señalados como pendientes.
4. Confirmar la distribución del tiempo: las etapas suman 65 minutos y la duración total facilitada es de aproximadamente 75 minutos.

La publicación usa GitHub Pages desde la raíz de la rama `main`; no requiere compilación. Los cambios enviados a esa rama actualizan ambas páginas. Para previsualizar la página informativa con el servidor local indicado abajo, abrir `http://localhost:8015/estudio.html`.

Para desarrollo local:

```bash
python3 -m http.server 8015
```

Después abre `http://localhost:8015`. No abras `index.html` directamente: los módulos JavaScript y el almacenamiento requieren servir el proyecto por HTTP.

## Modos

- **Participante:** registro por código anónimo, medición previa, tareas, pausa y fase posterior.
- **Docente:** avance de sesiones, control de calidad y exportación de respaldo JSON, resumen CSV y ensayos CSV.

Los datos permanecen en IndexedDB en el navegador. La aplicación no envía información a un servidor. El responsable del estudio debe exportar y resguardar los archivos conforme al protocolo aprobado.

## Archivos principales

- `index.html`: estructura base accesible.
- `styles.css`: sistema visual y diseño adaptable.
- `app.js`: flujo del estudio y panel docente.
- `protocol.js`: contrabalanceo, estímulos y cálculo de métricas.
- `tasks.js`: atención sostenida y 2-back.
- `db.js`: persistencia local.
- `csv.js`: exportación.
- `PROTOCOL.md`: propuesta metodológica y decisiones pendientes.
- `DATA_DICTIONARY.md`: estructura de los datos.
- `MANUAL-DE-APLICACION.md`: guía operativa.

## Pruebas

```bash
npm test
```

## Privacidad y seguridad

No se solicitan nombres, matrículas, correos ni fechas de nacimiento. La participación debe contar con consentimiento y aprobación ética institucional antes de recolectar datos reales. Si persiste somnolencia o inercia del sueño, la persona no debe conducir ni realizar tareas de riesgo.
