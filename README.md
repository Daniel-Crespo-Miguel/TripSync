TripSync
TripSync es una aplicación web para organizar viajes en grupo. La empecé como proyecto personal a partir de un problema bastante común: organizar un viaje entre varias personas suele acabar siendo caótico, con ideas que se pierden entre mensajes y decisiones que no llegan a cerrarse.
Con el tiempo el proyecto fue creciendo bastante más de lo que esperaba. Lo que empezó como una forma de aprender Firebase en un caso real acabó convirtiéndose en una aplicación completa con múltiples integraciones de inteligencia artificial, planificación multi-destino y un chat grupal con asistente IA integrado.
Demo
La aplicación está desplegada y se puede probar en:
https://www.tripsync.es
Es posible crear una cuenta y utilizarla libremente.
Qué permite hacer TripSync
La aplicación permite crear grupos de viaje en los que los participantes pueden proponer actividades, votarlas y construir un itinerario común. También incluye un sistema de gastos compartidos para saber en todo momento quién le debe qué a quién, además de un chat en tiempo real para mantener toda la comunicación dentro del propio grupo.
Una de las funcionalidades más recientes es el soporte para viajes multi-destino. Cada grupo puede dividirse en tramos independientes, cada uno con su propio destino, fechas, actividades e itinerario. Un botón flotante permite cambiar entre tramos en cualquier momento desde cualquier parte de la aplicación, sin perder el contexto del viaje.
Además de la planificación manual, se han integrado funcionalidades basadas en inteligencia artificial para automatizar las partes que normalmente consumen más tiempo.
Funcionalidades de IA
TripSync integra seis flujos de inteligencia artificial basados en Claude de Anthropic:
Sugerencias de tramos con IA. A partir del destino, los días disponibles y las preferencias del grupo escritas en lenguaje natural, la IA propone cómo dividir el viaje en destinos con una duración optimizada para cada uno. El usuario puede ajustar los días sugeridos antes de confirmar la creación.
Sugerencias de actividades. La IA genera propuestas de actividades personalizadas según el destino del tramo activo, el clima y el perfil del grupo. Las sugerencias se pueden añadir directamente al tramo con un clic.
Generador de itinerario completo. A partir de las actividades del tramo, la IA construye un itinerario día a día estructurado. El resultado se guarda en Firestore y se puede editar de forma inline.
Sugerencias de transporte. Comparativa inteligente de opciones de transporte entre los destinos del viaje, con contexto de fechas y duración de cada tramo.
Extracción automática de PDFs. Al subir un documento de reserva (vuelo, hotel, actividad), la IA extrae automáticamente la información relevante: fechas, importes, referencia y tipo de reserva, y la añade al timeline de documentos del grupo.
Chat IA contextual compartido. Dentro del chat grupal existe un asistente de IA que conoce el contexto completo del viaje: tramos, actividades, gastos y participantes. Cualquier miembro puede hacerle una pregunta y la respuesta es visible para todo el grupo en tiempo real, guardada en Firestore como un mensaje más del chat.
Análisis de sentimiento en feedback. Al finalizar el viaje, los participantes pueden dejar feedback. La IA analiza el sentimiento de cada respuesta y genera un dashboard con el resumen emocional del grupo.
Tecnologías utilizadas
El frontend está desarrollado con React y TypeScript utilizando Vite como herramienta de desarrollo. La autenticación de usuarios se gestiona con Firebase Auth y la información se almacena en Firestore, aprovechando su capacidad de sincronización en tiempo real. Los archivos adjuntos (PDFs de reservas) se almacenan en Supabase Storage.
Para enriquecer la experiencia, la aplicación consume APIs externas como Open-Meteo para la información meteorológica, OpenStreetMap a través de Overpass para obtener puntos de interés, y Unsplash para las imágenes de los destinos.
En cuanto a la parte de IA, se utilizan modelos de Anthropic (Claude Haiku 4.5). Para la mayoría de flujos se utiliza n8n como capa intermedia: el frontend envía el contexto del viaje a un webhook y recibe una respuesta estructurada en JSON. Esto permite mantener las claves fuera del cliente, controlar los prompts de forma centralizada y añadir lógica de validación antes y después de cada llamada al modelo. Actualmente hay cinco workflows independientes en n8n, cada uno especializado en una fase distinta del viaje.
Para la extracción de información de PDFs se realiza una llamada directa a la API de Anthropic desde el cliente, enviando el documento en base64 y aprovechando el soporte nativo de documentos del modelo.
El despliegue se realiza en AWS Amplify con integración continua desde GitHub y dominio personalizado con HTTPS.
Algunas decisiones técnicas
Desde el principio intenté separar la lógica de negocio de la parte visual para que el proyecto fuera más fácil de mantener y de ampliar. La lógica de cada feature de IA vive en su propio hook o función de servicio, desacoplada del componente que la consume.
En la parte de IA, una decisión importante ha sido forzar respuestas estructuradas en JSON desde el modelo para simplificar su integración en el frontend y evitar parsing complejo o comportamientos impredecibles. Todos los workflows incluyen un nodo de validación que verifica la estructura antes de devolver la respuesta al cliente, con un fallback a datos mock cuando el webhook no está disponible.
La arquitectura multi-destino se construyó sobre una migración automática de los grupos existentes: al detectar que un grupo no tiene tramos, se crea automáticamente el primero a partir de los datos del grupo raíz y se migran las actividades e itinerario existentes a la nueva estructura de subcolecciones, todo en un batch write de Firestore.
El proyecto se ha construido de forma incremental, añadiendo funcionalidades poco a poco y ajustando decisiones a medida que aparecían problemas reales de uso.
Estado actual
La aplicación es totalmente funcional y está desplegada en producción. Sigue siendo un proyecto en evolución: hay aspectos de experiencia de usuario que quiero seguir refinando y la calidad de las sugerencias de IA es algo sobre lo que se puede iterar continuamente ajustando los prompts y el contexto que se envía al modelo.