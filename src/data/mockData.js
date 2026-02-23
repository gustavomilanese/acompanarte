// Datos mock para la aplicación Acompañarte

// Acompañantes
export const acompanantes = [
  {
    id: 'acp-1',
    nombre: 'María González',
    email: 'maria@ejemplo.com',
    telefono: '+54 11 2345-6789',
    codigo: '1234',
    estado: 'activo',
    disponibilidad: 'mañana y tarde',
    avatar: 'https://i.pravatar.cc/150?u=maria',
    bio: 'Acompañante con 5 años de experiencia en cuidado de adultos mayores.',
    especialidades: ['demencia', 'movilidad reducida'],
  },
  {
    id: 'acp-2',
    nombre: 'Carlos López',
    email: 'carlos@ejemplo.com',
    telefono: '+54 11 3456-7890',
    codigo: '5678',
    estado: 'activo',
    disponibilidad: 'solo mañana',
    avatar: 'https://i.pravatar.cc/150?u=carlos',
    bio: 'Especializado en acompañamiento escolar y actividades recreativas.',
    especialidades: ['TEA', 'niños'],
  },
  {
    id: 'acp-3',
    nombre: 'Ana Martínez',
    email: 'ana@ejemplo.com',
    telefono: '+54 11 4567-8901',
    codigo: '9012',
    estado: 'activo',
    disponibilidad: 'solo tarde',
    avatar: 'https://i.pravatar.cc/150?u=ana',
    bio: 'Terapeuta ocupacional con enfoque en estimulación cognitiva.',
    especialidades: ['estimulación cognitiva', 'adultos mayores'],
  },
];

// Clientes (adultos mayores y niños)
export const clientes = [
  {
    id: 'cli-1',
    nombre: 'Don José',
    edad: 78,
    tipo: 'adulto_mayor',
    condicion: 'Demencia leve',
    direccion: 'Av. Corrientes 1234, CABA',
    contactoEmergencia: {
      nombre: 'Pedro (hijo)',
      telefono: '+54 11 9876-5432',
    },
    acompananteAsignado: 'acp-1',
    foto: 'https://i.pravatar.cc/150?u=jose',
    notas: 'Le gusta escuchar tangos. Tiene buenos días y malos días.',
    necesidadesEspeciales: ['recordatorios de medicación', 'ayuda para caminar'],
  },
  {
    id: 'cli-2',
    nombre: 'Doña Rosa',
    edad: 82,
    tipo: 'adulto_mayor',
    condicion: 'Movilidad reducida',
    direccion: 'Calle Florida 567, CABA',
    contactoEmergencia: {
      nombre: 'María (hija)',
      telefono: '+54 11 8765-4321',
    },
    acompananteAsignado: 'acp-1',
    foto: 'https://i.pravatar.cc/150?u=rosa',
    notas: 'Muy conversadora. Disfruta de las actividades manuales.',
    necesidadesEspeciales: ['silla de ruedas', 'baño adaptado'],
  },
  {
    id: 'cli-3',
    nombre: 'Tomás',
    edad: 6,
    tipo: 'nino',
    condicion: 'TEA (Trastorno del Espectro Autista)',
    direccion: 'Av. Santa Fe 890, CABA',
    contactoEmergencia: {
      nombre: 'Laura (mamá)',
      telefono: '+54 11 7654-3210',
    },
    acompananteAsignado: 'acp-2',
    foto: 'https://i.pravatar.cc/150?u=tomas',
    notas: 'Le encantan los dinosaurios. Necesita rutinas predecibles.',
    necesidadesEspeciales: ['comunicación visual', 'pausas sensoriales'],
  },
  {
    id: 'cli-4',
    nombre: 'Lucía',
    edad: 5,
    tipo: 'nino',
    condicion: 'Acompañamiento post-cole',
    direccion: 'Calle Libertad 234, CABA',
    contactoEmergencia: {
      nombre: 'Carlos (papá)',
      telefono: '+54 11 6543-2109',
    },
    acompananteAsignado: 'acp-2',
    foto: 'https://i.pravatar.cc/150?u=lucia',
    notas: 'Muy creativa. Le gusta dibujar y bailar.',
    necesidadesEspeciales: ['tareas guiadas', 'actividades lúdicas'],
  },
];

