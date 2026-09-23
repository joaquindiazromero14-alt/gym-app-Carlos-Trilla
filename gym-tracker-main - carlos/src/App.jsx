import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';

// ============================================================================
// 1. CONSTANTES, CONFIGURACIÓN Y DICCIONARIOS
// ============================================================================
const tema = { bg: '#000000', card: '#161616', text: '#ffffff', textMuted: '#8a8a8e', border: '#2a2a2a', radius: '24px' };
const appStyle = { minHeight: '100vh', backgroundColor: tema.bg, color: tema.text, fontFamily: '-apple-system, sans-serif', padding: '24px 16px', boxSizing: 'border-box' };
const cardStyle = { backgroundColor: tema.card, borderRadius: tema.radius, padding: '20px', border: `1px solid ${tema.border}` };
const inputStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: `1px solid ${tema.border}`, backgroundColor: '#0a0a0a', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' };
const btnStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: tema.text, color: tema.bg, fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer' };
const navItemStyle = { ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '12px', padding: '24px 20px' };

const LINK_RESERVA_GIMNASIO = "https://deportesurjc.i2a.es/CronosWeb/Login";

const INFO_EJERCICIOS = {
  "Calentamiento": "Calentamiento General (5-10 minutos)\nEjercicio cardiovascular de intensidad moderada, como la bicicleta estática, trotar o saltar la cuerda.\n\nEstiramientos Dinámicos\n• 10 balanceos de pierna (adelante y atrás) por lado.\n• 10 balanceos de pierna (de lado a lado) por lado.\n• 10 rotaciones de brazos hacia adelante.\n• 10 rotaciones de brazos hacia atrás.\n• 10 cruces de brazos (adelante y atrás).\n• 10 zancadas combinadas con rotación del torso.\n\nSeries de Aproximación\n5 repeticiones usando el 50% del peso de trabajo.",
  "Press Banca": "(Biserie, 45s de descanso): Press de Banca con Mancuernas (4x8) + Remo Pendlay (4x8).",
  "Remo Pendlay": "(Biserie, 45s de descanso): Press de Banca (4x8) + Remo Pendlay (4x8).",
  "Dominadas": "(Biserie, 45s descanso) Dominadas lastradas (3x8) + Fondos lastrados (3x10).",
  "Fondos": "Bloque B (Biserie, 45s de descanso): Dominadas Lastradas (3x6-8) + Fondos Lastrados (3x8-10).\n\nTécnica: Descenso hasta romper paralela (90º). Torso inclinado adelante.",
  "Curl Martillo": "Curl Martillo Pesado (3x10).",
  "Sentadilla Frontal": "Sentadilla Frontal (4x6).",
  "Rumano": "Peso muerto Rumano (3x8).",
  "Búlgaras": "Búlgaras (3x8).",
  "Swings": "Kettlebell swings (4x20).",
  "Plancha": "Estructura: 3 series al fallo.\n\nTécnica: Apoyo en antebrazos. Retroversión pélvica, contracción profunda del abdomen. Lastre en espalda media.",
  "Turco": "Levantamiento Turco, (3x5 por lado).",
  "Bici Estática (min)": "Estructura: Base Aeróbica (Zona 1), 45-60 min.\n\nTécnica: Ritmo conversacional estricto (respiración nasal).",
  "Bici Estática HIIT": "Estructura: HIIT 1:1, 10 rondas de 20s sprint máximo / 20s recuperación.",
  "Movilidad": "Estructura: 15 minutos.\n\nTécnica: Apertura torácica y rotación de cadera.",
  "Flexiones Explosivas": "Bloque 1 (EMOM 10 min): 10 Flexiones explosivas + 5 Dominadas a realizar dentro de cada minuto, descansando el tiempo restante del minuto.",
  "Curls Barra Z": "Bloque 2 (EMOM 10 min): 8 Curls Z + 8 Ext. Tríceps + 8 Elev. Laterales a realizar dentro de cada minuto, descansando el tiempo restante del minuto.",
  "Extensión Tríceps": "Bloque 2 (EMOM 10 min): 8 Curls Z + 8 Ext. Tríceps + 8 Elev. Laterales a realizar dentro de cada minuto, descansando el tiempo restante del minuto.",
  "Elevaciones Laterales": "Bloque 2 (EMOM 10 min): 8 Curls Z + 8 Ext. Tríceps + 8 Elev. Laterales a realizar dentro de cada minuto, descansando el tiempo restante del minuto.",
  "Cuello": "Estructura: 10 minutos de isometrías en 4 vectores.\n\nTécnica: 15-20 segundos de tensión por lado.",
  "Hexagonal": "Peso muerto hexagonal o convencional (4x5) con subida explosiva.",
  "Granjero": "Paseo del granjero (4x40 metros).\n\nTécnica: Agarre firme, escápulas retraídas, mirada al frente. Pasos cortos y rápidos."
};

const obtenerInfoEjercicio = (nombre) => {
  if (!nombre || typeof nombre !== 'string') return "Ejecuta el ejercicio controlando la técnica y la cadencia en todo momento.";
  const nomLow = nombre.toLowerCase();
  const clave = Object.keys(INFO_EJERCICIOS).find(k => nomLow.includes(k.toLowerCase()));
  return clave ? INFO_EJERCICIOS[clave] : "Ejecuta el ejercicio controlando la técnica y la cadencia en todo momento.";
};

// ============================================================================
// 2. MOTORES DE LÓGICA DE NEGOCIO
// ============================================================================
const clasificarEjercicio = (nombre) => {
  if (!nombre || typeof nombre !== 'string') return 'fuerza';
  const n = nombre.toLowerCase();
  if (n.includes('calentamiento')) return 'calentamiento';
  if (n.includes('emom')) return 'emom';
  if (n.includes('hiit')) return 'hiit'; 
  if (n.includes('movilidad')) return 'movilidad';
  if (n.includes('bici') || n.includes('cardio')) return 'cardio';
  if (n.includes('paseo') || n.includes('granjero')) return 'traslado';
  if (n.includes('plancha') || n.includes('isometría') || n.includes('(s)') || n.includes('cuello')) return 'isometria';
  return 'fuerza';
};

