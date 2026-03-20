TripSync

TripSync es una aplicación web para organizar viajes en grupo.
La empecé como proyecto personal a partir de un problema bastante común: organizar un viaje entre varias personas suele acabar siendo caótico, con ideas que se pierden entre mensajes y decisiones que no llegan a cerrarse.

Además de intentar solucionar eso, el objetivo del proyecto era aprender y trabajar con un stack moderno en un contexto real, no en un proyecto de prueba aislado. Quería enfrentarme a los mismos problemas que aparecen cuando una aplicación empieza a crecer de verdad.

Demo

La aplicación está desplegada y se puede probar en:
https://www.tripsync.es

Es posible crear una cuenta y utilizarla libremente.

Qué permite hacer TripSync

La aplicación permite crear grupos de viaje en los que los participantes pueden proponer actividades, votarlas y, a partir de ahí, construir un itinerario común.
También incluye un sistema de sugerencias de puntos de interés cercanos y actualizaciones en tiempo real para que todos los miembros vean los cambios al momento.

La idea es tener en un solo sitio todo lo relacionado con la planificación del viaje y evitar depender de varios chats o documentos separados.

Tecnologías utilizadas

El frontend está desarrollado con React y TypeScript utilizando Vite como herramienta de desarrollo.
La autenticación de usuarios se gestiona con Firebase Auth y la información se almacena en Firestore, aprovechando su capacidad de sincronización en tiempo real.

Para enriquecer la experiencia, la aplicación consume APIs externas como Open-Meteo para la información meteorológica y OpenStreetMap (a través de Overpass) para obtener puntos de interés.

El despliegue se realiza en AWS Amplify, con integración continua y dominio personalizado con HTTPS.

Algunas decisiones técnicas

Desde el principio intenté separar la lógica de negocio de la parte visual para que el proyecto fuera más fácil de mantener y de ampliar.
También se ha priorizado una experiencia de usuario clara y directa, con feedback inmediato ante las acciones importantes.

El proyecto se ha construido de forma incremental, añadiendo funcionalidades poco a poco y ajustando decisiones a medida que aparecían problemas reales.

Trabajo en progreso

Aunque la aplicación es totalmente funcional, sigue siendo un proyecto en evolución.
Hay aspectos que quiero seguir mejorando, como la validación de fechas en actividades e itinerarios, algunos detalles de experiencia de usuario y la incorporación de tests básicos para la lógica principal.