// Actividades de la biblioteca
export const actividades = [
  {
    id: 'act-1',
    titulo: 'Memoria fotográfica',
    categoria: 'cognitivo',
    duracion: 30,
    descripcion: 'Juego de memoria con fotografías familiares o de época para estimular la reminiscencia.',
    instrucciones: [
      'Preparar 10-15 fotografías de temática similar',
      'Colocarlas boca abajo en una superficie plana',
      'El participante voltea dos cartas por turno',
      'Si coinciden, se queda con el par',
      'Continuar hasta encontrar todos los pares',
    ],
    materiales: ['Fotografías impresas', 'Superficie plana'],
    dificultad: 'media',
    indicadoPara: ['demencia leve', 'adultos mayores'],
  },
  {
    id: 'act-2',
    titulo: 'Caminata guiada',
    categoria: 'fisico',
    duracion: 45,
    descripcion: 'Paseo supervisado adaptado a las capacidades del acompañado, con pausas y observación.',
    instrucciones: [
      'Planificar ruta segura y accesible',
      'Preparar calzado cómodo y agua',
      'Mantener ritmo pausado',
      'Hacer pausas cada 10-15 minutos',
      'Observar el entorno y conversar',
    ],
    materiales: ['Calzado cómodo', 'Botella de agua', 'Sombrero'],
    dificultad: 'baja',
    indicadoPara: ['movilidad reducida', 'adultos mayores'],
  },
  {
    id: 'act-3',
    titulo: 'Juego de roles',
    categoria: 'social',
    duracion: 40,
    descripcion: 'Simulación de situaciones cotidianas para practicar habilidades sociales.',
    instrucciones: [
      'Elegir una situación familiar (tienda, doctor, etc.)',
      'Asignar roles a cada participante',
      'Simular la interacción',
      'Dar feedback positivo',
      'Practicar varias veces si es necesario',
    ],
    materiales: ['Accesorios opcionales', 'Escenario definido'],
    dificultad: 'media',
    indicadoPara: ['TEA', 'niños'],
  },
  {
    id: 'act-4',
    titulo: 'Dibujo libre',
    categoria: 'creativo',
    duracion: 30,
    descripcion: 'Expresión artística mediante dibujo con diferentes materiales y técnicas.',
    instrucciones: [
      'Preparar materiales de dibujo',
      'Sugerir temas o dejar libertad creativa',
      'Acompañar sin intervenir en el proceso',
      'Mostrar interés en el resultado',
      'Guardar o exhibir las obras',
    ],
    materiales: ['Papel', 'Lápices de colores', 'Crayones', 'Marcadores'],
    dificultad: 'baja',
    indicadoPara: ['todos', 'niños', 'adultos mayores'],
  },
  {
    id: 'act-5',
    titulo: 'Rompecabezas progresivos',
    categoria: 'cognitivo',
    duracion: 35,
    descripcion: 'Armado de puzzles adaptados al nivel de dificultad del participante.',
    instrucciones: [
      'Elegir puzzle apropiado al nivel',
      'Separar piezas de borde',
      'Armar el marco primero',
      'Completar secciones por colores',
      'Celebrar al finalizar',
    ],
    materiales: ['Rompecabezas', 'Superficie plana'],
    dificultad: 'variable',
    indicadoPara: ['demencia', 'adultos mayores', 'niños'],
  },
  {
    id: 'act-6',
    titulo: 'Yoga adaptado',
    categoria: 'fisico',
    duracion: 30,
    descripcion: 'Secuencia de posturas suaves adaptadas a las capacidades físicas.',
    instrucciones: [
      'Preparar espacio con colchoneta',
      'Comenzar con respiración profunda',
      'Realizar posturas sentado o de pie',
      'Mantener cada postura 3-5 respiraciones',
      'Finalizar con relajación',
    ],
    materiales: ['Colchoneta', 'Música relajante opcional'],
    dificultad: 'baja',
    indicadoPara: ['movilidad reducida', 'adultos mayores'],
  },
  {
    id: 'act-7',
    titulo: 'Cuentacuentos',
    categoria: 'social',
    duracion: 25,
    descripcion: 'Lectura en voz alta de cuentos con interacción y preguntas.',
    instrucciones: [
      'Elegir cuento apropiado a la edad',
      'Leer con entonación expresiva',
      'Hacer pausas para mostrar ilustraciones',
      'Preguntar sobre la historia',
      'Invitar a contar partes del cuento',
    ],
    materiales: ['Libro de cuentos', 'Buena iluminación'],
    dificultad: 'baja',
    indicadoPara: ['niños', 'adultos mayores'],
  },
  {
    id: 'act-8',
    titulo: 'Origami básico',
    categoria: 'creativo',
    duracion: 40,
    descripcion: 'Doblado de papel para crear figuras simples paso a paso.',
    instrucciones: [
      'Elegir figura simple (barco, grulla)',
      'Usar papel cuadrado de tamaño adecuado',
      'Seguir instrucciones paso a paso',
      'Ayudar sosteniendo el papel',
      'Celebrar cada logro',
    ],
    materiales: ['Papel de origami', 'Instrucciones visuales'],
    dificultad: 'media',
    indicadoPara: ['adultos mayores', 'niños mayores'],
  },
  {
    id: 'act-9',
    titulo: 'Música terapéutica',
    categoria: 'cognitivo',
    duracion: 35,
    descripcion: 'Escucha guiada de música familiar con movimiento y reminiscencia.',
    instrucciones: [
      'Preparar playlist personalizada',
      'Crear ambiente cómodo',
      'Escuchar juntos',
      'Incentivar movimiento suave',
      'Conversar sobre recuerdos asociados',
    ],
    materiales: ['Reproductor de música', 'Parlantes', 'Lista personalizada'],
    dificultad: 'baja',
    indicadoPara: ['demencia', 'adultos mayores'],
  },
  {
    id: 'act-10',
    titulo: 'Juegos de mesa adaptados',
    categoria: 'social',
    duracion: 45,
    descripcion: 'Juegos de mesa simplificados para promover interacción social.',
    instrucciones: [
      'Elegir juego apropiado (damas, dominó simple)',
      'Simplificar reglas si es necesario',
      'Jugar con paciencia',
      'No enfocarse en ganar',
      'Disfrutar el proceso',
    ],
    materiales: ['Juego de mesa', 'Mesa cómoda'],
    dificultad: 'media',
    indicadoPara: ['adultos mayores', 'niños'],
  },
];

