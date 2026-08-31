# Pausa y desempeño

Aplicación web del Equipo 8 para pilotear un estudio sobre oportunidad de siesta breve, descanso tranquilo, expectativas, culpa y rendimiento cognitivo.

## Estado

Piloto técnico, no instrumento clínico. La aplicación implementa un diseño cruzado intra-sujeto con dos sesiones contrabalanceadas:

1. Oportunidad de siesta de 25–30 minutos.
2. Descanso tranquilo de duración equivalente.

Cada sesión incluye medición previa, batería cognitiva, intervalo, reporte posterior y la misma batería cognitiva. Las escalas subjetivas son preguntas visuales exploratorias de 0 a 10; no sustituyen instrumentos validados.

## Uso

La versión publicada estará en:

<https://hromo-parra.github.io/siestas-rendimiento-cognitivo/>

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

