// Datos geográficos — Colombia y países
// Estructura: País → Departamento → Municipio → Barrio (sugerencias)

export const PAISES: string[] = [
  'Colombia',
  'Venezuela', 'Ecuador', 'Perú', 'Bolivia', 'Brasil', 'Argentina',
  'Chile', 'Paraguay', 'Uruguay', 'Panamá', 'Costa Rica', 'Nicaragua',
  'Honduras', 'El Salvador', 'Guatemala', 'México', 'Cuba',
  'República Dominicana', 'Haití', 'Jamaica', 'Puerto Rico',
  'Estados Unidos', 'Canadá', 'España', 'Francia', 'Italia',
  'Alemania', 'Reino Unido', 'Portugal', 'Países Bajos', 'Australia', 'Otro',
]

export const DEPARTAMENTOS: string[] = [
  'Bogotá D.C.',
  'Antioquia', 'Valle del Cauca', 'Atlántico', 'Bolívar', 'Santander',
  'Cundinamarca', 'Córdoba', 'Norte de Santander', 'Nariño', 'Cauca',
  'Huila', 'Magdalena', 'Risaralda', 'Caldas', 'Meta', 'Boyacá',
  'Sucre', 'Cesar', 'Tolima', 'Quindío', 'La Guajira', 'Chocó',
  'Caquetá', 'Arauca', 'Casanare', 'Putumayo', 'San Andrés y Providencia',
  'Amazonas', 'Guainía', 'Guaviare', 'Vaupés', 'Vichada',
]

