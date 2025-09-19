\# MiSgro - Prototipo de Sistema de gestión E-commerce



Este es un prototipo de un proyecto de comercio electrónico Full-Stack, construido con \*\*Next.js\*\*, \*\*React\*\* y \*\*ASP.NET Core\*\*. La aplicación demuestra un conjunto de funcionalidades clave para una tienda en línea, incluyendo gestión de productos, autenticación y un panel de análisis.



\### Estado del Proyecto



Este proyecto es un prototipo con el objetivo de demostrar la arquitectura y las funcionalidades principales. Algunas características pueden estar en desarrollo o sujetas a cambios.



\### Características



\* \*\*Autenticación de Usuarios:\*\* Registro e inicio de sesión con roles (Admin, Supervisor, Usuario).

\* \*\*Gestión de Productos:\*\* Los administradores pueden crear, editar y eliminar productos.

\* \*\*Gestión de Inventario y Precios:\*\* Control del stock y precios, incluyendo la gestión de descuentos.

\* \*\*Administración de Pedidos:\*\* Los supervisores pueden ver y gestionar los pedidos.

\* \*\*Análisis y Métricas:\*\* Un panel de supervisor que muestra métricas clave como el total de usuarios, pedidos e ingresos.

\* \*\*Carrito de Compras y Lista de Deseos:\*\* Funcionalidades para que los usuarios gestionen sus productos y compras.

\* \*\*Control de Impuestos:\*\* Un panel de administración para añadir y gestionar impuestos adicionales.

\* \*\*Sistema de Pago:\*\* Integración con Stripe para procesar pagos seguros.

\* \*\*Manejo de Imágenes:\*\* Posibilidad de subir múltiples imágenes para cada producto.

\* \*\*Diseño Responsivo:\*\* Interfaz de usuario adaptativa para distintos dispositivos.



---



\### Tecnologías Utilizadas



\#### Front-End



\* \*\*Next.js y React:\*\* Framework principal para la construcción de la interfaz de usuario.

\* \*\*MUI (Material UI):\*\* Componentes de interfaz de usuario de alta calidad.

\* \*\*Tailwind CSS:\*\* Para estilos y diseño rápido.

\* \*\*Axios:\*\* Cliente HTTP para la comunicación con la API del Back-End.

\* \*\*Chart.js y react-chartjs-2:\*\* Para la visualización de datos en el panel de análisis.

\* \*\*Suneditor y suneditor-react:\*\* Editor de texto enriquecido para descripciones de productos.

\* \*\*Stripe:\*\* Para la integración de pagos.



\#### Back-End



\* \*\*ASP.NET Core:\*\* Framework para la construcción de la API REST.

\* \*\*Entity Framework Core:\*\* Para el acceso a la base de datos (DB First).

\* \*\*JWT (JSON Web Tokens):\*\* Para la autenticación y autorización segura.

\* \*\*BCrypt.Net:\*\* Para el hashing seguro de contraseñas.

\* \*\*MailKit y MimeKit:\*\* Para el envío de correos electrónicos transaccionales (confirmación de pedidos, etc.).

\* \*\*Base de Datos SQL Server:\*\* Utilizada para el almacenamiento de datos.



---



\### Requisitos Previos



Para ejecutar el proyecto, necesitará tener instalado:

\* Node.js (versión 16.x o superior)

\* .NET SDK (versión 6.0 o superior)

\* Una instancia de SQL Server

\* Una cuenta de Stripe para la pasarela de pago



---



\### Configuración del Proyecto



\#### 1. Configuración del Back-End



1\.  Debe abrir el proyecto del Back-End (`Proyecto\_ecommerce.sln`) en Visual Studio.

2\.  Actualice la cadena de conexión en `appsettings.json` para que apunte a su base de datos SQL Server.

3\.  Debe crear la estructura de la base de datos ejecutando los scripts SQL proporcionados.

4\.  Configure las credenciales para los servicios de terceros (Google, X, Stripe, correo electrónico) en `appsettings.json`.

5\.  Ejecute el proyecto del Back-End. La API se ejecutará en una URL como `https://localhost:7223/api`.



\#### 2. Configuración del Front-End



1\.  Debe abrir el proyecto del Front-End en su editor de código preferido.

2\.  En el archivo `.env.local`, actualice las variables de entorno:

&nbsp;   ```

&nbsp;   NEXT\_PUBLIC\_API\_URL=https://localhost:7223/api

&nbsp;   NEXT\_PUBLIC\_FRONTEND\_URL=http://localhost:3000

&nbsp;   ```

3\.  Instale las dependencias de Node.js:

&nbsp;   ```bash

&nbsp;   npm install

&nbsp;   ```

4\.  Ejecute el proyecto de Next.js:

&nbsp;   ```bash

&nbsp;   npm run dev

&nbsp;   ```



El Front-End estará accesible en `http://localhost:3000`.

---



\## Estado del Proyecto



Este es un \*\*prototipo de Sistema de gestión E-commerce\*\*. Si bien es funcional, está diseñado para demostrar mis habilidades técnicas en el desarrollo web Full-Stack.



\## Autor



\* Kenny Rodríguez

\* https://www.linkedin.com/in/kennyrodriguezm/



---

---



\## Estado del Proyecto



Este es un \*\*prototipo de proyecto de portafolio\*\*. Si bien es funcional, está diseñado para demostrar mis habilidades técnicas en el desarrollo web Full-Stack.



\## Autor



\* Kenny Rodríguez



---

