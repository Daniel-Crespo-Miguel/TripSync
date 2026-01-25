# TripSync

**TripSync** es una aplicación web para organizar viajes de manera colaborativa.  
La idea es que cualquier usuario pueda crear un grupo de viaje, invitar a amigos o familiares, gestionar actividades, gastos y llevar un control sencillo de todo lo que implica un viaje compartido.

---

## Tecnologías utilizadas
- [React 18](https://react.dev/) con [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Bootstrap](https://getbootstrap.com/) para el diseño y los estilos
- [Firebase](https://firebase.google.com/) para autenticación y base de datos

---

## Funcionalidades implementadas ✅

### Autenticación y gestión de usuarios
- ✅ Registro e inicio de sesión con email/contraseña (Firebase Auth)
- ✅ Protección de rutas y control de acceso por usuario

### Creación y gestión de grupos
- ✅ Creación de viajes/grupos con nombre, destino y fechas
- ✅ Sistema de invitación por email
- ✅ Dashboard con viajes creados y viajes donde el usuario está invitado
- ✅ Gestión de invitados (solo el creador puede añadir invitados)
- ✅ Validación de destinos mediante geocodificación (Open-Meteo)

### Gestión de gastos compartidos (tipo Tricount)
- ✅ Añadir gastos con descripción, monto y pagador
- ✅ Asignación de gastos a uno o varios participantes
- ✅ Cálculo automático de balances entre participantes
- ✅ Sugerencias de pagos para cuadrar cuentas
- ✅ Visualización de lista de gastos y balances detallados

### Actividades y planificación
- ✅ Creación manual de actividades con título, descripción, fecha y ubicación
- ✅ Sistema de votación/apuntarse a actividades
- ✅ Borrado de actividades con permisos (solo creador del grupo o autor)
- ✅ Sugerencias automáticas de actividades usando OpenStreetMap (Overpass) sin API key
- ✅ Enlaces a Google Maps para ubicaciones de actividades

### Itinerario por días
- ✅ Creación de items de itinerario por fecha y hora opcional
- ✅ Organización por días con orden cronológico
- ✅ Borrado de items con permisos (solo creador del grupo o autor)

### Chat en tiempo real
- ✅ Chat interno por grupo usando Firestore subcolección
- ✅ Mensajes en tiempo real con sincronización instantánea
- ✅ Control de acceso (solo miembros del grupo)

### Clima del destino
- ✅ Previsión meteorológica usando Open-Meteo (sin API key)
- ✅ Uso de coordenadas (lat/lon) para obtener clima preciso
- ✅ Visualización diaria de temperatura, precipitación y viento
- ✅ Geocodificación automática para destinos sin coordenadas

### Transporte
- ✅ Búsqueda de opciones de transporte (vuelos, trenes, buses)
- ✅ Enlaces a Google Flights, Rome2rio, Trainline y Omio
- ✅ Integración con fechas del viaje para búsquedas específicas

### Persistencia y seguridad
- ✅ Base de datos en Firestore con estructura organizada
- ✅ Reglas de permisos básicas por usuario/grupo
- ✅ Sincronización en tiempo real de datos

---

## Estado del proyecto / Roadmap

### ✅ Funcionalidades principales implementadas
- Autenticación completa
- Gestión de grupos y usuarios
- Sistema de gastos con cálculo de balances
- Actividades con votación y sugerencias automáticas
- Itinerario organizado por días
- Chat en tiempo real
- Previsión meteorológica
- Búsqueda de transportes
- Persistencia en Firestore con reglas de seguridad

### 🚧 Rediseño completo de UI/UX pendiente
- El proyecto es funcional a nivel de lógica y backend
- El diseño UI/UX está pendiente y es muy básico
- Será la siguiente gran fase del desarrollo
- Se necesita trabajo de diseño, estilos y experiencia de usuario

### 🔮 Posibles mejoras futuras (opcional)
- Versión móvil usando React Native
- Integración avanzada con Google Maps
- Recomendaciones de equipaje según clima
- Sistema de recordatorios y notificaciones
- Exportación de itinerarios y gastos
- Estadísticas y análisis de viajes

---

## Capturas de pantalla
Por ahora todavía no hay capturas finales, pero planeo añadir algunas cuando tenga un diseño más completo y funcional.

---

## Sobre mí
**Daniel Crespo Miguel**  
[GitHub](https://github.com/Daniel-Crespo-Miguel) | [LinkedIn](#)