export const MUNICIPIOS: Record<string, string[]> = {
  'Bogotá D.C.': ['Bogotá D.C.'],

  'Antioquia': [
    'Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Sabaneta',
    'La Estrella', 'Caldas', 'Copacabana', 'Girardota', 'Barbosa', 'Rionegro',
    'Marinilla', 'El Carmen de Viboral', 'La Ceja', 'El Retiro', 'Guarne',
    'San Vicente Ferrer', 'Caucasia', 'Chigorodó', 'Carepa', 'Turbo',
    'Necoclí', 'San Pedro de Urabá', 'Andes', 'Jericó', 'Ciudad Bolívar',
    'Salgar', 'Urrao', 'Santa Fe de Antioquia', 'Sopetrán', 'San Jerónimo',
    'Ebéjico', 'Yarumal', 'Valdivia', 'Tarazá', 'El Bagre', 'Zaragoza',
    'Puerto Berrío', 'Yondó', 'Puerto Nare', 'Puerto Triunfo', 'Segovia',
    'Remedios', 'Vegachí', 'Cisneros', 'Santo Domingo', 'Alejandría',
    'San Rafael', 'Amagá', 'Angelópolis', 'Fredonia', 'Venecia', 'Titiribí',
    'Aure', 'Heliconia', 'Liborina', 'Peque', 'Buriticá', 'Cañasgordas',
    'Frontino', 'Mutatá', 'Dabeiba', 'Vigía del Fuerte', 'Anorí',
    'Campamento', 'Angostura', 'Ituango', 'Briceño', 'Santa Rosa de Osos',
    'Donmatías', 'Entrerríos', 'San Pedro de los Milagros', 'Belmira',
    'Gómez Plata', 'Guadalupe', 'Carolina del Príncipe', 'San José de la Montaña',
    'Concepción', 'San Luis', 'San Carlos', 'Granada', 'Argelia',
    'Nariño', 'Cocorná', 'San Francisco',
  ],

  'Valle del Cauca': [
    'Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga',
    'Jamundí', 'Yumbo', 'Candelaria', 'Caicedonia', 'Sevilla', 'Zarzal',
    'La Victoria', 'Obando', 'Ansermanuevo', 'El Cairo', 'El Águila',
    'Versalles', 'La Unión', 'Roldanillo', 'Bolívar', 'Bugalagrande',
    'Andalucía', 'Cerrito', 'Ginebra', 'Guacarí', 'Pradera', 'Florida',
    'Miranda', 'Corinto', 'Vijes', 'Dagua', 'La Cumbre', 'Trujillo',
    'Restrepo', 'San Pedro', 'Alcalá', 'Ulloa', 'Argelia', 'El Dovio',
  ],

  'Atlántico': [
    'Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Baranoa',
    'Galapa', 'Tubará', 'Santo Tomás', 'Sabanagrande', 'Palmar de Varela',
    'Ponedera', 'Campo de la Cruz', 'Suán', 'Santa Lucía', 'Candelaria',
    'Juan de Acosta', 'Usiacurí', 'Polonuevo', 'Piojó', 'Luruaco',
    'Repelón', 'Manatí', 'Puerto Colombia',
  ],

  'Bolívar': [
    'Cartagena', 'Magangué', 'Turbaco', 'El Carmen de Bolívar', 'Mompox',
    'Arjona', 'María la Baja', 'Simití', 'Achí', 'San Jacinto',
    'Zambrano', 'Cicuco', 'Talaigua Nuevo', 'Córdoba',
  ],

  'Santander': [
    'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja',
    'San Gil', 'Socorro', 'Vélez', 'Barbosa', 'Lebrija', 'Málaga',
    'Charalá', 'Mogotes', 'Oiba', 'El Playón', 'Rionegro', 'Sabana de Torres',
    'Puerto Wilches', 'Betulia', 'Aratoca', 'Curití', 'Simacota',
  ],

  'Cundinamarca': [
    'Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Fusagasugá', 'Madrid',
    'Mosquera', 'Girardot', 'Funza', 'Cajicá', 'La Mesa', 'Tocancipá',
    'Sibaté', 'Cogua', 'Tabio', 'Tenjo', 'Cota', 'Bojacá', 'El Rosal',
    'Subachoque', 'Sopó', 'Guasca', 'La Calera', 'Choachí', 'Guatavita',
    'Sesquilé', 'Gachancipá', 'Nemocón', 'Suesca', 'Ubaté', 'Villeta',
    'Nocaima', 'Nimaima', 'La Vega', 'Anapoima', 'Apulo', 'Agua de Dios',
    'Ricaurte', 'Nilo', 'Arbeláez', 'Pasca', 'San Bernardo', 'Tibacuy',
  ],

  'Córdoba': [
    'Montería', 'Cereté', 'Lorica', 'Sahagún', 'Montelíbano',
    'Puerto Libertador', 'Planeta Rica', 'Tierralta', 'Ciénaga de Oro',
    'San Pelayo', 'Chinú', 'Momil', 'Purísima', 'Tuchín', 'Cotorra',
    'Ayapel', 'La Apartada', 'Buenavista', 'San Bernardo del Viento',
  ],

  'Norte de Santander': [
    'Cúcuta', 'Villa del Rosario', 'Los Patios', 'El Zulia', 'Pamplona',
    'Ocaña', 'Tibú', 'Bucarasica', 'Sardinata', 'La Esperanza',
    'Chinácota', 'Puerto Santander', 'Abrego', 'Convención', 'Teorama',
    'El Carmen', 'San Calixto', 'Hacarí',
  ],

  'Nariño': [
    'Pasto', 'Tumaco', 'Ipiales', 'Túquerres', 'La Unión', 'Samaniego',
    'Barbacoas', 'El Charco', 'Olaya Herrera', 'Ricaurte', 'Cumbal',
    'Guachucal', 'Buesaco', 'La Florida', 'Tangua', 'Ancuya',
  ],

  'Cauca': [
    'Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía',
    'Bolívar', 'Mercaderes', 'Piendamó', 'El Tambo', 'Timbío',
    'Corinto', 'Miranda', 'Caloto', 'Toribío', 'Silvia', 'Inzá',
    'Páez', 'La Sierra', 'Rosas',
  ],

  'Huila': [
    'Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre',
    'Rivera', 'Gigante', 'Palermo', 'Yaguará', 'Tesalia',
    'Aipe', 'Villavieja', 'Santa María', 'Timaná', 'Suaza',
    'Acevedo', 'Algeciras',
  ],

  'Magdalena': [
    'Santa Marta', 'Ciénaga', 'Fundación', 'El Banco', 'Aracataca',
    'Plato', 'Pivijay', 'Nueva Granada', 'Zona Bananera', 'Concordia',
    'El Difícil', 'San Zenón', 'Salamina',
  ],

  'Risaralda': [
    'Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia',
    'Marsella', 'Quinchía', 'Belén de Umbría', 'Balboa', 'Apia',
    'La Celia', 'Mistrató', 'Pueblo Rico', 'Guática',
  ],

  'Caldas': [
    'Manizales', 'Villamaría', 'Chinchiná', 'La Dorada', 'Riosucio',
    'Supía', 'Anserma', 'Manzanares', 'Salamina', 'Aguadas',
    'Pensilvania', 'Filadelfia', 'Pácora', 'Neira', 'Viterbo',
    'Belalcázar', 'San José',
  ],

  'Meta': [
    'Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'Puerto Gaitán',
    'San Martín', 'Cumaral', 'Restrepo', 'Guamal', 'El Castillo',
    'Lejanías', 'Vista Hermosa', 'La Macarena', 'Uribe', 'Fuente de Oro',
  ],

  'Boyacá': [
    'Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa',
    'Moniquirá', 'Ramiriquí', 'Miraflores', 'Garagoa', 'Villa de Leyva',
    'Puerto Boyacá', 'Muzo', 'Quípama', 'Otanche', 'Socha', 'Paz de Río',
    'Tibasosa', 'Nobsa', 'Santa Rosa de Viterbo',
  ],

  'Sucre': [
    'Sincelejo', 'Corozal', 'Sampués', 'San Marcos', 'Tolú', 'Coveñas',
    'El Roble', 'Morroa', 'Sincé', 'Buenavista', 'San Onofre', 'Ovejas',
    'Los Palmitos', 'Galeras',
  ],

  'Cesar': [
    'Valledupar', 'Aguachica', 'Codazzi', 'La Paz', 'Curumaní',
    'Chimichagua', 'Pailitas', 'Tamalameque', 'El Copey', 'Becerril',
    'Bosconia', 'El Paso', 'La Gloria', 'San Alberto', 'San Martín',
  ],

  'Tolima': [
    'Ibagué', 'Espinal', 'Chaparral', 'Honda', 'Líbano', 'Fresno',
    'Armero-Guayabal', 'Lérida', 'Mariquita', 'Falán', 'Guamo',
    'Purificación', 'Natagaima', 'Ortega', 'Rovira', 'Melgar',
    'Carmen de Apicalá', 'Cunday', 'Icononzo', 'Villarrica',
  ],

  'Quindío': [
    'Armenia', 'Calarcá', 'Montenegro', 'Quimbaya', 'La Tebaida',
    'Circasia', 'Filandia', 'Salento', 'Pijao', 'Buenavista',
    'Génova', 'Córdoba',
  ],

  'La Guajira': [
    'Riohacha', 'Maicao', 'Uribia', 'Manaure', 'San Juan del Cesar',
    'Albania', 'Barrancas', 'Hatonuevo', 'Villanueva', 'Fonseca',
    'Dibulla', 'Distracción', 'El Molino',
  ],

  'Chocó': [
    'Quibdó', 'Istmina', 'Tadó', 'Riosucio', 'Bojayá',
    'Sipí', 'Condoto', 'Novitá', 'Medio San Juan', 'Acandí',
    'Unguía', 'Juradó',
  ],

  'Caquetá': [
    'Florencia', 'San Vicente del Caguán', 'Puerto Rico', 'El Doncello',
    'El Paujil', 'La Montañita', 'Milán', 'Morelia', 'Albania',
    'Curillo', 'Valparaíso', 'Belén de los Andaquíes',
  ],

  'Arauca': [
    'Arauca', 'Arauquita', 'Saravena', 'Tame', 'Fortul',
    'Puerto Rondón', 'Cravo Norte',
  ],

  'Casanare': [
    'Yopal', 'Aguazul', 'Villanueva', 'Tauramena', 'Paz de Ariporo',
    'Monterrey', 'Maní', 'Orocué', 'Trinidad', 'San Luis de Palenque',
    'Pore', 'Nunchía', 'Sácama',
  ],

  'Putumayo': [
    'Mocoa', 'Puerto Asís', 'Villagarzón', 'Orito', 'Valle del Guamuéz',
    'Puerto Leguízamo', 'Puerto Caicedo', 'San Miguel', 'Colón',
    'Sibundoy', 'San Francisco', 'Santiago',
  ],

  'San Andrés y Providencia': ['San Andrés', 'Providencia y Santa Catalina'],
  'Amazonas': ['Leticia', 'Puerto Nariño'],
  'Guainía': ['Inírida', 'Barrancominas'],
  'Guaviare': ['San José del Guaviare', 'El Retorno', 'Calamar', 'Miraflores'],
  'Vaupés': ['Mitú', 'Carurú', 'Taraira'],
  'Vichada': ['Puerto Carreño', 'La Primavera', 'Santa Rosalía', 'Cumaribo'],
}