// Generar turnos para esta semana y próxima
const generarTurnos = () => {
  const turnos = [];
  const hoy = new Date();
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  
  // Turnos para María (mañana y tarde)
  const turnosMaria = [
    { dia: 1, hora: '09:00', cliente: 'cli-1', duracion: 3 }, // Lunes mañana
    { dia: 1, hora: '14:00', cliente: 'cli-2', duracion: 3 }, // Lunes tarde
    { dia: 3, hora: '09:00', cliente: 'cli-1', duracion: 3 }, // Miércoles mañana
    { dia: 3, hora: '14:00', cliente: 'cli-2', duracion: 3 }, // Miércoles tarde
    { dia: 5, hora: '09:00', cliente: 'cli-1', duracion: 3 }, // Viernes mañana
  ];
  
  // Turnos para Carlos (solo mañana)
  const turnosCarlos = [
    { dia: 2, hora: '08:00', cliente: 'cli-3', duracion: 4 }, // Martes mañana
    { dia: 4, hora: '08:00', cliente: 'cli-4', duracion: 4 }, // Jueves mañana
    { dia: 6, hora: '08:00', cliente: 'cli-3', duracion: 4 }, // Sábado mañana
  ];
  
  // Turnos para Ana (solo tarde)
  const turnosAna = [
    { dia: 2, hora: '15:00', cliente: 'cli-2', duracion: 3 }, // Martes tarde
    { dia: 4, hora: '15:00', cliente: 'cli-1', duracion: 3 }, // Jueves tarde
    { dia: 5, hora: '15:00', cliente: 'cli-2', duracion: 3 }, // Viernes tarde
  ];
  
  let idCounter = 1;
  
  // Generar turnos para esta semana y próxima
  [0, 7].forEach((semanaOffset) => {
    turnosMaria.forEach((t) => {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - hoy.getDay() + t.dia + semanaOffset);
      turnos.push({
        id: `turno-${idCounter++}`,
        fecha: fecha.toISOString().split('T')[0],
        horaInicio: t.hora,
        duracion: t.duracion,
        acompanante: 'acp-1',
        cliente: t.cliente,
        estado: fecha < hoy ? 'completado' : 'pendiente',
        notas: '',
      });
    });
    
    turnosCarlos.forEach((t) => {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - hoy.getDay() + t.dia + semanaOffset);
      turnos.push({
        id: `turno-${idCounter++}`,
        fecha: fecha.toISOString().split('T')[0],
        horaInicio: t.hora,
        duracion: t.duracion,
        acompanante: 'acp-2',
        cliente: t.cliente,
        estado: fecha < hoy ? 'completado' : 'pendiente',
        notas: '',
      });
    });
    
    turnosAna.forEach((t) => {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - hoy.getDay() + t.dia + semanaOffset);
      turnos.push({
        id: `turno-${idCounter++}`,
        fecha: fecha.toISOString().split('T')[0],
        horaInicio: t.hora,
        duracion: t.duracion,
        acompanante: 'acp-3',
        cliente: t.cliente,
        estado: fecha < hoy ? 'completado' : 'pendiente',
        notas: '',
      });
    });
  });
  
  return turnos;
};