const formatearTiempo = (totalSegundos) => {
  if (!totalSegundos && totalSegundos !== 0) return '';
  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = totalSegundos % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatearCrono = (totalSegundos) => {
  if (totalSegundos == null || isNaN(totalSegundos)) return '00:00';
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = totalSegundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatearTiempoTexto = (totalSegundos) => {
  if (!totalSegundos || isNaN(totalSegundos)) return '0s';
  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = totalSegundos % 60;
  let res = [];
  if (h > 0) res.push(`${h}h`);
  if (m > 0) res.push(`${m}m`);
  if (s > 0 || res.length === 0) res.push(`${s}s`);
  return res.join(' ');
};

const formatearMetricaUI = (serie) => {
  const { categoria, peso_kg, repeticiones, tiempo_segundos, distancia_metros, notas } = serie;
  switch (categoria) {
    case 'fuerza': return `${peso_kg || 0}kg × ${repeticiones || 0}`;
    case 'hiit': return `${repeticiones || 0} Rondas`; 
    case 'cardio': return `⏱ ${formatearTiempoTexto(tiempo_segundos)}`;
    case 'movilidad': return `⏱ ${formatearTiempoTexto(tiempo_segundos)}`;
    case 'traslado': return `${peso_kg || 0}kg/m × ${distancia_metros || 0}m`;
    case 'emom': return `${peso_kg > 0 ? peso_kg + 'kg | ' : 'N/A | '}Tot: ${repeticiones || 0}`;
    case 'isometria': return `${peso_kg > 0 ? peso_kg + 'kg × ' : ''}⏱ ${formatearTiempoTexto(tiempo_segundos)}`;
    case 'recuperacion': return `⏱ ${formatearTiempoTexto(tiempo_segundos)}`;
    case 'calentamiento': return `🔥 ${formatearTiempoTexto(tiempo_segundos)}`;
    case 'nota': return `"${notas || ''}"`;
    default: return 'Hecho';
  }
};

const formatearMetricaBreve = (serie) => {
  const { categoria, peso_kg, repeticiones, tiempo_segundos, distancia_metros } = serie;
  switch (categoria) {
    case 'fuerza': return `${peso_kg || 0}x${repeticiones || 0}`;
    case 'hiit': return `${repeticiones || 0} Rnd`; 
    case 'cardio': return formatearTiempoTexto(tiempo_segundos);
    case 'movilidad': return formatearTiempoTexto(tiempo_segundos);
    case 'traslado': return `${peso_kg || 0}x${distancia_metros || 0}m`;
    case 'emom': return `${peso_kg > 0 ? peso_kg + 'x' : 'N/Ax'}${repeticiones || 0}`;
    case 'isometria': return `${peso_kg > 0 ? peso_kg + 'x ' : ''}${formatearTiempoTexto(tiempo_segundos)}`;
    case 'calentamiento': return `🔥 ${formatearTiempoTexto(tiempo_segundos)}`;
    case 'nota': return '📝 Nota';
    default: return '';
  }
};

// ============================================================================
// 3. COMPONENTES AISLADOS
// ============================================================================
const FormularioPeso = ({ onGuardar, cargando }) => {
  const [peso, setPeso] = useState('');
  const handleSubmit = async (e) => { e.preventDefault(); if (peso) await onGuardar(peso); setPeso(''); };
  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
      <input type="number" step="any" placeholder="Ej. 75.5" value={peso} onChange={(e) => setPeso(e.target.value)} style={{ ...inputStyle, marginBottom: '12px' }} required />
      <button type="submit" style={btnStyle} disabled={cargando}>{cargando ? 'Guardando...' : 'Añadir Registro'}</button>
    </form>
  );
};

const GraficoSVG = ({ historial, rango }) => {
  const historialUnico = [];
  const fechasVistas = new Set();
  
  historial.forEach(d => {
    const diaStr = new Date(d.created_at).toLocaleDateString('es-ES');
    if (!fechasVistas.has(diaStr)) {
      fechasVistas.add(diaStr);
      historialUnico.push(d);
    }
  });

  const limiteDate = new Date();
  limiteDate.setHours(0, 0, 0, 0);
  if (rango !== 'all') {
    limiteDate.setDate(limiteDate.getDate() - parseInt(rango, 10));
  }

  const datosFiltrados = historialUnico
    .filter(d => rango === 'all' || new Date(d.created_at) >= limiteDate)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); 

  if (datosFiltrados.length < 2) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px' }}>
        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>📊</span>
        <p style={{ color: tema.textMuted, margin: 0 }}>Registra tu peso en al menos 2 días distintos dentro de este periodo para trazar tu evolución.</p>
      </div>
    );
  }

  const pesos = datosFiltrados.map(d => d.peso);
  const minPeso = Math.min(...pesos) - 1.5; 
  const maxPeso = Math.max(...pesos) + 1.5; 
  const rangoPeso = maxPeso - minPeso;

  const width = 400; 
  const height = 250; 
  const paddingX = 48; 
  const paddingY = 40;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const getX = (index) => paddingX + (index / (datosFiltrados.length - 1)) * innerWidth;
  const getY = (peso) => paddingY + innerHeight - ((peso - minPeso) / rangoPeso) * innerHeight;

  const pathD = datosFiltrados.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.peso)}`).join(' ');

  const puntos = datosFiltrados.map((d, i) => {
    let color = '#8a8a8e'; 
    if (i > 0) {
      const pesoAnterior = datosFiltrados[i-1].peso;
      if (d.peso > pesoAnterior) color = '#ef4444'; 
      else if (d.peso < pesoAnterior) color = '#22c55e'; 
    }
    return { x: getX(i), y: getY(d.peso), color, peso: d.peso, fecha: new Date(d.created_at) };
  });

  return (
    <div style={{ ...cardStyle, padding: '24px 16px' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const yPos = paddingY + innerHeight * ratio;
          const pesoLabel = (maxPeso - (rangoPeso * ratio)).toFixed(1);
          return (
            <g key={ratio}>
              <line x1={paddingX} y1={yPos} x2={width - paddingX} y2={yPos} stroke={tema.border} strokeWidth="1" strokeDasharray="4,4" />
              <text x={paddingX - 8} y={yPos + 4} fill={tema.textMuted} fontSize="10" textAnchor="end" fontWeight="600">{pesoLabel} kg</text>
            </g>
          );
        })}
        <path d={pathD} fill="none" stroke="#4a4a4a" strokeWidth="3" strokeLinejoin="round" />
        {puntos.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={p.color} stroke={tema.card} strokeWidth="2" />
            <text x={p.x} y={p.y - 12} fill="#ffffff" fontSize="12" textAnchor="middle" fontWeight="bold">{p.peso}</text>
            <text x={p.x} y={height - 5} fill={tema.textMuted} fontSize="10" textAnchor="middle">{p.fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ============================================================================
// 4. APLICACIÓN PRINCIPAL
// ============================================================================
export default function App() {
  const [vista, setVista] = useState('menu'); 
  const [subVistaEstadisticas, setSubVistaEstadisticas] = useState('evolucion'); 
  const [subVistaPeso, setSubVistaPeso] = useState('lista'); 
  const [rangoGrafico, setRangoGrafico] = useState('30'); 

  const [filtroFechaHistorial, setFiltroFechaHistorial] = useState('');

  const [rutinasDb, setRutinasDb] = useState({});
  const [sesionesHistorial, setSesionesHistorial] = useState([]);
  const [historialPeso, setHistorialPeso] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState(null);

  const [fechaCalendario, setFechaCalendario] = useState(new Date());
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  
  const [diaActivo, setDiaActivo] = useState(null);
  const [sesionActivaId, setSesionActivaId] = useState(null);
  const [fechaEntrenamiento, setFechaEntrenamiento] = useState(null); 
  const [estadoRutina, setEstadoRutina] = useState({});

  const [horaInicio, setHoraInicio] = useState(null);
  const [segundos, setSegundos] = useState(0);
  const [cronometroActivo, setCronometroActivo] = useState(false);

  const [descansoActual, setDescansoActual] = useState({ activo: false, ejercicio: null, inicio: null });
  const [segundosDescanso, setSegundosDescanso] = useState(0);

  const [estadoCalentamiento, setEstadoCalentamiento] = useState({ activo: false, inicioTick: null, acumuladoPrevio: 0, mostrandoInfo: false });
  const [segundosCalentamiento, setSegundosCalentamiento] = useState(0);
  const [calentamientoManual, setCalentamientoManual] = useState({ min: '', sec: '' });

  const [emomTimers, setEmomTimers] = useState({});
  const [ejTimers, setEjTimers] = useState({}); 
  const [hiitTimers, setHiitTimers] = useState({}); 
  const [now, setNow] = useState(Date.now());

  const hoyFormateado = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const esRegistroPasado = fechaEntrenamiento !== null && fechaEntrenamiento !== hoyFormateado;

  // --------------------------------------------------------------------------
  // LECTURA RELACIONAL
  // --------------------------------------------------------------------------
  const cargarDatos = useCallback(async () => {
    setErrorGlobal(null);
    try {
      const { data: dataRutinas, error: errRutinas } = await supabase
        .from('rutinas')
        .select(`dia_clave, titulo, rutinas_ejercicios (ejercicio, orden)`);

      if (errRutinas) throw errRutinas;

      const rutinasFormateadas = {};
      dataRutinas.forEach(r => {
        const ejerciciosOrdenados = r.rutinas_ejercicios
          .sort((a, b) => a.orden - b.orden)
          .map(e => e.ejercicio);
          
        rutinasFormateadas[r.dia_clave] = {
          titulo: r.titulo,
          ejercicios: ejerciciosOrdenados
        };
      });
      setRutinasDb(rutinasFormateadas);

      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 90);
      
      const { data: sesData, error: sesErr } = await supabase
        .from('sesiones')
        .select(`
          id, fecha, nombre_rutina, duracion_segundos, created_at,
          series ( id, ejercicio, categoria, peso_kg, repeticiones, tiempo_segundos, distancia_metros, orden, notas, created_at )
        `)
        .gte('fecha', fechaLimite.toISOString().split('T')[0])
        .order('fecha', { ascending: false });
      
      if (sesErr) throw sesErr;
      
      const sesionesOrdenadas = (sesData || []).map(s => ({
        ...s,
        series: s.series.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      }));
      setSesionesHistorial(sesionesOrdenadas);

      const { data: pesoData, error: pesoErr } = await supabase
        .from('historial_peso').select('*').order('created_at', { ascending: false });
      
      if (pesoErr) throw pesoErr;
      setHistorialPeso(pesoData || []);
    } catch (err) {
      console.error(err);
      setErrorGlobal("Fallo de conexión. No se pudieron cargar los datos.");
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  useEffect(() => {
    let intervalo = null;
    if (cronometroActivo && horaInicio) {
      intervalo = setInterval(() => {
        setSegundos(Math.floor((Date.now() - horaInicio) / 1000));
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [cronometroActivo, horaInicio]);

  useEffect(() => {
    let intervalo = null;
    if (descansoActual.activo && descansoActual.inicio) {
      intervalo = setInterval(() => {
        setSegundosDescanso(Math.floor((Date.now() - descansoActual.inicio) / 1000));
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [descansoActual.activo, descansoActual.inicio]);

  useEffect(() => {
    let intervalo = null;
    if (estadoCalentamiento.activo && estadoCalentamiento.inicioTick) {
      intervalo = setInterval(() => {
        setSegundosCalentamiento(estadoCalentamiento.acumuladoPrevio + Math.floor((Date.now() - estadoCalentamiento.inicioTick) / 1000));
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [estadoCalentamiento.activo, estadoCalentamiento.inicioTick, estadoCalentamiento.acumuladoPrevio]);

  // Hook Reloj Bucle Unificado
  useEffect(() => {
    let intervalo = null;
    const emomActivo = Object.values(emomTimers).some(t => t.activo);
    const ejTimerActivo = Object.values(ejTimers).some(t => t.activo);
    const hiitActivo = Object.values(hiitTimers).some(t => t.activo);
    
    if (emomActivo || ejTimerActivo || hiitActivo) {
      intervalo = setInterval(() => {
        setNow(Date.now());
      }, 200);
    }
    return () => clearInterval(intervalo);
  }, [emomTimers, ejTimers, hiitTimers]);

  useEffect(() => {
    let changed = false;
    const newTimers = { ...emomTimers };
    Object.keys(newTimers).forEach(bIndex => {
      const t = newTimers[bIndex];
      if (t.activo && t.inicioTick) {
        const curr = t.acumuladoPrevio + Math.floor((Date.now() - t.inicioTick) / 1000);
        if (curr >= 600) {
          newTimers[bIndex] = { activo: false, inicioTick: null, acumuladoPrevio: 600 };
          changed = true;
        }
      }
    });
    if (changed) setEmomTimers(newTimers);
  }, [now, emomTimers]);

  useEffect(() => {
    let changed = false;
    const newTimers = { ...hiitTimers };
    Object.keys(newTimers).forEach(ej => {
      const t = newTimers[ej];
      if (t.activo && t.inicioTick) {
        const curr = t.acumulado + Math.floor((Date.now() - t.inicioTick) / 1000);
        if (curr >= 400) {
          newTimers[ej] = { activo: false, inicioTick: null, acumulado: 400 };
          changed = true;
        }
      }
    });
    if (changed) setHiitTimers(newTimers);
  }, [now, hiitTimers]);

  // --------------------------------------------------------------------------
  // MÉTODOS DE CONTROL CRONÓMETROS INDIVIDUALES (HIIT y EJERCICIOS NORMALES)
  // --------------------------------------------------------------------------
  const toggleEjTimer = (ej) => {
    setEjTimers(prev => {
      const current = prev[ej] || { activo: false, inicioTick: null, acumulado: 0 };
      if (current.activo) {
        const elapsed = Math.floor((Date.now() - current.inicioTick) / 1000);
        return { ...prev, [ej]: { ...current, activo: false, acumulado: current.acumulado + elapsed, inicioTick: null } };
      } else {
        return { ...prev, [ej]: { ...current, activo: true, inicioTick: Date.now() } };
      }
    });
  };

  const resetEjTimer = (ej) => {
    setEjTimers(prev => ({ ...prev, [ej]: { activo: false, inicioTick: null, acumulado: 0 } }));
  };

  const getEjTimerSecs = (ej) => {
    const t = ejTimers[ej] || { activo: false, inicioTick: null, acumulado: 0 };
    let total = t.acumulado;
    if (t.activo && t.inicioTick) {
      total += Math.floor((now - t.inicioTick) / 1000);
    }
    return total;
  };

  const toggleHiit = (ej) => {
    setHiitTimers(prev => {
      const current = prev[ej] || { activo: false, inicioTick: null, acumulado: 0 };
      if (current.activo) {
        const elapsed = Math.floor((Date.now() - current.inicioTick) / 1000);
        return { ...prev, [ej]: { activo: false, inicioTick: null, acumulado: current.acumulado + elapsed } };
      } else {
        return { ...prev, [ej]: { ...current, activo: true, inicioTick: Date.now() } };
      }
    });
  };

  const resetHiit = (ej) => {
    if (window.confirm("¿Seguro que quieres reiniciar el cronómetro de HIIT a 0?")) {
      setHiitTimers(prev => ({ ...prev, [ej]: { activo: false, inicioTick: null, acumulado: 0 } }));
    }
  };

  const getHiitSecs = (ej) => {
    const t = hiitTimers[ej] || { activo: false, inicioTick: null, acumulado: 0 };
    let total = t.acumulado;
    if (t.activo && t.inicioTick) {
      total += Math.floor((now - t.inicioTick) / 1000);
    }
    return total;
  };

  // --------------------------------------------------------------------------
  // MÉTODOS DE CONTROL EMOM
  // --------------------------------------------------------------------------
  const toggleEmom = (bIndex) => {
    setEmomTimers(prev => {
      const current = prev[bIndex] || { activo: false, inicioTick: null, acumuladoPrevio: 0 };
      if (current.activo) {
        const elapsed = Math.floor((Date.now() - current.inicioTick) / 1000);
        return { ...prev, [bIndex]: { activo: false, inicioTick: null, acumuladoPrevio: current.acumuladoPrevio + elapsed } };
      } else {
        return { ...prev, [bIndex]: { ...current, activo: true, inicioTick: Date.now() } };
      }
    });
  };

  const resetEmom = (bIndex) => {
    if (window.confirm("¿Seguro que quieres reiniciar el cronómetro de este EMOM a 0?")) {
      setEmomTimers(prev => ({ ...prev, [bIndex]: { activo: false, inicioTick: null, acumuladoPrevio: 0 } }));
    }
  };

  // --------------------------------------------------------------------------
  // ESCRITURA TRANSACCIONAL
  // --------------------------------------------------------------------------
  const asegurarSesion = async () => {
    if (sesionActivaId) return sesionActivaId;
    const { data: nuevaSesion, error: errSes } = await supabase
      .from('sesiones')
      .insert([{ fecha: fechaEntrenamiento, nombre_rutina: rutinasDb[diaActivo].titulo }])
      .select('id')
      .single();
    if (errSes) throw errSes;
    setSesionActivaId(nuevaSesion.id);
    return nuevaSesion.id;
  };

  const registrarCalentamiento = async () => {
    setCargando(true);
    try {
      const idSesion = await asegurarSesion();
      let totalSegundos = 0;
      
      if (esRegistroPasado) {
          const m = parseInt(calentamientoManual.min) || 0;
          const s = parseInt(calentamientoManual.sec) || 0;
          totalSegundos = (m * 60) + s;
      } else {
          totalSegundos = estadoCalentamiento.acumuladoPrevio;
          if (estadoCalentamiento.activo && estadoCalentamiento.inicioTick) {
            totalSegundos += Math.floor((Date.now() - estadoCalentamiento.inicioTick) / 1000);
          }
      }

      if (totalSegundos === 0) {
        alert("Introduce un tiempo válido.");
        setCargando(false);
        return;
      }

      const { error: errSerie } = await supabase.from('series').insert([{
        sesion_id: idSesion,
        ejercicio: 'Calentamiento Full Body',
        categoria: 'calentamiento',
        tiempo_segundos: totalSegundos
      }]);
      
      if (errSerie) throw errSerie;
      
      setEstadoCalentamiento({ activo: false, inicioTick: null, acumuladoPrevio: 0, mostrandoInfo: false });
      setSegundosCalentamiento(0);
      setCalentamientoManual({ min: '', sec: '' });
      await cargarDatos();
    } catch (err) {
      alert(`Error al guardar calentamiento: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const registrarSerieRutina = async (nombreEj) => {
    const datos = estadoRutina[nombreEj] || {};
    const cat = clasificarEjercicio(nombreEj);
    const tSegs = getEjTimerSecs(nombreEj);
    const hSegs = getHiitSecs(nombreEj);

    let pesoNum = parseFloat(datos.peso) || null;
    let repsNum = parseInt(datos.reps) || null;
    
    let tiempoGuardar = null;
    let repsGuardar = null;
    let distanciaGuardar = null;

    if (cat === 'fuerza' || cat === 'emom') {
        repsGuardar = repsNum;
    } else if (cat === 'hiit') {
        if (esRegistroPasado) {
            repsGuardar = repsNum;
        } else {
            repsGuardar = hSegs >= 400 ? 10 : Math.floor(hSegs / 40) + 1;
            if (hSegs === 0) repsGuardar = null; 
        }
    } else if (cat === 'traslado') {
        distanciaGuardar = repsNum;
    } else if (cat === 'isometria' || cat === 'movilidad' || cat === 'cardio') {
        if (esRegistroPasado) {
            const m = parseInt(datos.mins) || 0;
            const s = parseInt(datos.secs) || 0;
            tiempoGuardar = (m * 60) + s;
        } else {
            tiempoGuardar = tSegs > 0 ? tSegs : null;
        }
    }

    if (!repsGuardar && !tiempoGuardar && !distanciaGuardar && !(cat === 'isometria' && pesoNum)) {
       alert('Falta introducir repeticiones, tiempo o iniciar el cronómetro.'); 
       return;
    }

    setCargando(true);
    
    try {
      const idSesion = await asegurarSesion();

      const { error: errSerie } = await supabase.from('series').insert([{
        sesion_id: idSesion,
        ejercicio: nombreEj,
        categoria: cat,
        peso_kg: (cat === 'fuerza' || cat === 'traslado' || cat === 'isometria' || cat === 'emom' || cat === 'hiit') ? pesoNum : null,
        repeticiones: repsGuardar,
        tiempo_segundos: tiempoGuardar,
        distancia_metros: distanciaGuardar
      }]);
      
      if (errSerie) throw errSerie;
      
      setEstadoRutina(prev => ({ ...prev, [nombreEj]: { ...(prev[nombreEj] || {}), peso: '', reps: '', mins: '', secs: '', completado: false } }));
      setEjTimers(prev => ({ ...prev, [nombreEj]: { activo: false, inicioTick: null, acumulado: 0 } }));
      setHiitTimers(prev => ({ ...prev, [nombreEj]: { activo: false, inicioTick: null, acumulado: 0 } }));
      
      await cargarDatos();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const registrarBloqueEMOM = async (ejerciciosDelBloque, bIndex) => {
    let rondas = 0;

    if (esRegistroPasado) {
        rondas = parseInt(estadoRutina[`EMOM_RONDAS_${bIndex}`]) || 0;
    } else {
        const timerState = emomTimers[bIndex] || { activo: false, inicioTick: null, acumuladoPrevio: 0 };
        let totalSegundos = timerState.acumuladoPrevio;
        if (timerState.activo && timerState.inicioTick) {
          totalSegundos += Math.floor((Date.now() - timerState.inicioTick) / 1000);
        }
        rondas = Math.floor(totalSegundos / 60) + 1;
        if (totalSegundos >= 600) rondas = 10;
        if (totalSegundos === 0) rondas = 0;
    }

    if (rondas === 0) {
      alert(esRegistroPasado ? 'Introduce el número de rondas completadas.' : 'No has iniciado el cronómetro EMOM. Inícialo para registrar al menos 1 ronda.');
      return;
    }

    setCargando(true);
    try {
      const idSesion = await asegurarSesion();
      const inserts = [];

      ejerciciosDelBloque.forEach(ej => {
        const datos = estadoRutina[ej] || {};
        const pesoNum = parseFloat(datos.peso) || null;
        const repsNum = parseInt(datos.reps) || null; 

        for (let i = 0; i < rondas; i++) {
          inserts.push({
            sesion_id: idSesion,
            ejercicio: ej,
            categoria: 'emom',
            peso_kg: pesoNum,
            repeticiones: repsNum
          });
        }
      });

      const { error: errBatch } = await supabase.from('series').insert(inserts);
      if (errBatch) throw errBatch;
      
      setEstadoRutina(prev => {
        const newState = { ...prev };
        ejerciciosDelBloque.forEach(ej => { 
            newState[ej] = { ...(newState[ej] || {}), reps: '', peso: '' }; 
        });
        newState[`EMOM_RONDAS_${bIndex}`] = '';
        return newState;
      });

      await cargarDatos();
      alert(`Bloque EMOM guardado correctamente (${rondas} rondas registradas).`);
    } catch (err) {
      alert(`Error al guardar EMOM: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const registrarNota = async (nombreEj) => {
    const texto = estadoRutina[nombreEj]?.textoNota;
    if (!texto || texto.trim() === '') return;
    setCargando(true);
    try {
      const idSesion = await asegurarSesion();
      const { error: errSerie } = await supabase.from('series').insert([{
        sesion_id: idSesion,
        ejercicio: nombreEj,
        categoria: 'nota',
        notas: texto.trim()
      }]);
      if (errSerie) throw errSerie;
      
      setEstadoRutina(prev => ({ ...prev, [nombreEj]: { ...(prev[nombreEj] || {}), textoNota: '', mostrandoNota: false } }));
      await cargarDatos();
    } catch (err) {
      alert(`Error al guardar nota: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const toggleRecuperacion = async (nombreEj) => {
    if (descansoActual.activo) {
      if (descansoActual.ejercicio === nombreEj) {
        setCargando(true);
        try {
          const idSesion = await asegurarSesion();
          const { error: errSerie } = await supabase.from('series').insert([{
            sesion_id: idSesion,
            ejercicio: nombreEj,
            categoria: 'recuperacion',
            tiempo_segundos: segundosDescanso
          }]);
          
          if (errSerie) throw errSerie;
          
          setDescansoActual({ activo: false, ejercicio: null, inicio: null });
          setSegundosDescanso(0);
          await cargarDatos();
        } catch (err) {
          alert(`Error al guardar recuperación: ${err.message}`);
        } finally {
          setCargando(false);
        }
      } else {
        alert(`Ya tienes un descanso activo en "${descansoActual.ejercicio}". Detenlo primero.`);
      }
    } else {
      setDescansoActual({ activo: true, ejercicio: nombreEj, inicio: Date.now() });
      setSegundosDescanso(0);
    }
  };

  const finalizarSesion = async () => {
    setCronometroActivo(false);
    setDescansoActual({ activo: false, ejercicio: null, inicio: null }); 
    setEstadoCalentamiento({ activo: false, inicioTick: null, acumuladoPrevio: 0, mostrandoInfo: false });
    
    setEmomTimers(prev => {
      const paused = { ...prev };
      Object.keys(paused).forEach(k => {
        if (paused[k].activo) {
          paused[k].acumuladoPrevio += Math.floor((Date.now() - paused[k].inicioTick) / 1000);
          paused[k].activo = false;
          paused[k].inicioTick = null;
        }
      });
      return paused;
    });

    setEjTimers(prev => {
        const paused = { ...prev };
        Object.keys(paused).forEach(k => {
          if (paused[k].activo) {
            paused[k].acumulado += Math.floor((Date.now() - paused[k].inicioTick) / 1000);
            paused[k].activo = false;
            paused[k].inicioTick = null;
          }
        });
        return paused;
    });

    setHiitTimers(prev => {
        const paused = { ...prev };
        Object.keys(paused).forEach(k => {
          if (paused[k].activo) {
            paused[k].acumulado += Math.floor((Date.now() - paused[k].inicioTick) / 1000);
            paused[k].activo = false;
            paused[k].inicioTick = null;
          }
        });
        return paused;
    });

    if (!sesionActivaId) {
      setVista(esRegistroPasado ? 'historial' : 'menu');
      return;
    }

    if (!esRegistroPasado) {
      try {
        await supabase.from('sesiones').update({ duracion_segundos: segundos }).eq('id', sesionActivaId);
        await cargarDatos();
        setVista('resumen_final');
      } catch (err) {
        alert("Error guardando el tiempo: " + err.message);
        setVista('menu');
      }
    } else {
      setVista('historial');
    }
  };

  const borrarRegistro = async (id, tabla) => {
    if (!window.confirm('¿Seguro que quieres eliminar este registro?')) return;
    try {
      const { error } = await supabase.from(tabla).delete().eq('id', id);
      if (error) throw error;
      cargarDatos(); 
      if (vista === 'resumen_dia' && sesionSeleccionada) setVista('historial'); 
    } catch (err) { alert(`Error al borrar: ${err.message}`); }
  };

  const guardarPeso = async (nuevoPeso) => { 
    setCargando(true);
    try {
      await supabase.from('historial_peso').insert([{ peso: parseFloat(nuevoPeso) }]);
      await cargarDatos();
      setSubVistaPeso('lista'); 
    } catch (err) { alert(err.message); } finally { setCargando(false); }
  };

  const iniciarRutina = (clave, fechaSeleccionada = null) => {
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const fechaAUsar = fechaSeleccionada || hoyStr;
    const esEntrenamientoActual = fechaAUsar === hoyStr;
    
    const sesionExistente = sesionesHistorial.find(s => s.fecha === fechaAUsar);
    
    if (sesionExistente) {
      alert(`Ya se ha registrado un entrenamiento para el día ${fechaAUsar.split('-').reverse().join('/')}. Modifica o elimina el antiguo para crear uno nuevo.`);
      return; 
    }

    setDiaActivo(clave);
    setSesionActivaId(null);
    setFechaEntrenamiento(fechaAUsar);
    setDescansoActual({ activo: false, ejercicio: null, inicio: null });
    setEstadoCalentamiento({ activo: false, inicioTick: null, acumuladoPrevio: 0, mostrandoInfo: false });
    setSegundosCalentamiento(0);
    setCalentamientoManual({ min: '', sec: '' });
    setEmomTimers({});
    setEjTimers({});
    setHiitTimers({});
    
    const estadoInicial = {};
    rutinasDb[clave].ejercicios.forEach(ej => { 
      if (!ej) return;
      estadoInicial[ej] = { peso: '', reps: '', mins: '', secs: '', completado: false, mostrandoNota: false, mostrandoInfo: false, textoNota: '' }; 
    });
    setEstadoRutina(estadoInicial);
    
    if (esEntrenamientoActual) {
      setHoraInicio(Date.now());
      setSegundos(0);
      setCronometroActivo(true);
    } else {
      setHoraInicio(null);
      setCronometroActivo(false);
      setSegundos(0);
    }
    
    setVista('entrenando');
  };

  // --------------------------------------------------------------------------
  // LÓGICA DE HITOS Y ESTADÍSTICAS
  // --------------------------------------------------------------------------
  const historialHitos = useMemo(() => {
    const hitos = [];
    const prs = {}; 
    const sesionesAsc = [...sesionesHistorial].sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
      return new Date(a.created_at) - new Date(b.created_at);
    });

    sesionesAsc.forEach(sesion => {
      const mejoresDeSesion = {};
      sesion.series.forEach(serie => {
        if (!serie || !serie.ejercicio) return;
        if (serie.categoria === 'recuperacion' || serie.categoria === 'nota' || serie.categoria === 'calentamiento') return;
        const ej = serie.ejercicio;
        const cat = serie.categoria;
        
        if (!mejoresDeSesion[ej]) {
          mejoresDeSesion[ej] = serie;
        } else {
          const actual = serie;
          const mejor = mejoresDeSesion[ej];
          let esMejor = false;
          if (cat === 'fuerza' || cat === 'traslado' || cat === 'emom' || cat === 'hiit') {
            const pA = actual.peso_kg || 0; const pM = mejor.peso_kg || 0;
            const rA = actual.repeticiones || actual.distancia_metros || 0;
            const rM = mejor.repeticiones || mejor.distancia_metros || 0;
            if (pA > pM) esMejor = true;
            else if (pA === pM && rA > rM) esMejor = true;
          } else {
            const tA = actual.tiempo_segundos || 0; const tM = mejor.tiempo_segundos || 0;
            const pA = actual.peso_kg || 0; const pM = mejor.peso_kg || 0;
            if (pA > pM) esMejor = true;
            else if (pA === pM && tA > tM) esMejor = true;
          }
          if (esMejor) mejoresDeSesion[ej] = actual;
        }
      });

      Object.values(mejoresDeSesion).forEach(mejorSesion => {
        const ej = mejorSesion.ejercicio;
        const cat = mejorSesion.categoria;
        const historialPR = prs[ej];

        if (!historialPR) {
          prs[ej] = mejorSesion; 
        } else {
          let esNuevoPR = false;
          let mensajeHito = "";

          const pActual = mejorSesion.peso_kg || 0;
          const rActual = mejorSesion.repeticiones || mejorSesion.distancia_metros || 0;
          const tActual = mejorSesion.tiempo_segundos || 0;

          const pHist = historialPR.peso_kg || 0;
          const rHist = historialPR.repeticiones || historialPR.distancia_metros || 0;
          const tHist = historialPR.tiempo_segundos || 0;

          if (cat === 'fuerza' || cat === 'traslado' || cat === 'emom' || cat === 'hiit') {
            if (pActual > pHist) {
              esNuevoPR = true;
              mensajeHito = `+${pActual - pHist}kg`;
            } else if (pActual === pHist && rActual > rHist) {
              esNuevoPR = true;
              const unidad = cat === 'traslado' ? 'm' : (cat === 'hiit' ? 'rondas' : 'reps');
              mensajeHito = `+${rActual - rHist} ${unidad} ${pActual > 0 ? `(${pActual}kg)` : ''}`;
            }
          } else {
            if (pActual > pHist) {
              esNuevoPR = true;
              mensajeHito = `+${pActual - pHist}kg`;
            } else if (pActual === pHist && tActual > tHist) {
              esNuevoPR = true;
              mensajeHito = `+${formatearTiempoTexto(tActual - tHist)} ${pActual > 0 ? `(${pActual}kg)` : ''}`;
            }
          }

          if (esNuevoPR) {
            prs[ej] = mejorSesion;
            hitos.push({
              id: `${sesion.id}-${ej}`,
              sesionId: sesion.id,
              fecha: sesion.fecha,
              ejercicio: ej,
              mensaje: mensajeHito.trim()
            });
          }
        }
      });
    });

    return hitos.reverse();
  }, [sesionesHistorial]);

  const calcularProgreso = useCallback(() => {
    const estadisticas = [];
    Object.entries(rutinasDb).forEach(([claveRutina, rutina]) => {
      const datosCategoria = { categoria: rutina.titulo, progresos: [] };
      rutina.ejercicios.forEach(nombreEj => {
        let seriesHistorialEj = [];
        sesionesHistorial.forEach(sesion => {
          const seriesDelEjercicio = sesion.series.filter(s => s.ejercicio === nombreEj && s.categoria !== 'recuperacion' && s.categoria !== 'nota' && s.categoria !== 'calentamiento');
          if(seriesDelEjercicio.length > 0) seriesHistorialEj.push({ fecha: sesion.fecha, series: seriesDelEjercicio });
        });
        seriesHistorialEj.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        if (seriesHistorialEj.length >= 2) {
          const sesionActual = seriesHistorialEj[0];
          const sesionAnterior = seriesHistorialEj[1];
          const cat = clasificarEjercicio(nombreEj);

          let maxPesoActual = 0; let totalSecundarioActual = 0;
          sesionActual.series.forEach(s => {
            const p = s.peso_kg || 0;
            let sec = s.repeticiones || 0;
            if (s.tiempo_segundos) sec = (cat === 'cardio' || cat === 'movilidad') ? Math.floor(s.tiempo_segundos / 60) : s.tiempo_segundos;
            if (s.distancia_metros) sec = s.distancia_metros;
            if (p > maxPesoActual) maxPesoActual = p;
            totalSecundarioActual += sec;
          });

          let maxPesoAnterior = 0; let totalSecundarioAnterior = 0;
          sesionAnterior.series.forEach(s => {
            const p = s.peso_kg || 0;
            let sec = s.repeticiones || 0;
            if (s.tiempo_segundos) sec = (cat === 'cardio' || cat === 'movilidad') ? Math.floor(s.tiempo_segundos / 60) : s.tiempo_segundos;
            if (s.distancia_metros) sec = s.distancia_metros;
            if (p > maxPesoAnterior) maxPesoAnterior = p;
            totalSecundarioAnterior += sec;
          });

          const difPeso = maxPesoActual - maxPesoAnterior;
          const difSecundario = totalSecundarioActual - totalSecundarioAnterior;

          let rondasActual = 0, repsPorRondaActual = 0, difRondas = 0, difRepsPorRonda = 0;
          if (cat === 'emom') {
            rondasActual = sesionActual.series.length;
            repsPorRondaActual = sesionActual.series[0]?.repeticiones || 0;
            const rondasAnterior = sesionAnterior.series.length;
            const repsPorRondaAnterior = sesionAnterior.series[0]?.repeticiones || 0;

            difRondas = rondasActual - rondasAnterior;
            difRepsPorRonda = repsPorRondaActual - repsPorRondaAnterior;
          }
          
          if (maxPesoAnterior > 0 || totalSecundarioAnterior > 0 || cat === 'emom') {
            datosCategoria.progresos.push({ 
              ejercicio: nombreEj, 
              categoriaEj: cat, 
              fechaActual: sesionActual.fecha, 
              pesoActual: maxPesoActual, 
              secundarioActual: totalSecundarioActual, 
              difPeso, 
              difSecundario,
              rondasActual,
              repsPorRondaActual,
              difRondas,
              difRepsPorRonda
            });
          }
        }
      });
      if (datosCategoria.progresos.length > 0) estadisticas.push(datosCategoria);
    });
    return estadisticas;
  }, [rutinasDb, sesionesHistorial]);

  const calcularMejoresMarcas = useCallback(() => {
    const mejoresMarcas = [];
    Object.entries(rutinasDb).forEach(([claveRutina, rutina]) => {
      const datosCategoria = { categoria: rutina.titulo, ejercicios: [] };
      rutina.ejercicios.forEach(nombreEj => {
        let todasLasSeries = [];
        sesionesHistorial.forEach(sesion => {
          const seriesEj = sesion.series.filter(s => s.ejercicio === nombreEj && s.categoria !== 'recuperacion' && s.categoria !== 'nota' && s.categoria !== 'calentamiento');
          seriesEj.forEach(s => s.fecha_sesion = sesion.fecha);
          todasLasSeries = todasLasSeries.concat(seriesEj);
        });

        if (todasLasSeries.length > 0) {
          const cat = clasificarEjercicio(nombreEj);
          let mejor = todasLasSeries[0];
          todasLasSeries.forEach(serie => {
            if (cat === 'fuerza' || cat === 'traslado' || cat === 'emom' || cat === 'hiit') {
              const pMejor = mejor.peso_kg || 0; const pActual = serie.peso_kg || 0;
              const rMejor = mejor.repeticiones || mejor.distancia_metros || 0; const rActual = serie.repeticiones || serie.distancia_metros || 0;
              if (pActual > pMejor) mejor = serie;
              else if (pActual === pMejor && rActual > rMejor) mejor = serie;
            } else {
              const tMejor = mejor.tiempo_segundos || 0; const tActual = serie.tiempo_segundos || 0;
              if (tActual > tMejor) mejor = serie;
            }
          });
          datosCategoria.ejercicios.push({ nombre: nombreEj, mejorSerie: mejor });
        }
      });
      if (datosCategoria.ejercicios.length > 0) mejoresMarcas.push(datosCategoria);
    });
    return mejoresMarcas;
  }, [rutinasDb, sesionesHistorial]);

  // --------------------------------------------------------------------------
  // MEMORIZACIÓN UI
  // --------------------------------------------------------------------------
  const racha = useMemo(() => new Set(sesionesHistorial.map(s => s.fecha)).size, [sesionesHistorial]);

  const { pesoActual, diferenciaPeso, iconoTendencia, colorTendencia } = useMemo(() => {
    if (historialPeso.length === 0) return { pesoActual: '--', diferenciaPeso: 0, iconoTendencia: '', colorTendencia: '#888' };
    const actual = historialPeso[0].peso;
    let dif = 0, icono = '', color = '#888';
    if (historialPeso.length >= 2) {
      dif = (actual - historialPeso[1].peso).toFixed(2);
      if (dif > 0) { icono = '▲'; color = '#ef4444'; } 
      else if (dif < 0) { icono = '▼'; color = '#22c55e'; }
    }
    return { pesoActual: actual, diferenciaPeso: dif, iconoTendencia: icono, colorTendencia: color };
  }, [historialPeso]);

  const nodosCalendario = useMemo(() => {
    const mes = fechaCalendario.getMonth();
    const anio = fechaCalendario.getFullYear();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    let pDia = new Date(anio, mes, 1).getDay();
    pDia = pDia === 0 ? 6 : pDia - 1;

    const hoy = new Date();
    const esMesActual = hoy.getMonth() === mes && hoy.getFullYear() === anio;
    const diasEntrenadosSet = new Set(sesionesHistorial.map(s => s.fecha));

    let dias = [];
    for (let i = 0; i < pDia; i++) dias.push(<div key={`vacio-${i}`} style={{ width: '14%' }}></div>);

    for (let i = 1; i <= diasEnMes; i++) {
      const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const entrenado = diasEntrenadosSet.has(fechaStr);
      const esHoy = esMesActual && i === hoy.getDate();

      dias.push(
        <div key={i} 
          onClick={() => {
            const sesionEseDia = sesionesHistorial.find(s => s.fecha === fechaStr);
            if (sesionEseDia) {
              setSesionSeleccionada(sesionEseDia);
              setVista('resumen_dia');
            }
          }} 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '14%', cursor: entrenado ? 'pointer' : 'default' }}
        >
          <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: esHoy ? '#f59e0b' : 'transparent', color: esHoy ? '#000' : '#e5e5e5', fontWeight: esHoy ? 'bold' : 'normal', fontSize: '0.85rem' }}>{i}</div>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: entrenado ? '#ffffff' : 'transparent' }}></div>
        </div>
      );
    }
    return dias;
  }, [fechaCalendario, sesionesHistorial]);

  const seriesAgrupadasResumen = useMemo(() => {
    if (!sesionActivaId) return {};
    const sesion = sesionesHistorial.find(s => s.id === sesionActivaId);
    if (!sesion) return {};
    const agrupado = {};
    sesion.series.forEach(serie => {
      if (serie.categoria === 'recuperacion' || serie.categoria === 'nota' || serie.categoria === 'calentamiento') return; 
      if (!agrupado[serie.ejercicio]) agrupado[serie.ejercicio] = { categoria: serie.categoria, metricas: [] };
      agrupado[serie.ejercicio].metricas.push(formatearMetricaBreve(serie));
    });
    return agrupado;
  }, [sesionesHistorial, sesionActivaId]);

  const bloquesEntrenamiento = useMemo(() => {
    if (vista !== 'entrenando' || !diaActivo || !rutinasDb[diaActivo]) return [];
    
    const bloques = [];
    let bloqueActual = { esEmom: false, emomId: null, ejercicios: [] };

    rutinasDb[diaActivo].ejercicios.forEach(ej => {
      if (!ej) return; 
      const esEmom = clasificarEjercicio(ej) === 'emom';
      const match = (typeof ej === 'string') ? ej.match(/EMOM\s*\d*/i) : null;
      const emomId = esEmom && match ? match[0].toUpperCase() : null;
      
      if (bloqueActual.esEmom === esEmom && (!esEmom || bloqueActual.emomId === emomId) && bloqueActual.ejercicios.length > 0) {
        bloqueActual.ejercicios.push(ej);
      } else {
        if (bloqueActual.ejercicios.length > 0) bloques.push(bloqueActual);
        bloqueActual = { esEmom, emomId, ejercicios: [ej] };
      }
    });
    if (bloqueActual.ejercicios.length > 0) bloques.push(bloqueActual);

    return bloques;
  }, [vista, diaActivo, rutinasDb]);

  const calentamientosRegistrados = sesionesHistorial.find(s => s.id === sesionActivaId)?.series.filter(s => s.categoria === 'calentamiento') || [];
  const hitosHoy = historialHitos.filter(h => h.sesionId === sesionActivaId);

  // ============================================================================
  // RENDERIZADO
  // ============================================================================
  if (errorGlobal) {
    return (
      <div style={{...appStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <h2 style={{color: '#ef4444'}}>Error de Sistema</h2><p style={{color: tema.textMuted}}>{errorGlobal}</p>
        <button onClick={cargarDatos} style={{...btnStyle, marginTop: '20px', width: 'auto', padding: '12px 24px'}}>Reintentar</button>
      </div>
    );
  }

  return (
    <div style={appStyle}>
      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
        
        {vista !== 'menu' && vista !== 'resumen_final' && (
          <button onClick={() => setVista('menu')} style={{ background: 'none', border: 'none', color: tema.textMuted, fontSize: '1rem', cursor: 'pointer', marginBottom: '24px', padding: 0 }}>← Volver</button>
        )}

        {/* --- VISTA: MENÚ --- */}
        {vista === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px', margin: '0 0 8px 0' }}>Bienvenido Joaquín</h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: '600' }}>{racha}</span>
                </div>
                <span style={{ fontSize: '0.85rem', color: tema.textMuted, fontWeight: '500' }}>Días entrenados</span>
              </div>
              <div onClick={() => setVista('peso')} style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: '700', margin: '0' }}>{pesoActual}<span style={{ fontSize: '1rem', color: tema.textMuted }}>kg</span></span>
                <span style={{ fontSize: '0.85rem', color: tema.textMuted, marginTop: '4px' }}>Peso corporal</span>
                {historialPeso.length >= 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
                    <span style={{ color: colorTendencia, fontSize: '0.8rem' }}>{iconoTendencia}</span>
                    <span style={{ color: tema.textMuted, fontSize: '0.85rem' }}>{Math.abs(diferenciaPeso)} kg</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ ...cardStyle, padding: '24px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button onClick={() => setFechaCalendario(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() - 1); return d; })} style={{ background: 'none', border: 'none', color: tema.textMuted, cursor: 'pointer', fontSize: '1.2rem', padding: '0 10px' }}>{'<'}</button>
                <span style={{ fontSize: '1rem', color: tema.text, fontWeight: '600' }}>
                  {fechaCalendario.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
                </span>
                <button onClick={() => setFechaCalendario(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() + 1); return d; })} style={{ background: 'none', border: 'none', color: tema.textMuted, cursor: 'pointer', fontSize: '1.2rem', padding: '0 10px' }}>{'>'}</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', textAlign: 'center' }}>
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <span key={d} style={{ width: '14%', fontSize: '0.75rem', color: tema.textMuted, fontWeight: 'bold' }}>{d}</span>)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: '12px' }}>{nodosCalendario}</div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <div onClick={() => window.open(LINK_RESERVA_GIMNASIO, '_blank')} style={{...navItemStyle, border: `1px solid #8b5cf6`}}>
                 <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#a78bfa' }}>Reservar sesión (Gimnasio)</span>
                 <span>🔗</span>
              </div>
              <div onClick={() => setVista('seleccion_dia')} style={navItemStyle}><span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Comenzar entrenamiento</span><span style={{ color: tema.textMuted }}>+</span></div>
              <div onClick={() => setVista('historial')} style={navItemStyle}><span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Historial semanal</span><span style={{ color: tema.textMuted }}>≡</span></div>
              <div onClick={() => setVista('estadisticas')} style={{...navItemStyle, border: `1px solid #3b82f6`}}>
                 <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#3b82f6' }}>Estadísticas y Progreso</span>
                 <span>📈</span>
              </div>
            </div>
          </div>
        )}

        {/* --- VISTA: SELECCIÓN DÍA --- */}
        {vista === 'seleccion_dia' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>¿Qué desea entrenar hoy?</h2>
            {Object.keys(rutinasDb).length === 0 ? <p style={{ color: tema.textMuted }}>Cargando rutinas...</p> : Object.entries(rutinasDb).map(([clave, datos]) => (
              <div key={clave} onClick={() => iniciarRutina(clave)} style={{ ...navItemStyle, marginBottom: '16px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{datos.titulo}</span><span style={{ color: tema.textMuted }}>→</span>
              </div>
            ))}
          </div>
        )}

        {/* --- VISTA: SELECCIÓN PASADO --- */}
        {vista === 'seleccion_pasado' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Registrar sesión pasada</h2>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: tema.textMuted, fontWeight: '600' }}>1. Selecciona la fecha</label>
              <input type="date" id="input-fecha-pasada" style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer', marginBottom: '12px' }} defaultValue={new Date().toISOString().split('T')[0]} onClick={(e) => { if (e.target.showPicker) e.target.showPicker(); }} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: tema.textMuted, fontWeight: '600' }}>2. Selecciona la rutina</h3>
            {Object.keys(rutinasDb).length === 0 ? <p style={{ color: tema.textMuted }}>Cargando rutinas...</p> : Object.entries(rutinasDb).map(([clave, datos]) => (
              <div key={clave} onClick={() => {
                const inputFecha = document.getElementById('input-fecha-pasada');
                if (!inputFecha.value) { alert('Debes seleccionar una fecha.'); return; }
                iniciarRutina(clave, inputFecha.value);
              }} style={{ ...navItemStyle, marginBottom: '16px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{datos.titulo}</span><span style={{ color: tema.textMuted }}>→</span>
              </div>
            ))}
          </div>
        )}

        {/* --- VISTA: ENTRENANDO --- */}
        {vista === 'entrenando' && diaActivo && rutinasDb[diaActivo] && (
          <div style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '24px', borderBottom: `1px solid ${tema.border}`, paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 4px 0' }}>{rutinasDb[diaActivo].titulo}</h2>
                <span style={{ color: tema.textMuted, fontSize: '0.9rem' }}>
                  Registrando para: {new Date(fechaEntrenamiento + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              
              {cronometroActivo && (
                <div style={{ backgroundColor: '#22c55e20', color: '#22c55e', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.2rem', border: '1px solid #22c55e50' }}>
                  {formatearTiempo(segundos)}
                </div>
              )}
            </div>

            {/* BLOQUE DE CALENTAMIENTO GLOBAL */}
            <div style={{ ...cardStyle, marginBottom: '24px', border: '2px solid #22c55e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', backgroundColor: '#22c55e20', padding: '12px', borderRadius: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#22c55e' }}>Calentamiento Full Body</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setEstadoCalentamiento(prev => ({ ...prev, mostrandoInfo: !prev.mostrandoInfo }))} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: estadoCalentamiento.mostrandoInfo ? '#22c55e' : tema.textMuted, padding: '0 4px' }}
                    title="Ver rutina de calentamiento"
                  >ⓘ</button>
                </div>
              </div>

              {estadoCalentamiento.mostrandoInfo && (
                <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '12px', marginBottom: '16px', borderLeft: '3px solid #22c55e', fontSize: '0.9rem', color: '#e5e7eb', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                  {INFO_EJERCICIOS["Calentamiento"]}
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                {esRegistroPasado ? (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={calentamientoManual.min} 
                      onChange={(e) => setCalentamientoManual(p => ({...p, min: e.target.value}))} 
                      style={{ ...inputStyle, textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: 0 }} 
                    />
                    <input 
                      type="number" 
                      placeholder="Seg" 
                      value={calentamientoManual.sec} 
                      onChange={(e) => setCalentamientoManual(p => ({...p, sec: e.target.value}))} 
                      style={{ ...inputStyle, textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: 0 }} 
                    />
                  </div>
                ) : (
                  <span style={{ fontSize: '4rem', fontWeight: '800', fontFamily: 'monospace', color: estadoCalentamiento.activo ? '#22c55e' : '#fff' }}>
                    {formatearCrono(segundosCalentamiento)}
                  </span>
                )}
              </div>

              {calentamientosRegistrados.length > 0 && (
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {calentamientosRegistrados.map((serie) => (
                    <div key={serie.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '10px 12px', borderRadius: '8px', fontSize: '0.9rem', borderLeft: '2px solid #22c55e' }}>
                      <span style={{ color: '#22c55e', fontWeight: '600', flex: 1 }}>Calentamiento</span>
                      <span style={{ fontWeight: '600', color: '#22c55e', flex: 'none' }}>
                        {formatearMetricaUI(serie)}
                      </span>
                      <button onClick={() => borrarRegistro(serie.id, 'series')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '1.1rem', marginLeft: '8px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                {!esRegistroPasado && (
                  <button 
                    onClick={() => {
                      if (estadoCalentamiento.activo) {
                        const elapsed = Math.floor((Date.now() - estadoCalentamiento.inicioTick) / 1000);
                        setEstadoCalentamiento(prev => ({ ...prev, activo: false, inicioTick: null, acumuladoPrevio: prev.acumuladoPrevio + elapsed }));
                      } else {
                        setEstadoCalentamiento(prev => ({ ...prev, activo: true, inicioTick: Date.now() }));
                      }
                    }}
                    style={{ ...btnStyle, flex: 1, backgroundColor: estadoCalentamiento.activo ? '#ef4444' : '#22c55e', color: '#fff', fontSize: '0.95rem' }}
                  >
                    {estadoCalentamiento.activo ? 'Pausar' : (segundosCalentamiento > 0 ? 'Reanudar' : 'Iniciar')}
                  </button>
                )}

                <button 
                  onClick={registrarCalentamiento} 
                  style={{ ...btnStyle, flex: 1, backgroundColor: '#2a2a2a', color: '#fff', fontSize: '0.95rem' }}
                  disabled={cargando || (!esRegistroPasado && segundosCalentamiento === 0)}
                >
                  Finalizar Calentamiento
                </button>
              </div>
            </div>
            
            {bloquesEntrenamiento.map((bloque, bIndex) => {
              
              if (bloque.esEmom) {
                const timerState = emomTimers[bIndex] || { activo: false, inicioTick: null, acumuladoPrevio: 0 };
                let totalSegundos = timerState.acumuladoPrevio;
                if (timerState.activo && timerState.inicioTick) {
                  totalSegundos += Math.floor((now - timerState.inicioTick) / 1000);
                }

                const isCompleted = totalSegundos >= 600;
                const isStarted = totalSegundos > 0;
                let rondaActual = Math.floor(totalSegundos / 60) + 1;
                if (totalSegundos >= 600) rondaActual = 10;
                if (totalSegundos === 0) rondaActual = 0;
                
                const segundosRestantes = isCompleted ? 0 : 60 - (totalSegundos % 60);
                const tituloEMOM = bloque.emomId ? `Modo ${bloque.emomId} (10 Min)` : 'Modo EMOM (10 Min)';

                return (
                  <div key={`emom-${bIndex}`} style={{ ...cardStyle, marginBottom: '20px', border: isCompleted ? '2px solid #22c55e' : '2px solid #8b5cf6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', backgroundColor: isCompleted ? '#22c55e20' : '#8b5cf620', padding: '12px', borderRadius: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: isCompleted ? '#22c55e' : '#a78bfa' }}>{tituloEMOM}</h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!isCompleted && !esRegistroPasado && (
                          <button 
                            onClick={() => toggleEmom(bIndex)}
                            style={{ ...btnStyle, width: 'auto', padding: '8px 16px', backgroundColor: timerState.activo ? '#ef4444' : '#a78bfa', color: '#fff', fontSize: '0.9rem' }}
                          >
                            {timerState.activo ? 'Pausar Reloj' : (isStarted ? 'Reanudar' : 'Iniciar Reloj EMOM')}
                          </button>
                        )}
                        {isStarted && !esRegistroPasado && (
                          <button 
                            onClick={() => resetEmom(bIndex)}
                            style={{ ...btnStyle, width: 'auto', padding: '8px 16px', backgroundColor: '#333', color: '#fff', fontSize: '0.9rem' }}
                          >
                            Reiniciar
                          </button>
                        )}
                      </div>
                    </div>

                    {esRegistroPasado ? (
                      <div style={{ marginBottom: '24px' }}>
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          placeholder="Rondas completadas (ej. 10)" 
                          value={estadoRutina[`EMOM_RONDAS_${bIndex}`] || ''} 
                          onChange={(e) => setEstadoRutina(prev => ({ ...prev, [`EMOM_RONDAS_${bIndex}`]: e.target.value }))} 
                          style={{ ...inputStyle, textAlign: 'center', fontSize: '1.1rem' }} 
                        />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        {isCompleted ? (
                          <span style={{ fontSize: '2rem', fontWeight: '800', color: '#22c55e', display: 'block' }}>¡EMOM Superado!</span>
                        ) : (
                          <>
                            <span style={{ fontSize: '1rem', color: tema.textMuted, display: 'block', textTransform: 'uppercase', letterSpacing: '2px' }}>
                              Ronda {rondaActual} de 10
                            </span>
                            <span style={{ fontSize: '4rem', fontWeight: '800', fontFamily: 'monospace', color: timerState.activo ? '#22c55e' : '#fff' }}>
                              {String(segundosRestantes).padStart(2, '0')}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    <div style={{ borderBottom: `1px solid ${tema.border}`, marginBottom: '16px', paddingBottom: '16px' }}>
                      <p style={{ color: tema.textMuted, fontSize: '0.85rem', lineHeight: '1.5' }}>
                        Introduce el peso de cada ejercicio antes de empezar. Pulsa "Registrar Bloque Completo" para guardar las rondas que hayas completado.
                      </p>
                    </div>

                    {bloque.ejercicios.map(ej => {
                      const desactivarPeso = false; 
                      return (
                        <div key={ej} style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{ej}</span>
                            <button 
                              onClick={() => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), mostrandoInfo: !(prev[ej]?.mostrandoInfo) } }))} 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: estadoRutina[ej]?.mostrandoInfo ? '#3b82f6' : tema.textMuted, padding: '0 4px' }}
                            >ⓘ</button>
                          </div>

                          {estadoRutina[ej]?.mostrandoInfo && (
                            <div style={{ backgroundColor: '#1a1a1a', padding: '12px', borderRadius: '8px', marginBottom: '12px', borderLeft: '3px solid #3b82f6', fontSize: '0.85rem', color: '#e5e7eb', whiteSpace: 'pre-line' }}>
                              {obtenerInfoEjercicio(ej)}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="number" step="any" placeholder={"Peso/Lastre"} value={estadoRutina[ej]?.peso || ''} onChange={(e) => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), peso: e.target.value } }))} style={{ ...inputStyle, padding: '12px' }} />
                            <input type="number" placeholder="Reps / Ronda" value={estadoRutina[ej]?.reps || ''} onChange={(e) => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), reps: e.target.value } }))} style={{...inputStyle, padding: '12px'}} />
                          </div>
                        </div>
                      );
                    })}

                    <button 
                      onClick={() => registrarBloqueEMOM(bloque.ejercicios, bIndex)} 
                      style={{ ...btnStyle, backgroundColor: isCompleted ? '#22c55e' : '#8b5cf6', color: '#fff', marginTop: '12px' }}
                      disabled={cargando}
                    >
                      Registrar Bloque Completo ({esRegistroPasado ? (estadoRutina[`EMOM_RONDAS_${bIndex}`] || '?') : (isCompleted ? 10 : rondaActual)} Rondas)
                    </button>
                  </div>
                );
              }

              return bloque.ejercicios.map(ej => {
                const cat = clasificarEjercicio(ej);
                
                const esTimerOnly = cat === 'movilidad' || cat === 'cardio';
                const esIsometria = cat === 'isometria';
                const esHiit = cat === 'hiit';
                
                const mostrarInputsFuerza = cat === 'fuerza' || cat === 'traslado' || cat === 'hiit';
                const mostrarInputsTiempoDiferido = (esTimerOnly || esIsometria) && esRegistroPasado;
                const mostrarInputPesoAislado = esIsometria && !esRegistroPasado;
                const mostrarCronoVivo = (!esRegistroPasado && (esTimerOnly || esIsometria));

                let placeholderSecundario = 'Valor';
                if (cat === 'fuerza') placeholderSecundario = 'Reps';
                if (cat === 'traslado') placeholderSecundario = 'Metros';

                const sesionActual = sesionesHistorial.find(s => s.id === sesionActivaId);
                const seriesRegistradas = sesionActual?.series.filter(s => s.ejercicio === ej) || [];
                const descansoDeEsteEjercicio = descansoActual.activo && descansoActual.ejercicio === ej;

                // Cálculos en vivo para HIIT (10 Rondas de 40s = 400s)
                const hiitState = hiitTimers[ej] || { activo: false, inicioTick: null, acumulado: 0 };
                let hiitSecs = hiitState.acumulado;
                if (hiitState.activo && hiitState.inicioTick) {
                    hiitSecs += Math.floor((now - hiitState.inicioTick) / 1000);
                }
                const isHiitCompleted = hiitSecs >= 400;
                let hiitRonda = Math.floor(hiitSecs / 40) + 1;
                if (hiitSecs >= 400) hiitRonda = 10;
                if (hiitSecs === 0) hiitRonda = 0;
                
                const phaseSecs = hiitSecs % 40;
                const isSprint = phaseSecs < 20 && !isHiitCompleted && hiitSecs > 0;
                const isRecovery = phaseSecs >= 20 && !isHiitCompleted && hiitSecs > 0;
                const currentPhaseSecs = isSprint ? 20 - phaseSecs : (isRecovery ? 40 - phaseSecs : 0);

                return (
                  <div key={ej} style={{ ...cardStyle, marginBottom: '20px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{ej}</h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), mostrandoInfo: !(prev[ej]?.mostrandoInfo) } }))} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: estadoRutina[ej]?.mostrandoInfo ? '#3b82f6' : tema.textMuted, padding: '0 4px' }}
                          title="Ver ejecución del ejercicio"
                        >ⓘ</button>
                        <button 
                          onClick={() => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), mostrandoNota: !(prev[ej]?.mostrandoNota) } }))} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: estadoRutina[ej]?.mostrandoNota ? '#3b82f6' : tema.textMuted, padding: '0 4px' }}
                          title="Añadir nota de sensación"
                        >✏️</button>
                      </div>
                    </div>

                    {estadoRutina[ej]?.mostrandoInfo && (
                      <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '12px', marginBottom: '16px', borderLeft: '3px solid #3b82f6', fontSize: '0.9rem', color: '#e5e7eb', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                        {obtenerInfoEjercicio(ej)}
                      </div>
                    )}

                    {estadoRutina[ej]?.mostrandoNota && (
                      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <textarea
                          value={estadoRutina[ej]?.textoNota || ''}
                          onChange={(e) => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), textoNota: e.target.value } }))}
                          placeholder="Añade una sensación de esta serie..."
                          style={{ ...inputStyle, marginBottom: 0, resize: 'vertical', minHeight: '52px', flex: 1, padding: '14px' }}
                        />
                        <button 
                          onClick={() => registrarNota(ej)} 
                          style={{ ...btnStyle, width: 'auto', backgroundColor: '#3b82f6', color: '#fff', padding: '14px 16px', fontSize: '0.9rem' }}
                          disabled={cargando || !estadoRutina[ej]?.textoNota?.trim()}
                        >Guardar</button>
                      </div>
                    )}

                    {seriesRegistradas.length > 0 && (
                      <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                          let contadorSerie = 0;
                          return seriesRegistradas.map((serie) => {
                            const esRecuperacion = serie.categoria === 'recuperacion';
                            const esNota = serie.categoria === 'nota';
                            if (!esRecuperacion && !esNota) contadorSerie++;
                            
                            return (
                              <div key={serie.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: esNota ? '#1a1a1a' : '#111', padding: '10px 12px', borderRadius: '8px', fontSize: '0.9rem', borderLeft: esNota ? '2px solid #3b82f6' : 'none' }}>
                                <span style={{ color: esRecuperacion ? '#f59e0b' : (esNota ? '#3b82f6' : tema.textMuted), fontWeight: (esRecuperacion || esNota) ? '600' : 'normal', flex: esNota ? 'none' : 1 }}>
                                  {esRecuperacion ? 'Recuperación' : (esNota ? 'Nota:' : `Serie ${contadorSerie}`)}
                                </span>
                                <span style={{ fontWeight: esNota ? 'normal' : '600', color: esRecuperacion ? '#f59e0b' : (esNota ? '#ccc' : '#fff'), flex: esNota ? 1 : 'none', marginLeft: esNota ? '8px' : 0, fontStyle: esNota ? 'italic' : 'normal' }}>
                                  {formatearMetricaUI(serie)}
                                </span>
                                <button onClick={() => borrarRegistro(serie.id, 'series')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '1.1rem', marginLeft: '8px' }}>✕</button>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}

                    {/* BLOQUE DE INTERFAZ HIIT EN VIVO */}
                    {esHiit && !esRegistroPasado && (
                        <div style={{ ...cardStyle, marginBottom: '16px', backgroundColor: '#111', border: isHiitCompleted ? '2px solid #22c55e' : (isSprint ? '2px solid #ef4444' : (isRecovery ? '2px solid #3b82f6' : '2px solid #f59e0b')) }}>
                            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                                {isHiitCompleted ? (
                                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#22c55e' }}>¡HIIT Completado!</span>
                                ) : (
                                    <>
                                        <span style={{ fontSize: '1rem', color: tema.textMuted, display: 'block', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                            Ronda {hiitRonda} de 10
                                        </span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: isSprint ? '#ef4444' : (isRecovery ? '#3b82f6' : '#f59e0b'), display: 'block', margin: '8px 0' }}>
                                            {hiitSecs === 0 ? 'PREPARADO' : (isSprint ? '🔥 SPRINT' : '🧊 RECUPERACIÓN')}
                                        </span>
                                        <span style={{ fontSize: '4rem', fontWeight: '800', fontFamily: 'monospace', color: '#fff' }}>
                                            {String(hiitSecs === 0 ? 20 : currentPhaseSecs).padStart(2, '0')}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {!isHiitCompleted && (
                                    <button onClick={() => toggleHiit(ej)} style={{ ...btnStyle, flex: 1, backgroundColor: hiitState.activo ? '#4a4a4a' : '#f59e0b', color: '#fff' }}>
                                        {hiitState.activo ? 'Pausar' : (hiitSecs > 0 ? 'Reanudar' : 'Iniciar HIIT')}
                                    </button>
                                )}
                                {hiitSecs > 0 && (
                                    <button onClick={() => resetHiit(ej)} style={{ ...btnStyle, width: 'auto', flex: 'none', backgroundColor: '#333', color: '#fff' }}>↺</button>
                                )}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        
                        {/* INPUTS DE FUERZA, TRASLADO O HIIT */}
                        {mostrarInputsFuerza && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="number" step="any" placeholder={cat === 'traslado' ? "Peso/Mano" : "Peso/Lastre"} value={estadoRutina[ej]?.peso || ''} onChange={(e) => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), peso: e.target.value } }))} style={{ ...inputStyle, opacity: esHiit ? 0.3 : 1 }} disabled={esHiit} />
                                {(!esHiit || esRegistroPasado) && (
                                    <input type="number" placeholder={esHiit ? 'Rondas' : placeholderSecundario} value={estadoRutina[ej]?.reps || ''} onChange={(e) => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), reps: e.target.value } }))} style={inputStyle} />
                                )}
                            </div>
                        )}

                        {/* INPUTS DE TIEMPO DIFERIDO (HISTORIAL) */}
                        {mostrarInputsTiempoDiferido && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {esIsometria && (
                                    <input type="number" step="any" placeholder="Peso/Lastre" value={estadoRutina[ej]?.peso || ''} onChange={(e) => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), peso: e.target.value } }))} style={inputStyle} />
                                )}
                                <input type="number" placeholder="Min" value={estadoRutina[ej]?.mins || ''} onChange={(e) => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), mins: e.target.value } }))} style={inputStyle} />
                                <input type="number" placeholder="Seg" value={estadoRutina[ej]?.secs || ''} onChange={(e) => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), secs: e.target.value } }))} style={inputStyle} />
                            </div>
                        )}

                        {/* INPUT DE PESO PARA ISOMETRÍA EN VIVO */}
                        {mostrarInputPesoAislado && (
                             <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="number" step="any" placeholder="Peso/Lastre (Opcional)" value={estadoRutina[ej]?.peso || ''} onChange={(e) => setEstadoRutina(prev => ({ ...prev, [ej]: { ...(prev[ej] || {}), peso: e.target.value } }))} style={inputStyle} />
                             </div>
                        )}

                        {/* CRONÓMETRO EN VIVO */}
                        {mostrarCronoVivo && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <div style={{ backgroundColor: '#1a1a1a', padding: '14px', borderRadius: '16px', flex: 1, textAlign: 'center', border: `1px solid ${ejTimers[ej]?.activo ? '#22c55e' : tema.border}` }}>
                                    <span style={{ fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'monospace', color: ejTimers[ej]?.activo ? '#22c55e' : '#fff' }}>
                                        {formatearCrono(getEjTimerSecs(ej))}
                                    </span>
                                </div>
                                <button onClick={() => toggleEjTimer(ej)} style={{ ...btnStyle, margin: 0, padding: '14px', flex: 1, backgroundColor: ejTimers[ej]?.activo ? '#ef4444' : '#3b82f6', fontSize: '1rem' }}>
                                    {ejTimers[ej]?.activo ? '⏹ Parar' : '▶ Iniciar'}
                                </button>
                                {(getEjTimerSecs(ej) > 0 || ejTimers[ej]?.activo) && (
                                    <button onClick={() => resetEjTimer(ej)} style={{ ...btnStyle, margin: 0, padding: '14px', flex: 'none', width: 'auto', backgroundColor: '#4a4a4a' }}>↺</button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button 
                        onClick={() => registrarSerieRutina(ej)} 
                        style={{ ...btnStyle, flex: 6, padding: '12px', fontSize: '0.95rem', backgroundColor: '#2a2a2a', color: '#fff' }} 
                        disabled={cargando}
                      >Registrar Serie</button>
                      
                      <button 
                        onClick={() => toggleRecuperacion(ej)} 
                        style={{ 
                          ...btnStyle, flex: 4, padding: '12px', fontSize: '0.95rem', 
                          backgroundColor: descansoDeEsteEjercicio ? 'transparent' : '#f59e0b', 
                          color: descansoDeEsteEjercicio ? '#f59e0b' : '#000',
                          border: descansoDeEsteEjercicio ? '2px solid #f59e0b' : '2px solid #f59e0b'
                        }} 
                        disabled={cargando || (descansoActual.activo && !descansoDeEsteEjercicio)}
                      >
                        {descansoDeEsteEjercicio ? formatearTiempo(segundosDescanso) : 'Recuperación'}
                      </button>
                    </div>
                  </div>
                );
              });
            })}
            
            <button onClick={finalizarSesion} style={{ ...btnStyle, marginTop: '24px', backgroundColor: '#fff', color: '#000' }}>
              {fechaEntrenamiento !== `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` ? 'Finalizar registro' : 'Finalizar entrenamiento'}
            </button>
          </div>
        )}

        {/* --- VISTA: RESUMEN FINAL DE SESIÓN --- */}
        {vista === 'resumen_final' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h2 style={{ fontSize: '2rem', color: '#22c55e', marginBottom: '8px' }}>¡Buen trabajo!</h2>
            <p style={{ color: tema.textMuted, marginBottom: '32px' }}>Has finalizado {rutinasDb[diaActivo]?.titulo}</p>
            
            <div style={{ ...cardStyle, marginBottom: '24px', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: tema.textMuted, fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Tiempo Total</span>
              <span style={{ fontSize: '3rem', fontWeight: '700', marginTop: '8px' }}>{formatearTiempo(segundos)}</span>
            </div>

            {hitosHoy.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: '32px', border: '2px solid #eab308', backgroundColor: '#eab30815' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', color: '#eab308' }}>🏆 ¡Nuevos Hitos Alcanzados!</h3>
                {hitosHoy.map(hito => (
                  <div key={hito.id} style={{ marginBottom: '12px', textAlign: 'left', borderBottom: '1px solid #eab30840', paddingBottom: '8px' }}>
                    <span style={{ display: 'block', fontWeight: '700', color: '#fff', fontSize: '1.1rem' }}>{hito.ejercicio}</span>
                    <span style={{ color: '#eab308', fontSize: '0.95rem' }}>Has aumentado <strong>{hito.mensaje}</strong>. ¡Sigue así!</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'left', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', paddingBottom: '8px', borderBottom: `1px solid ${tema.border}` }}>Volumen de la sesión</h3>
              {Object.keys(seriesAgrupadasResumen).length === 0 ? (
                <p style={{ color: tema.textMuted }}>No se registraron series.</p>
              ) : (
                Object.entries(seriesAgrupadasResumen).map(([ejercicio, data]) => (
                  <div key={ejercicio} style={{ marginBottom: '16px' }}>
                    <span style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>{ejercicio}</span>
                    <span style={{ color: tema.textMuted, fontSize: '0.95rem' }}>
                      {data.categoria === 'emom' || data.categoria === 'hiit'
                        ? `${data.metricas.length} rondas registradas (Ej: ${data.metricas[0]})`
                        : (data.categoria === 'calentamiento' ? `${data.metricas.length} log registrado` : `${data.metricas.length} series: [${data.metricas.join(', ')}]`)
                      }
                    </span>
                  </div>
                ))
              )}
            </div>

            <button onClick={() => setVista('menu')} style={{ ...btnStyle, backgroundColor: '#fff', color: '#000' }}>Volver al menú</button>
          </div>
        )}

        {/* --- VISTA: PESO --- */}
        {vista === 'peso' && (
          <div style={{ paddingBottom: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Gestión de Peso Corporal</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', padding: '4px', backgroundColor: '#1a1a1a', borderRadius: '14px' }}>
              <button 
                onClick={() => setSubVistaPeso('lista')} 
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: subVistaPeso === 'lista' ? '#3b82f6' : 'transparent', color: subVistaPeso === 'lista' ? '#fff' : tema.textMuted, fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              >Actualizar / Historial</button>
              <button 
                onClick={() => setSubVistaPeso('grafico')} 
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: subVistaPeso === 'grafico' ? '#3b82f6' : 'transparent', color: subVistaPeso === 'grafico' ? '#fff' : tema.textMuted, fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              >Ver Gráfico</button>
            </div>

            {subVistaPeso === 'lista' && (
              <div>
                <FormularioPeso onGuardar={guardarPeso} cargando={cargando} />
                <h3 style={{ fontSize: '1.1rem', color: tema.textMuted, marginBottom: '16px' }}>Bitácora de peso</h3>
                {historialPeso.map(item => (
                  <div key={item.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '16px' }}>
                    <div><span style={{ display: 'block', fontWeight: '600', fontSize: '1.2rem' }}>{item.peso} kg</span><span style={{ fontSize: '0.8rem', color: tema.textMuted }}>{new Date(item.created_at).toLocaleDateString()}</span></div>
                    <button onClick={() => borrarRegistro(item.id, 'historial_peso')} style={{ background: 'none', border: 'none', color: tema.textMuted, cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {subVistaPeso === 'grafico' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <select 
                    value={rangoGrafico} 
                    onChange={(e) => setRangoGrafico(e.target.value)} 
                    style={{ ...inputStyle, width: 'auto', marginBottom: 0, padding: '8px 16px', borderRadius: '8px' }}
                  >
                    <option value="7">Últimos 7 días</option>
                    <option value="30">Últimos 30 días</option>
                    <option value="90">Últimos 3 meses</option>
                    <option value="all">Histórico completo</option>
                  </select>
                </div>
                <GraficoSVG historial={historialPeso} rango={rangoGrafico} />
              </div>
            )}
          </div>
        )}

        {/* --- VISTA: HISTORIAL --- */}
        {vista === 'historial' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Historial</h2>
            <button onClick={() => setVista('seleccion_pasado')} style={{ ...btnStyle, marginBottom: '24px', backgroundColor: '#fff', color: '#000' }}>
              + Añadir Registro Pasado
            </button>
            
            <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="date" 
                value={filtroFechaHistorial}
                onChange={(e) => setFiltroFechaHistorial(e.target.value)}
                style={{ ...inputStyle, marginBottom: 0, flex: 1, padding: '12px', colorScheme: 'dark' }}
              />
              {filtroFechaHistorial && (
                <button 
                  onClick={() => setFiltroFechaHistorial('')} 
                  style={{ ...btnStyle, width: 'auto', padding: '12px 16px', backgroundColor: '#ef4444', color: '#fff' }}
                >
                  ✕
                </button>
              )}
            </div>
            
            {(() => {
              const sesionesFiltradas = filtroFechaHistorial 
                ? sesionesHistorial.filter(s => s.fecha === filtroFechaHistorial)
                : sesionesHistorial;
                
              if (sesionesFiltradas.length === 0) {
                return <p style={{ color: tema.textMuted }}>{filtroFechaHistorial ? 'No hay entrenamientos registrados en esta fecha.' : 'Sin registros.'}</p>;
              }

              return sesionesFiltradas.map(sesion => (
                <div key={sesion.id} onClick={() => { setSesionSeleccionada(sesion); setVista('resumen_dia'); }} style={{ ...navItemStyle, marginBottom: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{sesion.nombre_rutina}</span>
                    <span style={{ fontSize: '0.85rem', color: tema.textMuted }}>{new Date(sesion.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {sesion.duracion_segundos > 0 && (
                      <span style={{ fontSize: '0.9rem', color: tema.textMuted, marginRight: '12px' }}>
                        ⏱ {formatearTiempo(sesion.duracion_segundos)}
                      </span>
                    )}
                    <span style={{ color: tema.textMuted, fontSize: '1.2rem' }}>→</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* --- VISTA: ESTADÍSTICAS Y PROGRESO --- */}
        {vista === 'estadisticas' && (
          <div style={{ paddingBottom: '40px' }}>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', padding: '4px', backgroundColor: '#1a1a1a', borderRadius: '14px' }}>
              <button 
                onClick={() => setSubVistaEstadisticas('evolucion')} 
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: subVistaEstadisticas === 'evolucion' ? '#3b82f6' : 'transparent', color: subVistaEstadisticas === 'evolucion' ? '#fff' : tema.textMuted, fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              >Evolución</button>
              <button 
                onClick={() => setSubVistaEstadisticas('marcas')} 
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: subVistaEstadisticas === 'marcas' ? '#3b82f6' : 'transparent', color: subVistaEstadisticas === 'marcas' ? '#fff' : tema.textMuted, fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              >Marcas</button>
              <button 
                onClick={() => setSubVistaEstadisticas('logros')} 
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: subVistaEstadisticas === 'logros' ? '#eab308' : 'transparent', color: subVistaEstadisticas === 'logros' ? '#fff' : tema.textMuted, fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              >Logros 🏆</button>
            </div>

            {subVistaEstadisticas === 'evolucion' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Rendimiento Reciente</h2>
                <p style={{ color: tema.textMuted, fontSize: '0.9rem', marginBottom: '24px' }}>
                  Comparativa de métricas respecto a tu sesión anterior.
                </p>
                
                {calcularProgreso().length === 0 ? (
                  <div style={{ ...cardStyle, textAlign: 'center' }}>
                    <p style={{ color: tema.textMuted }}>Necesitas registrar el mismo ejercicio en al menos dos días distintos para generar estadísticas.</p>
                  </div>
                ) : (
                  calcularProgreso().map((cat, idx) => (
                    <div key={idx} style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${tema.border}` }}>
                        {cat.categoria}
                      </h3>
                      {cat.progresos.map((prog, pIdx) => {
                        const renderDif = (dif, label) => {
                          const val = Math.abs(dif);
                          const valStr = Number.isInteger(val) ? val : val.toFixed(1);
                          const unidad = label === 'Peso' ? 'kg' : (label === '' ? '' : ` ${label}`);
                          
                          if (dif > 0) return <span style={{ color: '#22c55e' }}>▲ {valStr}{unidad}</span>;
                          if (dif < 0) return <span style={{ color: '#ef4444' }}>▼ {valStr}{unidad}</span>;
                          return <span style={{ color: tema.textMuted }}>▬ 0{unidad}</span>;
                        };

                        const fechaFormat = new Date(prog.fechaActual + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

                        if (prog.categoriaEj === 'emom' || prog.categoriaEj === 'hiit') {
                          return (
                            <div key={pIdx} style={{ ...cardStyle, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ display: 'block', fontWeight: '600', fontSize: '1.05rem', marginBottom: '4px' }}>{prog.ejercicio}</span>
                                <span style={{ fontSize: '0.85rem', color: tema.textMuted }}>
                                  {fechaFormat} • {prog.pesoActual > 0 ? `${prog.pesoActual}kg / ` : ''}{prog.rondasActual} Rondas de {prog.repsPorRondaActual} Reps
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', fontWeight: '700', fontSize: '0.95rem' }}>
                                {prog.pesoActual > 0 && renderDif(prog.difPeso, 'Peso')}
                                {renderDif(prog.difRondas, 'Rondas')}
                                {renderDif(prog.difRepsPorRonda, 'Reps/R')}
                              </div>
                            </div>
                          );
                        }

                        let formatSecundario = 'Reps';
                        if (prog.categoriaEj === 'cardio' || prog.categoriaEj === 'movilidad') formatSecundario = 'Min';
                        if (prog.categoriaEj === 'isometria') formatSecundario = 'Seg';
                        if (prog.categoriaEj === 'traslado') formatSecundario = 'Metros';

                        return (
                          <div key={pIdx} style={{ ...cardStyle, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ display: 'block', fontWeight: '600', fontSize: '1.05rem', marginBottom: '4px' }}>{prog.ejercicio}</span>
                              <span style={{ fontSize: '0.85rem', color: tema.textMuted }}>
                                {fechaFormat} • {prog.categoriaEj !== 'cardio' && prog.categoriaEj !== 'movilidad' && prog.pesoActual > 0 ? `${prog.pesoActual}kg / ` : ''} Tot: {prog.secundarioActual} {formatSecundario.toLowerCase()}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', fontWeight: '700', fontSize: '0.95rem' }}>
                              {prog.categoriaEj !== 'cardio' && prog.categoriaEj !== 'movilidad' && renderDif(prog.difPeso, 'Peso')}
                              {renderDif(prog.difSecundario, formatSecundario)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            )}

            {subVistaEstadisticas === 'marcas' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Personal Records (PRs)</h2>
                <p style={{ color: tema.textMuted, fontSize: '0.9rem', marginBottom: '24px' }}>
                  Tus mejores marcas históricas registradas por ejercicio.
                </p>

                {calcularMejoresMarcas().length === 0 ? (
                  <div style={{ ...cardStyle, textAlign: 'center' }}>
                    <p style={{ color: tema.textMuted }}>No hay suficientes datos para calcular tus mejores marcas.</p>
                  </div>
                ) : (
                  calcularMejoresMarcas().map((cat, idx) => (
                    <div key={idx} style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${tema.border}` }}>
                        {cat.categoria}
                      </h3>
                      {cat.ejercicios.map((item, pIdx) => {
                        const fechaPR = new Date(item.mejorSerie.fecha_sesion + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        
                        return (
                          <div key={pIdx} style={{ ...cardStyle, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #f59e0b' }}>
                            <div>
                              <span style={{ display: 'block', fontWeight: '600', fontSize: '1.05rem', marginBottom: '4px' }}>{item.nombre}</span>
                              <span style={{ fontSize: '0.85rem', color: tema.textMuted }}>{fechaPR}</span>
                            </div>
                            <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#f59e0b', textAlign: 'right' }}>
                              {formatearMetricaUI(item.mejorSerie)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            )}

            {subVistaEstadisticas === 'logros' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#eab308' }}>Historial de Hitos 🏆</h2>
                <p style={{ color: tema.textMuted, fontSize: '0.9rem', marginBottom: '24px' }}>
                  Una línea temporal de todos los récords personales que has superado.
                </p>

                {historialHitos.length === 0 ? (
                  <div style={{ ...cardStyle, textAlign: 'center' }}>
                    <p style={{ color: tema.textMuted }}>Aún no has superado ninguna marca anterior. ¡Sigue entrenando!</p>
                  </div>
                ) : (
                  historialHitos.map((hito) => {
                    const fechaHito = new Date(hito.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
                    
                    return (
                      <div key={hito.id} style={{ ...cardStyle, marginBottom: '16px', borderLeft: '4px solid #eab308', backgroundColor: '#eab3080a' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ display: 'block', fontWeight: '700', fontSize: '1.1rem', color: '#fff' }}>{hito.ejercicio}</span>
                          <span style={{ fontSize: '0.8rem', color: tema.textMuted, textTransform: 'capitalize' }}>{fechaHito}</span>
                        </div>
                        <p style={{ margin: 0, color: '#eab308', fontWeight: '500', fontSize: '0.95rem' }}>
                          Has aumentado <strong style={{ fontSize: '1.1rem' }}>{hito.mensaje}</strong>
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}

        {/* --- VISTA: RESUMEN DÍA (Desde Calendario/Historial) --- */}
        {vista === 'resumen_dia' && sesionSeleccionada && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px'}}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 4px 0' }}>{sesionSeleccionada.nombre_rutina}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ color: tema.textMuted, fontSize: '0.9rem', margin: 0 }}>
                    {new Date(sesionSeleccionada.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  {sesionSeleccionada.duracion_segundos > 0 && (
                    <span style={{ backgroundColor: '#22c55e20', color: '#22c55e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      ⏱ {formatearTiempo(sesionSeleccionada.duracion_segundos)}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => borrarRegistro(sesionSeleccionada.id, 'sesiones')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '8px' }}>Borrar Día</button>
            </div>

            {sesionSeleccionada.series.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '32px 16px' }}><p style={{ color: tema.textMuted, margin: 0 }}>Sin series registradas.</p></div>
            ) : (
              sesionSeleccionada.series.map(serie => {
                const esRecuperacion = serie.categoria === 'recuperacion';
                const esNota = serie.categoria === 'nota';
                const esCalentamiento = serie.categoria === 'calentamiento';
                const colorBorde = esCalentamiento ? '#22c55e' : (esNota ? '#3b82f6' : 'transparent');
                
                return (
                  <div key={serie.id} style={{ ...cardStyle, marginBottom: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: esNota ? '#1a1a1a' : tema.card, borderLeft: `2px solid ${colorBorde}` }}>
                    <div style={{ flex: esNota ? 'none' : 1 }}>
                      <span style={{ display: 'block', fontWeight: '600', fontSize: '1.1rem', color: esCalentamiento ? '#22c55e' : (esNota ? '#3b82f6' : '#fff') }}>
                        {esNota ? 'Nota' : serie.ejercicio}
                      </span>
                      {!esNota && !esCalentamiento && <span style={{ fontSize: '0.85rem', color: esRecuperacion ? '#f59e0b' : tema.textMuted }}>{esRecuperacion ? 'Recuperación' : serie.categoria.toUpperCase()}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: esNota ? 1 : 'none', marginLeft: esNota ? '12px' : 0 }}>
                      <span style={{ fontWeight: esNota ? 'normal' : '700', fontSize: esNota ? '0.95rem' : '1.05rem', textAlign: esNota ? 'left' : 'right', fontStyle: esNota ? 'italic' : 'normal', color: esCalentamiento ? '#22c55e' : (esRecuperacion ? '#f59e0b' : (esNota ? '#ccc' : '#fff')) }}>
                        {formatearMetricaUI(serie)}
                      </span>
                      <button onClick={() => borrarRegistro(serie.id, 'series')} style={{ background: 'none', border: 'none', color: tema.textMuted, cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}>✕</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}