// Barrios por municipio — cobertura amplia para Antioquia y principales ciudades
export const BARRIOS: Record<string, string[]> = {
  'Medellín': [
    // El Poblado
    'El Poblado', 'La Florida', 'Manila', 'Astorga', 'Alejandría',
    'El Diamante', 'Provenza', 'Patio Bonito', 'El Tesoro', 'Castropol',
    'Los Balsos', 'Lalinde', 'Aguacatala', 'Santa María de los Ángeles',
    'Las Lomas', 'Los Naranjos', 'El Escobero',
    // Laureles - Estadio
    'Laureles', 'Estadio', 'Los Conquistadores', 'Las Acacias', 'Lorena',
    'El Velódromo', 'Bolivariana', 'Carlos E. Restrepo', 'La Castellana',
    'La Colina', 'Suramericana',
    // La América
    'La América', 'Los Colores', 'Calasanz', 'Calasanz Parte Alta',
    'La Floresta', 'Santa Lucía', 'El Danubio', 'Campo Alegre', 'El Fresno',
    // Belén
    'Belén', 'Los Alpes', 'Las Playas', 'Diego Echavarría', 'La Mota',
    'La Palma', 'Miravalle', 'Rosales', 'El Rincón', 'La Gloria',
    'Nogal', 'Loma de Los Bernal', 'El Meléndez', 'Fátima', 'La Colina',
    // Robledo
    'Robledo', 'Córdoba', 'López de Mesa', 'Bello Horizonte', 'La Pilarica',
    'Bosques de San Pablo', 'Aures', 'El Diamante', 'El Pesebre',
    // Castilla
    'Castilla', 'Florencia', 'Las Brisas', 'Caribe', 'Francisco Antonio Zea',
    'El Progreso', 'Toscana', 'Villa Flora', 'Tejelo', 'Tricentenario',
    // Doce de Octubre
    'Doce de Octubre', 'Kennedy', 'Picacho', 'Picachito', 'La Esperanza',
    'El Triunfo', 'San Martín de Porres',
    // Aranjuez
    'Aranjuez', 'Berlín', 'Moravia', 'San Isidro', 'Las Esmeraldas',
    'Palermo', 'La Piñuela', 'El Bosque', 'Los Álamos', 'La Salle',
    // Manrique
    'Manrique', 'La Cruz', 'Versalles', 'El Raizal', 'El Pomar',
    'Villa Jardín', 'Las Granjas',
    // Santa Cruz
    'Santa Cruz', 'La Isla', 'El Playón de Los Comuneros', 'La Francia',
    'Moscú', 'Villa del Socorro',
    // Popular
    'Popular', 'Santo Domingo Savio', 'Villa de Guadalupe', 'San Pablo',
    'La Esperanza No. 2', 'Granizal', 'Villa Niza', 'Carpinelo',
    // Buenos Aires
    'Buenos Aires', 'La Milagrosa', 'Enciso', 'Sucre', 'El Pinal',
    'Trece de Noviembre', 'Villatina', 'Las Estancias',
    // San Javier
    'San Javier', 'El Salado', 'La Quiebra', 'Nuevos Conquistadores',
    'Eduardo Santos', 'El Corazón', 'Belencito', 'Betania', 'Blanquizal',
    // Guayabal
    'Guayabal', 'Tenche', 'Campo Amor',
    // La Candelaria (Centro)
    'La Candelaria', 'Boston', 'Villanueva', 'El Chagualo', 'Jesús Nazareno',
    'El Calvario', 'Barrio Colón', 'San Benito',
    // Corregimientos
    'San Antonio de Prado', 'San Cristóbal', 'Altavista', 'Santa Elena', 'Palmitas',
  ],

  'Envigado': [
    'El Portal', 'El Dorado', 'El Salado', 'Alcalá', 'Los Naranjos',
    'La Mina', 'Los Cedritos', 'Loma del Atravesado', 'Las Vegas',
    'Zúñiga', 'La Inmaculada', 'Jardines', 'El Esmeraldal', 'Uribe Ángel',
    'El Trianón', 'Primavera', 'San José', 'Playas del Sur', 'El Chocho',
    'El Vallano', 'La Paz', 'Las Palmas', 'El Carmelo',
  ],

  'Itagüí': [
    'El Rosario', 'La Gabriela', 'San Pío', 'Ditaires', 'Los Naranjos',
    'La Finca', 'Santa María', 'Calatrava', 'La Flora', 'Simón Bolívar',
    'El Vergel', 'Castilla', 'Ciudad Campestre', 'Suramericana',
    'La Independencia', 'Fuente Clara', 'Las Margaritas', 'La Aldea',
    'Nuevo Hogar', 'Olivares', 'San Fernando', 'El Progreso', 'El Tablazo',
  ],

  'Bello': [
    'Centro', 'Niquía', 'La Madera', 'Zamora', 'París', 'Fontidueño',
    'Guasimalito', 'El Carmelo', 'Hato Viejo', 'Los Ciruelos', 'El Trapiche',
    'Calle Colombia', 'Altos de Niquía', 'La Palma', 'Pachelly',
    'Santo Domingo', 'El Pinal', 'Acevedo', 'Mirador', 'El Museo',
    'La China', 'Andalucía', 'Polo Club', 'San José', 'Villa de Occidente',
  ],

  'Sabaneta': [
    'Vía Las Palmas', 'El Carmelo', 'La Doctora', 'María Auxiliadora',
    'Las Lomitas', 'Pan de Azúcar', 'El Progreso', 'La Finca',
    'Aves María', 'San Javier', 'Las Margaritas', 'Cañaveralejo',
    'La Colina', 'El Pedregal', 'San José',
  ],

  'La Estrella': [
    'El Rosario', 'Ancón', 'San Isidro', 'La Tablaza',
    'Pueblito', 'La Ferrería', 'Ladera', 'El Condado', 'San Ángel',
  ],

  'Caldas': [
    'El Llano', 'La Salada', 'La Miel', 'Cardalito', 'Primavera',
    'El Centro', 'La Valeria', 'Pedregal', 'El Pinar',
  ],

  'Copacabana': [
    'El Centro', 'Machado', 'El Caribe', 'Sucre', 'Aldea',
    'Yarumito', 'San Isidro', 'Niquía', 'Fontidueño',
  ],

  'Girardota': [
    'El Centro', 'Portachuelo', 'La Ceja', 'Machado',
    'Loma de los Zuleta', 'Juan XIII',
  ],

  'Rionegro': [
    'El Centro', 'El Porvenir', 'Las Vegas', 'Muñoz', 'La Macarena',
    'San Antonio', 'Tablazo', 'La Fe', 'Cuatro Esquinas', 'El Tronco',
  ],

  'Bogotá D.C.': [
    // Localidades
    'Usaquén', 'Chapinero', 'Santa Fe', 'San Cristóbal', 'Usme',
    'Tunjuelito', 'Bosa', 'Kennedy', 'Fontibón', 'Engativá', 'Suba',
    'Barrios Unidos', 'Teusaquillo', 'Los Mártires', 'Antonio Nariño',
    'Puente Aranda', 'La Candelaria', 'Rafael Uribe Uribe', 'Ciudad Bolívar',
    // Barrios conocidos
    'El Chicó', 'Rosales', 'El Nogal', 'La Cabrera', 'Cedritos',
    'Santa Bárbara', 'Los Arrayanes', 'La Alhambra', 'Bella Suiza',
    'El Prado', 'La Castellana', 'Niza', 'Suba Centro', 'Zona Rosa',
    'Unicentro', 'Colina Campestre', 'Hayuelos', 'Modelia', 'Ciudad Salitre',
    'Bosa Centro', 'San Bernardino', 'Gran Britalia', 'Patio Bonito',
    'Kennedy Central', 'Carvajal', 'Timiza', 'Ciudad Montes', 'Muzú',
    'Restrepo', 'Marco Fidel Suárez', 'La Macarena', 'Samper Mendoza',
    'Palermo', 'La Soledad', 'Galerías', 'Quinta Paredes',
    'La Concepción', 'Primero de Mayo', 'Libertador', 'Diana Turbay',
    'Santa Librada', 'Danubio Azul', 'El Mochuelo', 'Lucero',
  ],

  'Cali': [
    'El Centro', 'San Nicolás', 'La Merced', 'San Pascual', 'El Peñón',
    'San Antonio', 'Granada', 'Centenario', 'Barrio Obrero', 'Sucre',
    'Alameda', 'Santa Mónica', 'Prados del Norte', 'Versalles', 'Bretaña',
    'La Base', 'Chipichape', 'Santa Teresita', 'Los Ángeles', 'Tequendama',
    'El Ingenio', 'Ciudad Jardín', 'Pance', 'La Cascada', 'Limonar',
    'Valle del Lili', 'Caney', 'Meléndez', 'Salomia', 'El Troncal',
    'Calimío', 'Floralia', 'Alfonso López', 'Marroquín', 'El Poblado',
    'Aguablanca', 'Villanueva', 'La Selva', 'Olímpico', 'Las Américas',
    'El Guabito', 'La Sultana', 'Bellavista', 'Ciudad Córdoba', 'El Ingenio',
    'Urbanización Colseguros', 'La Hacienda', 'Acuarela del Valle',
  ],

  'Barranquilla': [
    'El Prado', 'Altamira', 'Los Alpes', 'El Rosario', 'Miramar', 'Boston',
    'La Enea', 'Bella Vista', 'El Golf', 'Villa Santos', 'Ciudad Jardín',
    'Riomar', 'Las Flores', 'La Playa', 'Recreo', 'Los Andes', 'Simón Bolívar',
    'Barranquillita', 'El Centro', 'La Manga', 'Las Américas', 'La Paz',
    'El Porvenir', 'El Bosque', 'Metropolitano del Norte', 'San José',
    'El Valle', 'Soledad 2000', 'Ciudadela 20 de Julio', 'Villate',
    'Las Palmas', 'Alfonso López', 'San Salvador', 'El Tabor',
  ],

  'Bucaramanga': [
    'El Centro', 'Cabecera del Llano', 'García Rovira', 'San Francisco',
    'Sotomayor', 'Los Comuneros', 'Provenza', 'El Prado', 'Mejoras Públicas',
    'La Joya', 'Antonia Santos', 'San Miguel', 'Álvarez', 'Villa del Prado',
    'Cañaveral', 'La Rosita', 'El Jardín', 'Pan de Azúcar', 'Ciudad Valencia',
    'Nuevo Sotomayor', 'La Concordia', 'La Ceiba', 'Chapinero',
  ],

  'Cartagena': [
    'El Centro', 'Getsemaní', 'La Matuna', 'Bocagrande', 'Castillogrande',
    'El Laguito', 'Manga', 'Pie de Popa', 'El Cabrero', 'Marbella', 'Crespo',
    'Torices', 'El Prado', 'Blas de Lezo', 'La Boquilla', 'Las Delicias',
    'Villa Estrella', 'San Fernando', 'Ternera', 'La Esperanza',
    'Olaya Herrera', 'San José de los Campanos', 'Amberes',
  ],

  'Pereira': [
    'El Centro', 'Circunvalar', 'El Jardín', 'La Paz', 'Álamos',
    'Pinares', 'El Dorado', 'Maraya', 'Villa Santana', 'El Oso',
    'Boston', 'El Poblado', 'Cuba', 'Tokio', 'Las Brisas', 'El Rocío',
    'Gamma', 'Normandía', 'La Bella', 'San Joaquín', 'Perla del Otún',
    'Comuneros', 'El Remanso', 'Ciudadela El Remanso',
  ],

  'Manizales': [
    'El Centro', 'Chipre', 'Palermo', 'El Cable', 'Aranjuez', 'Los Cedros',
    'Palogrande', 'La Enea', 'Bosques del Norte', 'Maltería', 'Milán',
    'La Francia', 'San Marcel', 'Estrella', 'La Estación', 'Versalles',
    'El Caribe', 'La Fuente', 'Linda Chía',
  ],

  'Ibagué': [
    'El Centro', 'Jordán', 'San Simón', 'Los Tunjos', 'Topacio',
    'Santa Elena', 'El Vergel', 'La Pola', 'La Sultana', 'Cádiz',
    'Ambala', 'Metropolitano', 'La Martinica', 'Bochica', 'Las Américas',
    'El Salado', 'Ciudad Jardín',
  ],

  'Armenia': [
    'El Centro', 'La Isabela', 'Brasilia', 'Los Quindos', 'El Poblado',
    'El Caimo', 'Santander', 'La Castellana', 'Chapinero', 'La Fachada',
    'Simón Bolívar', 'El Edén', 'La Milagrosa',
  ],

  'Villavicencio': [
    'El Centro', 'Barzal', 'El Recreo', 'La Grama', 'Maracos',
    'Montserrat', 'Suria', 'Porfía', 'Las Colinas', 'Siete de Agosto',
    'El Triunfo', 'Villa Suárez', 'Catumare', 'San Fernando', 'El Paraíso',
  ],

  'Pasto': [
    'El Centro', 'Lorenzo', 'Chambú', 'Santa Bárbara', 'San Vicente',
    'Aranda', 'La Panadería', 'Corazón de Jesús', 'El Rosario',
    'Botanilla', 'Doscientos', 'La Minga', 'San Ignacio',
  ],

  'Montería': [
    'El Centro', 'Mocarí', 'La Castellana', 'Policarpa', 'La Granja',
    'Los Ángeles', 'El Dorado', 'Buenavista', 'Santafé', 'Colina Real',
    'La Pradera', 'El Campano',
  ],

  'Santa Marta': [
    'El Centro', 'El Rodadero', 'Mamatoco', 'Gaira', 'San Jorge',
    'Once de Noviembre', 'La Paz', 'Nacho Vives', 'Almendros',
    'Los Trupillos', 'Cristo Rey',
  ],

  'Neiva': [
    'El Centro', 'Quirinal', 'Los Comuneros', 'La Gaitana', 'Mártires',
    'La Esneda', 'Timanco', 'Palermo', 'Los Alpes', 'Boston',
    'Cándido Leguízamo', 'Bello Horizonte', 'Las Palmas',
  ],

  'Valledupar': [
    'El Centro', 'Los Mayales', 'Alfonso López', 'La Ceiba', 'Simón Bolívar',
    'El Vallito', 'Novalito', 'La Nevada', 'Sicarare', 'Claret',
    'Los Robles', 'El Recreo',
  ],

  'Cúcuta': [
    'El Centro', 'Blanco', 'Atalaya', 'La Playa', 'Alfonso López',
    'Comuneros', 'Chapinero', 'La Libertad', 'Cañaveral', 'Pueblo Nuevo',
    'El Llano', 'Antonia Santos', 'Belén', 'La Merced',
  ],

  'Sincelejo': [
    'El Centro', 'Venecia', 'García', 'Los Pinos', 'El Dorado',
    'La Sabana', 'Las Américas', 'Villa Mady', 'Palmas', 'El Recreo',
  ],

  'Popayán': [
    'El Centro', 'Bolívar', 'La Esmeralda', 'Pubenza', 'Alfonso López',
    'El Recuerdo', 'Los Sauces', 'San Bernardino', 'Los Comuneros',
    'La Paz', 'El Lago', 'La Pamba',
  ],

  'Florencia': [
    'El Centro', 'Ciudadela Siglo XXI', 'El Recreo', 'La Vega',
    'Sinaí', 'La Independencia', 'Comuneros', 'Villa del Río',
  ],

  'Palmira': [
    'El Centro', 'El Dorado', 'San Jorge', 'Las Delicias', 'Boyacá',
    'Santa Ana', 'Versalles', 'La Emilia', 'El Rosario', 'Independencia',
    'El Recreo', 'Ciudad Jardín',
  ],

  'Buenaventura': [
    'El Centro', 'La Playita', 'Pueblo Nuevo', 'Punta del Este',
    'La Independencia', 'Santa Fe', 'El Cristal', 'Lleras',
  ],
}