export const turnos = generarTurnos();

// Visitas históricas completadas
export const visitas = [
  {
    id: 'vis-1',
    turnoId: 'turno-1',
    fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acompanante: 'acp-1',
    cliente: 'cli-1',
    horaCheckIn: '09:05',
    horaCheckOut: '12:00',
    duracion: 175,
    actividades: ['act-1', 'act-2'],
    notas: 'Don José estuvo muy conversador hoy. Recordó muchas anécdotas de su juventud.',
    fotos: [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2',
    ],
  },
  {
    id: 'vis-2',
    turnoId: 'turno-2',
    fecha: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acompanante: 'acp-2',
    cliente: 'cli-3',
    horaCheckIn: '08:02',
    horaCheckOut: '11:45',
    duracion: 223,
    actividades: ['act-3', 'act-4'],
    notas: 'Tomás mostró gran interés en los dinosaurios. Dibujó un T-Rex muy detallado.',
    fotos: [
      'https://picsum.photos/400/300?random=3',
    ],
  },
  {
    id: 'vis-3',
    turnoId: 'turno-3',
    fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acompanante: 'acp-1',
    cliente: 'cli-2',
    horaCheckIn: '14:10',
    horaCheckOut: '17:00',
    duracion: 170,
    actividades: ['act-5', 'act-9'],
    notas: 'Doña Rosa completó un rompecabezas de 100 piezas. Muy contenta con su logro.',
    fotos: [
      'https://picsum.photos/400/300?random=4',
      'https://picsum.photos/400/300?random=5',
      'https://picsum.photos/400/300?random=6',
    ],
  },
  {
    id: 'vis-4',
    turnoId: 'turno-4',
    fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acompanante: 'acp-3',
    cliente: 'cli-2',
    horaCheckIn: '15:05',
    horaCheckOut: '18:00',
    duracion: 175,
    actividades: ['act-6', 'act-8'],
    notas: 'Excelente sesión de yoga. Doña Rosa pudo hacer todas las posturas sentada.',
    fotos: [
      'https://picsum.photos/400/300?random=7',
    ],
  },
  {
    id: 'vis-5',
    turnoId: 'turno-5',
    fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acompanante: 'acp-2',
    cliente: 'cli-4',
    horaCheckIn: '08:00',
    horaCheckOut: '11:30',
    duracion: 210,
    actividades: ['act-4', 'act-7'],
    notas: 'Lucía disfrutó mucho el cuento de Caperucita. Luego dibujó su versión.',
    fotos: [
      'https://picsum.photos/400/300?random=8',
      'https://picsum.photos/400/300?random=9',
    ],
  },
  {
    id: 'vis-6',
    turnoId: 'turno-6',
    fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acompanante: 'acp-1',
    cliente: 'cli-1',
    horaCheckIn: '09:00',
    horaCheckOut: '12:15',
    duracion: 195,
    actividades: ['act-2', 'act-9'],
    notas: 'Paseo por la plaza muy agradable. Don José saludó a varios conocidos.',
    fotos: [
      'https://picsum.photos/400/300?random=10',
    ],
  },
  {
    id: 'vis-7',
    turnoId: 'turno-7',
    fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acompanante: 'acp-3',
    cliente: 'cli-1',
    horaCheckIn: '15:00',
    horaCheckOut: '18:00',
    duracion: 180,
    actividades: ['act-1', 'act-10'],
    notas: 'Jugamos al dominó adaptado. Don José recordó las reglas sin problemas.',
    fotos: [
      'https://picsum.photos/400/300?random=11',
      'https://picsum.photos/400/300?random=12',
    ],
  },
];

