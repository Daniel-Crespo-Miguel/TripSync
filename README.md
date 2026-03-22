TripSync

TripSync es una aplicación web para organizar viajes en grupo. La empecé como proyecto personal a partir de un problema bastante común: organizar un viaje entre varias personas suele acabar siendo caótico, con ideas que se pierden entre mensajes y decisiones que no llegan a cerrarse.

Con el tiempo el proyecto fue creciendo bastante más de lo que esperaba. Lo que empezó como una forma de aprender Firebase en un caso real acabó convirtiéndose en una aplicación completa donde intento centralizar todo lo necesario para planificar un viaje en grupo sin depender de múltiples herramientas externas.

Demo

La aplicación está desplegada y se puede probar en:
https://www.tripsync.es

Es posible crear una cuenta y utilizarla libremente.

Qué permite hacer TripSync

La aplicación permite crear grupos de viaje en los que los participantes pueden proponer actividades, votarlas y, a partir de ahí, construir un itinerario común. También incluye un sistema de gastos compartidos para saber en todo momento quién le debe qué a quién, además de un chat en tiempo real para mantener toda la comunicación dentro del propio grupo.

Además, se han ido añadiendo funcionalidades para reducir fricción en tareas típicas del viaje. Por ejemplo, consultar el clima del destino directamente desde la app o sugerir puntos de interés cercanos.

Más recientemente he empezado a integrar funcionalidades basadas en IA para automatizar partes que normalmente consumen bastante tiempo, como generar sugerencias de actividades en base al destino y preferencias del grupo, analizar feedback o extraer información de reservas en PDF.

La idea general es tener en un solo sitio todo lo relacionado con la planificación del viaje y evitar depender de varios chats o documentos separados.

Tecnologías utilizadas

El frontend está desarrollado con React y TypeScript utilizando Vite como herramienta de desarrollo. La autenticación de usuarios se gestiona con Firebase Auth y la información se almacena en Firestore, aprovechando su capacidad de sincronización en tiempo real.

Para enriquecer la experiencia, la aplicación consume APIs externas como Open-Meteo para la información meteorológica y OpenStreetMap (a través de Overpass) para obtener puntos de interés. También se utiliza la API de Unsplash para obtener imágenes de los destinos.

En cuanto a la parte de IA, se utilizan modelos de Anthropic (Claude). Para la mayoría de flujos (sugerencias de actividades, análisis de feedback, etc.) se utiliza n8n como intermediario, de forma que el frontend envía el contexto del viaje a un webhook y recibe una respuesta estructurada en JSON. Esto permite mantener las claves fuera del cliente y tener mayor control sobre los prompts y la lógica.

Para la extracción de información de documentos PDF, se realiza una llamada directa a la API de Anthropic desde el cliente, enviando el documento en base64 y obteniendo los datos relevantes ya estructurados.

El despliegue se realiza en AWS Amplify, con integración continua y dominio personalizado con HTTPS.

Algunas decisiones técnicas

Desde el principio intenté separar la lógica de negocio de la parte visual para que el proyecto fuera más fácil de mantener y de ampliar. También se ha priorizado una experiencia de usuario clara y directa, con feedback inmediato ante las acciones importantes.

En la parte de IA, una decisión importante ha sido forzar respuestas estructuradas (JSON) desde el modelo para simplificar su integración en el frontend y evitar parsing complejo o comportamientos impredecibles.

El proyecto se ha construido de forma incremental, añadiendo funcionalidades poco a poco y ajustando decisiones a medida que aparecían problemas reales.

Trabajo en progreso

Aunque la aplicación es totalmente funcional, sigue siendo un proyecto en evolución. Hay aspectos que quiero seguir mejorando, como la validación de fechas en actividades e itinerarios, algunos detalles de experiencia de usuario y la robustez de ciertas interacciones en tiempo real.

También quiero seguir iterando sobre las funcionalidades de IA, especialmente en la calidad de las sugerencias y en cómo se integran dentro del flujo de uso sin que resulten intrusivas.
