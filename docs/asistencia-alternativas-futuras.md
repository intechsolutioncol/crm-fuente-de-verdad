# Asistencia — alternativas futuras de identificación

Contexto: el check-in por QR en `/asistencia/checkin` hoy pide buscar el nombre
cada vez. Se implementó la opción 1 (el celular recuerda a la persona). Estas
son las otras alternativas consideradas, por si se quiere avanzar más adelante.

## 2. Aprovechar el login que ya existe en el CRM

Si la persona ya tiene cuenta (inició sesión con Google alguna vez), al abrir
el link de check-in el sistema la reconoce automáticamente vía esa sesión de
Supabase Auth y confirma con un toque — sin buscar nombre. Si nunca ha
iniciado sesión, cae al buscador de siempre.

- **A favor:** identidad 100% verificada (no hay forma de confirmar "por otra
  persona"), reutiliza la infraestructura de auth que ya existe.
- **En contra:** solo funciona para quien ya tiene cuenta y sesión activa —
  visitantes o miembros que nunca se han logueado en su celular siguen
  necesitando el buscador. No resuelve el caso general por sí solo.
- **Cuándo tendría sentido:** como una capa adicional sobre la opción 1 (si
  hay sesión de Supabase, usarla; si no, usar lo guardado en localStorage; si
  no, buscador) — no es excluyente con lo ya implementado.

## 3. Tarjeta / QR personal por miembro (estilo carnet)

En vez de un QR fijo en la puerta, cada miembro tiene su propio QR (impreso
en un carnet físico, o una imagen que se les envía). Alguien en la puerta con
una tablet/celular en "modo escáner" lee el QR de cada persona al pasar.

- **A favor:** verdaderamente 1-toque, cero interacción para quien entra.
- **En contra:** invierte el flujo (la iglesia escanea al miembro, no al
  revés) — hay que generar e imprimir carnets para cada persona, y mantenerlos
  actualizados con miembros nuevos. Necesita a alguien operando un escáner en
  la puerta cada domingo. Bastante más logística que lo actual.
- **Cuándo tendría sentido:** si la congregación crece mucho y el buscador
  por nombre empieza a ser lento con cientos de miembros, o si se quiere una
  experiencia más "evento profesional".

## 4. Persona en la puerta con una tablet (sin QR en absoluto)

Un voluntario con el buscador de nombres (lo que ya se construyó) en una
tablet en la entrada, marcando a la gente por su nombre a medida que entra.

- **A favor:** cero fricción para el asistente — ni siquiera necesita su
  celular ni saber que existe un QR.
- **En contra:** necesita un voluntario fijo cada domingo; puede ser cuello
  de botella si llega mucha gente junta en pocos minutos.
- **Cuándo tendría sentido:** como complemento al QR, no reemplazo — útil
  para niños, adultos mayores sin celular, o visitantes.

## Nota

Ninguna de estas requiere deshacer lo ya construido: el buscador público
(`/api/asistencia/buscar` y `/confirmar`) sigue siendo la base común para
todas — son distintas formas de saltárselo cuando ya se sabe quién es la
persona.