// Administradores
export const admins = [
  {
    id: 'adm-1',
    nombre: 'Administrador',
    email: 'admin@acompanarte.online',
    password: 'admin123',
    rol: 'superadmin',
  },
];

// Códigos de acceso para familiares
export const codigosFamiliares = {
  '987654': { clienteId: 'cli-1', familiarNombre: 'Pedro' },
  '876543': { clienteId: 'cli-2', familiarNombre: 'María' },
  '765432': { clienteId: 'cli-3', familiarNombre: 'Laura' },
  '654321': { clienteId: 'cli-4', familiarNombre: 'Carlos' },
};

// Funciones helper
export const getAcompananteById = (id) => acompanantes.find((a) => a.id === id);
export const getClienteById = (id) => clientes.find((c) => c.id === id);
export const getActividadById = (id) => actividades.find((a) => a.id === id);
export const getTurnoById = (id) => turnos.find((t) => t.id === id);
export const getVisitaById = (id) => visitas.find((v) => v.id === id);

export const getTurnosByAcompanante = (acompananteId) =>
  turnos.filter((t) => t.acompanante === acompananteId);

export const getTurnosByCliente = (clienteId) =>
  turnos.filter((t) => t.cliente === clienteId);

export const getVisitasByCliente = (clienteId) =>
  visitas.filter((v) => v.cliente === clienteId);

export const getVisitasByAcompanante = (acompananteId) =>
  visitas.filter((v) => v.acompanante === acompananteId);

export const getTurnosHoy = (acompananteId) => {
  const hoy = new Date().toISOString().split('T')[0];
  return turnos.filter(
    (t) => t.acompanante === acompananteId && t.fecha === hoy
  );
};

export const getProximosTurnos = (acompananteId, cantidad = 3) => {
  const hoy = new Date().toISOString().split('T')[0];
  return turnos
    .filter((t) => t.acompanante === acompananteId && t.fecha >= hoy)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, cantidad);
};

export const getTurnoActual = (acompananteId) => {
  const hoy = new Date().toISOString().split('T')[0];
  const ahora = new Date();
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(
    ahora.getMinutes()
  ).padStart(2, '0')}`;
  
  return turnos.find(
    (t) =>
      t.acompanante === acompananteId &&
      t.fecha === hoy &&
      t.horaInicio <= horaActual &&
      t.estado === 'pendiente'
  );
};

export const getActividadesByCategoria = (categoria) =>
  actividades.filter((a) => a.categoria === categoria);

export default {
  acompanantes,
  clientes,
  actividades,
  turnos,
  visitas,
  admins,
  codigosFamiliares,
  getAcompananteById,
  getClienteById,
  getActividadById,
  getTurnoById,
  getVisitaById,
  getTurnosByAcompanante,
  getTurnosByCliente,
  getVisitasByCliente,
  getVisitasByAcompanante,
  getTurnosHoy,
  getProximosTurnos,
  getTurnoActual,
  getActividadesByCategoria,
};
