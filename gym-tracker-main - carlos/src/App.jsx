import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';

// ============================================================================
// 1. CONSTANTES, CONFIGURACIÓN Y DICCIONARIOS (CARLOS)
// ============================================================================
const tema = { bg: '#000000', card: '#161616', text: '#ffffff', textMuted: '#8a8a8e', border: '#2a2a2a', radius: '24px' };
const appStyle = { minHeight: '100vh', backgroundColor: tema.bg, color: tema.text, fontFamily: '-apple-system, sans-serif', padding: '24px 16px', boxSizing: 'border-box' };
const cardStyle = { backgroundColor: tema.card, borderRadius: tema.radius, padding: '20px', border: `1px solid ${tema.border}` };
const inputStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: `1px solid ${tema.border}`, backgroundColor: '#0a0a0a', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' };
const btnStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: tema.text, color: tema.bg, fontSize: '1.05rem', fontWeight: '700', cursor: 'pointer' };
const navItemStyle = { ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '12px', padding: '24px 20px' };

const LINK_RESERVA_GIMNASIO = "https://deportesurjc.i2a.es/CronosWeb/Login";

const INFO_EJERCICIOS = {
  "Calentamiento": "Calentamiento General (5-10 minutos)\nEjercicio cardiovascular moderado y movilidad articular.",
  "Press Banca": "Banca 65kg (10/7/5) - Mantener",
  "Banca Máquina": "Banca Máquina 37.5kg (12/12/7) - Mantener",
  "Inclinado": "Inclinado 25kg - Mantener",
  "Inclinado con Mancuernas": "Inclinado con Mancuernas 22kg - Mantener",
  "Barra Inclinado": "Barra Inclinado 55kg",
  "Cruces Alto": "Cruces Alto 32kg (10/10/10) - Subir",
  "Cruces Bajo": "Cruces Bajo 18kg - Subir",
  "Polea Baja": "Polea Baja 7.9kg - Subir",
  "Polea Alta": "Polea Alta 12.5kg (27 10x3) - Subir",
  "Tríceps Katana": "Tríceps Katana 32kg (12/10/8) - Mantener",
  "Inclinado Máquina": "Inclinado Máquina 27.5kg (10/8/8)",
  "Apertura en Máquina": "Apertura en Máquina 66kg (12/10/7) - Mantener",
  "Elevaciones Laterales con Mancuernas": "Elevaciones Laterales con Mancuernas 10kg - Subir",
  "Elevaciones Laterales en Máquina": "Elevaciones Laterales en Máquina 8.75kg - Subir",
  "Elevaciones Laterales en Polea": "Elevaciones Laterales en Polea 9kg - Mantener/Subir",
  "Remo en Barra": "Remo en Barra 60kg (12x3)",
  "Remo en Polea": "Remo en Polea 59kg (12x3) - Mantener",
  "Remo en Polea Unilateral": "Remo en Polea Unilateral 59kg - Subir",
  "Jalón al Pecho": "Jalón al Pecho 59kg (10/10/10) - Mantener",
  "Alas": "Alas 23kg (14.7 12/10/7) - Mantener",
  "Facepull": "Facepull 32kg (12x3)",
  "Facepull Unilateral": "Facepull Unilateral 14kg - Subir",
  "Curl Martillo": "Curl Martillo 18kg (12/12/12) - Mantener",
  "Bíceps en Barra Z": "Bíceps en Barra Z 7.5kg por lado (12/9/8) - Mantener",
  "Sentadilla con Barra": "Sentadilla con Barra 40kg - Subir",
  "Extensión de Cuádriceps": "Extensión de Cuádriceps 110 lb - Subir",
  "Hacka": "Hacka 20kg por lado - Subir",
  "Femoral Sentado": "Femoral Sentado 41kg - Subir",
  "Búlgara en Máquina": "Búlgara en Máquina - Sin peso específico",
  "Abductor": "Abductor 32kg - Subir",
  "Aductores": "Aductores 32kg - Subir",
  "Abdomen Máquina": "Abdomen Máquina 36kg - Subir"
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
// 4. APLICACIÓN PRINCIPAL (CARLOS)
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

  // --------------------------------------------------------------------------
  // MÉTODOS DE CONTROL CRONÓMETROS
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
    if (window.confirm("¿Reiniciar cronómetro HIIT a 0?")) {
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
      let totalSegundos = esRegistroPasado ? ((parseInt(calentamientoManual.min) || 0) * 60) + (parseInt(calentamientoManual.sec) || 0) : estadoCalentamiento.acumuladoPrevio;

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
        repsGuardar = esRegistroPasado ? repsNum : (hSegs >= 400 ? 10 : Math.floor(hSegs / 40) + 1);
        if (!esRegistroPasado && hSegs === 0) repsGuardar = null;
    } else if (cat === 'isometria' || cat === 'movilidad' || cat === 'cardio') {
        tiempoGuardar = esRegistroPasado ? ((parseInt(datos.mins) || 0) * 60) + (parseInt(datos.secs) || 0) : (tSegs > 0 ? tSegs : null);
    }

    if (!repsGuardar && !tiempoGuardar && !distanciaGuardar && !(cat === 'isometria' && pesoNum)) {
       alert('Falta introducir datos.'); 
       return;
    }

    setCargando(true);
    try {
      const idSesion = await asegurarSesion();
      const { error: errSerie } = await supabase.from('series').insert([{
        sesion_id: idSesion,
        ejercicio: nombreEj,
        categoria: cat,
        peso_kg: pesoNum,
        repeticiones: repsGuardar,
        tiempo_segundos: tiempoGuardar,
        distancia_metros: distanciaGuardar
      }]);
      if (errSerie) throw errSerie;
      
      setEstadoRutina(prev => ({ ...prev, [nombreEj]: { ...(prev[nombreEj] || {}), peso: '', reps: '', mins: '', secs: '' } }));
      setEjTimers(prev => ({ ...prev, [nombreEj]: { activo: false, inicioTick: null, acumulado: 0 } }));
      setHiitTimers(prev => ({ ...prev, [nombreEj]: { activo: false, inicioTick: null, acumulado: 0 } }));
      
      await cargarDatos();
    } catch (err) {
      alert(`Error: ${err.message}`);
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
      alert(`Error: ${err.message}`);
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
          alert(`Error: ${err.message}`);
        } finally {
          setCargando(false);
        }
      } else {
        alert(`Descanso activo en "${descansoActual.ejercicio}". Detenlo primero.`);
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
        alert("Error: " + err.message);
        setVista('menu');
      }
    } else {
      setVista('historial');
    }
  };

  const borrarRegistro = async (id, tabla) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      const { error } = await supabase.from(tabla).delete().eq('id', id);
      if (error) throw error;
      cargarDatos(); 
      if (vista === 'resumen_dia' && sesionSeleccionada) setVista('historial'); 
    } catch (err) { alert(`Error: ${err.message}`); }
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
    
    if (sesionesHistorial.some(s => s.fecha === fechaAUsar)) {
      alert(`Ya existe un entrenamiento para el día ${fechaAUsar.split('-').reverse().join('/')}.`);
      return; 
    }

    setDiaActivo(clave);
    setSesionActivaId(null);
    setFechaEntrenamiento(fechaAUsar);
    setDescansoActual({ activo: false, ejercicio: null, inicio: null });
    setEstadoCalentamiento({ activo: false, inicioTick: null, acumuladoPrevio: 0, mostrandoInfo: false });
    setSegundosCalentamiento(0);
    setCalentamientoManual({ min: '', sec: '' });
    setEjTimers({});
    setHiitTimers({});
    
    const estadoInicial = {};
    rutinasDb[clave]?.ejercicios?.forEach(ej => { 
      if (ej) estadoInicial[ej] = { peso: '', reps: '', mins: '', secs: '', mostrandoNota: false, mostrandoInfo: false, textoNota: '' }; 
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
  // HITOS Y ESTADÍSTICAS
  // --------------------------------------------------------------------------
  const historialHitos = useMemo(() => {
    const hitos = [];
    const prs = {}; 
    const sesionesAsc = [...sesionesHistorial].sort((a, b) => a.fecha.localeCompare(b.fecha) || new Date(a.created_at) - new Date(b.created_at));

    sesionesAsc.forEach(sesion => {
      const mejoresDeSesion = {};
      sesion.series.forEach(serie => {
        if (!serie || !serie.ejercicio || serie.categoria === 'recuperacion' || serie.categoria === 'nota' || serie.categoria === 'calentamiento') return;
        const ej = serie.ejercicio;
        const pA = serie.peso_kg || 0;
        const rA = serie.repeticiones || serie.distancia_metros || serie.tiempo_segundos || 0;

        if (!mejoresDeSesion[ej]) {
          mejoresDeSesion[ej] = serie;
        } else {
          const m = mejoresDeSesion[ej];
          const pM = m.peso_kg || 0;
          const rM = m.repeticiones || m.distancia_metros || m.tiempo_segundos || 0;
          if (pA > pM || (pA === pM && rA > rM)) mejoresDeSesion[ej] = serie;
        }
      });

      Object.values(mejoresDeSesion).forEach(ms => {
        const ej = ms.ejercicio;
        const pr = prs[ej];
        if (!pr) {
          prs[ej] = ms;
        } else {
          const pA = ms.peso_kg || 0; const pP = pr.peso_kg || 0;
          const rA = ms.repeticiones || ms.distancia_metros || ms.tiempo_segundos || 0;
          const rP = pr.repeticiones || pr.distancia_metros || pr.tiempo_segundos || 0;
          if (pA > pP || (pA === pP && rA > rP)) {
            prs[ej] = ms;
            hitos.push({ id: `${sesion.id}-${ej}`, sesionId: sesion.id, fecha: sesion.fecha, ejercicio: ej, mensaje: `Mejora registrada` });
          }
        }
      });
    });
    return hitos.reverse();
  }, [sesionesHistorial]);

  const calcularProgreso = useCallback(() => [], []);
  const calcularMejoresMarcas = useCallback(() => [], []);

  const racha = useMemo(() => new Set(sesionesHistorial.map(s => s.fecha)).size, [sesionesHistorial]);
  const { pesoActual, diferenciaPeso, iconoTendencia, colorTendencia } = useMemo(() => {
    if (historialPeso.length === 0) return { pesoActual: '--', diferenciaPeso: 0, iconoTendencia: '', colorTendencia: '#888' };
    const actual = historialPeso[0].peso;
    let dif = 0, icono = '', color = '#888';
    if (historialPeso.length >= 2) {
      dif = (actual - historialPeso[1].peso).toFixed(2);
      if (dif > 0) { icono = '▲'; color = '#ef4444'; } else if (dif < 0) { icono = '▼'; color = '#22c55e'; }
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
    const diasSet = new Set(sesionesHistorial.map(s => s.fecha));

    let dias = [];
    for (let i = 0; i < pDia; i++) dias.push(<div key={`v-${i}`} style={{ width: '14%' }}></div>);
    for (let i = 1; i <= diasEnMes; i++) {
      const fStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const entrenado = diasSet.has(fStr);
      const esHoy = esMesActual && i === hoy.getDate();
      dias.push(
        <div key={i} onClick={() => { const ses = sesionesHistorial.find(s => s.fecha === fStr); if (ses) { setSesionSeleccionada(ses); setVista('resumen_dia'); }}} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '14%', cursor: entrenado ? 'pointer' : 'default' }}>
          <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: esHoy ? '#f59e0b' : 'transparent', color: esHoy ? '#000' : '#e5e5e5', fontWeight: esHoy ? 'bold' : 'normal', fontSize: '0.85rem' }}>{i}</div>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: entrenado ? '#ffffff' : 'transparent' }}></div>
        </div>
      );
    }
    return dias;
  }, [fechaCalendario, sesionesHistorial]);

  const seriesAgrupadasResumen = useMemo(() => {
    if (!sesionActivaId) return {};
    const ses = sesionesHistorial.find(s => s.id === sesionActivaId);
    if (!ses) return {};
    const ag = {};
    ses.series.forEach(sr => {
      if (sr.categoria === 'recuperacion' || sr.categoria === 'nota' || sr.categoria === 'calentamiento') return;
      if (!ag[sr.ejercicio]) ag[sr.ejercicio] = { categoria: sr.categoria, metricas: [] };
      ag[sr.ejercicio].metricas.push(formatearMetricaBreve(sr));
    });
    return ag;
  }, [sesionesHistorial, sesionActivaId]);

  const calentamientosRegistrados = sesionesHistorial.find(s => s.id === sesionActivaId)?.series.filter(s => s.categoria === 'calentamiento') || [];
  const hitosHoy = historialHitos.filter(h => h.sesionId === sesionActivaId);

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
            <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px', margin: '0 0 8px 0' }}>Bienvenido Carlos</h1>
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
              </div>
            </div>
            <div style={{ ...cardStyle, padding: '24px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button onClick={() => setFechaCalendario(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() - 1); return d; })} style={{ background: 'none', border: 'none', color: tema.textMuted, cursor: 'pointer', fontSize: '1.2rem', padding: '0 10px' }}>{'<'}</button>
                <span style={{ fontSize: '1rem', color: tema.text, fontWeight: '600' }}>{fechaCalendario.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
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
                 <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#3b82f6' }}>Estadísticas y Logros</span>
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
              <input type="date" id="input-fecha-pasada" style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer', marginBottom: '12px' }} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: tema.textMuted, fontWeight: '600' }}>2. Selecciona la rutina</h3>
            {Object.keys(rutinasDb).length === 0 ? <p style={{ color: tema.textMuted }}>Cargando rutinas...</p> : Object.entries(rutinasDb).map(([clave, datos]) => (
              <div key={clave} onClick={() => {
                const f = document.getElementById('input-fecha-pasada').value;
                if (!f) { alert('Selecciona fecha.'); return; }
                iniciarRutina(clave, f);
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
                <span style={{ color: tema.textMuted, fontSize: '0.9rem' }}>Registrando para: {new Date(fechaEntrenamiento + 'T00:00:00').toLocaleDateString('es-ES')}</span>
              </div>
              {cronometroActivo && (
                <div style={{ backgroundColor: '#22c55e20', color: '#22c55e', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.2rem', border: '1px solid #22c55e50' }}>{formatearTiempo(segundos)}</div>
              )}
            </div>

            {/* CALENTAMIENTO */}
            <div style={{ ...cardStyle, marginBottom: '24px', border: '2px solid #22c55e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', backgroundColor: '#22c55e20', padding: '12px', borderRadius: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#22c55e' }}>Calentamiento Full Body</h3>
                <button onClick={() => setEstadoCalentamiento(p => ({ ...p, mostrandoInfo: !p.mostrandoInfo }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#22c55e' }}>ⓘ</button>
              </div>

              {estadoCalentamiento.mostrandoInfo && (
                <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '12px', marginBottom: '16px', borderLeft: '3px solid #22c55e', fontSize: '0.9rem', color: '#e5e7eb', whiteSpace: 'pre-line' }}>{INFO_EJERCICIOS["Calentamiento"]}</div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                {esRegistroPasado ? (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <input type="number" placeholder="Min" value={calentamientoManual.min} onChange={(e) => setCalentamientoManual(p => ({...p, min: e.target.value}))} style={{ ...inputStyle, textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: 0 }} />
                    <input type="number" placeholder="Seg" value={calentamientoManual.sec} onChange={(e) => setCalentamientoManual(p => ({...p, sec: e.target.value}))} style={{ ...inputStyle, textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: 0 }} />
                  </div>
                ) : (
                  <span style={{ fontSize: '4rem', fontWeight: '800', fontFamily: 'monospace', color: estadoCalentamiento.activo ? '#22c55e' : '#fff' }}>{formatearCrono(segundosCalentamiento)}</span>
                )}
              </div>

              {calentamientosRegistrados.length > 0 && (
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {calentamientosRegistrados.map((serie) => (
                    <div key={serie.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '10px 12px', borderRadius: '8px', fontSize: '0.9rem', borderLeft: '2px solid #22c55e' }}>
                      <span style={{ color: '#22c55e', fontWeight: '600' }}>Calentamiento</span>
                      <span style={{ fontWeight: '600', color: '#22c55e' }}>{formatearMetricaUI(serie)}</span>
                      <button onClick={() => borrarRegistro(serie.id, 'series')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                {!esRegistroPasado && (
                  <button onClick={() => {
                    if (estadoCalentamiento.activo) {
                      const elapsed = Math.floor((Date.now() - estadoCalentamiento.inicioTick) / 1000);
                      setEstadoCalentamiento(p => ({ ...p, activo: false, inicioTick: null, acumuladoPrevio: p.acumuladoPrevio + elapsed }));
                    } else {
                      setEstadoCalentamiento(p => ({ ...p, activo: true, inicioTick: Date.now() }));
                    }
                  }} style={{ ...btnStyle, flex: 1, backgroundColor: estadoCalentamiento.activo ? '#ef4444' : '#22c55e', color: '#fff' }}>
                    {estadoCalentamiento.activo ? 'Pausar' : 'Iniciar'}
                  </button>
                )}
                <button onClick={registrarCalentamiento} style={{ ...btnStyle, flex: 1, backgroundColor: '#2a2a2a', color: '#fff' }} disabled={cargando}>Finalizar Calentamiento</button>
              </div>
            </div>

            {/* LISTA DE EJERCICIOS DE LA RUTINA */}
            {rutinasDb[diaActivo].ejercicios.map(ej => {
              const cat = clasificarEjercicio(ej);
              const sesActual = sesionesHistorial.find(s => s.id === sesionActivaId);
              const seriesReg = sesActual?.series.filter(s => s.ejercicio === ej) || [];
              const descansoActivo = descansoActual.activo && descansoActual.ejercicio === ej;

              return (
                <div key={ej} style={{ ...cardStyle, marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{ej}</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEstadoRutina(p => ({ ...p, [ej]: { ...(p[ej] || {}), mostrandoInfo: !p[ej]?.mostrandoInfo } }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#3b82f6' }}>ⓘ</button>
                      <button onClick={() => setEstadoRutina(p => ({ ...p, [ej]: { ...(p[ej] || {}), mostrandoNota: !p[ej]?.mostrandoNota } }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#3b82f6' }}>✏️</button>
                    </div>
                  </div>

                  {estadoRutina[ej]?.mostrandoInfo && (
                    <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '12px', marginBottom: '16px', borderLeft: '3px solid #3b82f6', fontSize: '0.9rem', color: '#e5e7eb', whiteSpace: 'pre-line' }}>{obtenerInfoEjercicio(ej)}</div>
                  )}

                  {estadoRutina[ej]?.mostrandoNota && (
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                      <textarea value={estadoRutina[ej]?.textoNota || ''} onChange={(e) => setEstadoRutina(p => ({ ...p, [ej]: { ...(p[ej] || {}), textoNota: e.target.value } }))} placeholder="Nota..." style={{ ...inputStyle, marginBottom: 0, minHeight: '40px', flex: 1 }} />
                      <button onClick={() => registrarNota(ej)} style={{ ...btnStyle, width: 'auto', backgroundColor: '#3b82f6', color: '#fff', padding: '10px' }} disabled={cargando}>Ok</button>
                    </div>
                  )}

                  {seriesReg.length > 0 && (
                    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {seriesReg.map((sr, idx) => (
                        <div key={sr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '10px 12px', borderRadius: '8px', fontSize: '0.9rem' }}>
                          <span style={{ color: sr.categoria === 'recuperacion' ? '#f59e0b' : '#8a8a8e' }}>{sr.categoria === 'recuperacion' ? 'Recuperación' : `Serie ${idx + 1}`}</span>
                          <span style={{ fontWeight: '600' }}>{formatearMetricaUI(sr)}</span>
                          <button onClick={() => borrarRegistro(sr.id, 'series')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" step="any" placeholder="Peso/Lastre" value={estadoRutina[ej]?.peso || ''} onChange={(e) => setEstadoRutina(p => ({ ...p, [ej]: { ...(p[ej] || {}), peso: e.target.value } }))} style={{ ...inputStyle, marginBottom: 0 }} />
                    <input type="number" placeholder="Reps" value={estadoRutina[ej]?.reps || ''} onChange={(e) => setEstadoRutina(p => ({ ...p, [ej]: { ...(p[ej] || {}), reps: e.target.value } }))} style={{ ...inputStyle, marginBottom: 0 }} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => registrarSerieRutina(ej)} style={{ ...btnStyle, flex: 6, padding: '12px', backgroundColor: '#2a2a2a', color: '#fff', fontSize: '0.95rem' }} disabled={cargando}>Registrar Serie</button>
                    <button onClick={() => toggleRecuperacion(ej)} style={{ ...btnStyle, flex: 4, padding: '12px', backgroundColor: descansoActivo ? 'transparent' : '#f59e0b', color: descansoActivo ? '#f59e0b' : '#000', border: '2px solid #f59e0b', fontSize: '0.95rem' }} disabled={cargando}>
                      {descansoActivo ? formatearTiempo(segundosDescanso) : 'Recuperación'}
                    </button>
                  </div>
                </div>
              );
            })}

            <button onClick={finalizarSesion} style={{ ...btnStyle, marginTop: '24px', backgroundColor: '#fff', color: '#000' }}>Finalizar entrenamiento</button>
          </div>
        )}

        {/* --- VISTA: RESUMEN FINAL --- */}
        {vista === 'resumen_final' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h2 style={{ fontSize: '2rem', color: '#22c55e', marginBottom: '8px' }}>¡Buen trabajo Carlos!</h2>
            <p style={{ color: tema.textMuted, marginBottom: '32px' }}>Has finalizado {rutinasDb[diaActivo]?.titulo}</p>
            <div style={{ ...cardStyle, marginBottom: '24px', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: tema.textMuted, fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Tiempo Total</span>
              <span style={{ fontSize: '3rem', fontWeight: '700', marginTop: '8px' }}>{formatearTiempo(segundos)}</span>
            </div>
            <button onClick={() => setVista('menu')} style={{ ...btnStyle, backgroundColor: '#fff', color: '#000' }}>Volver al menú</button>
          </div>
        )}

        {/* --- VISTA: PESO --- */}
        {vista === 'peso' && (
          <div style={{ paddingBottom: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Gestión de Peso Corporal</h2>
            <FormularioPeso onGuardar={guardarPeso} cargando={cargando} />
            <h3 style={{ fontSize: '1.1rem', color: tema.textMuted, marginBottom: '16px' }}>Bitácora de peso</h3>
            {historialPeso.map(item => (
              <div key={item.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '16px' }}>
                <div><span style={{ display: 'block', fontWeight: '600', fontSize: '1.2rem' }}>{item.peso} kg</span><span style={{ fontSize: '0.8rem', color: tema.textMuted }}>{new Date(item.created_at).toLocaleDateString()}</span></div>
                <button onClick={() => borrarRegistro(item.id, 'historial_peso')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* --- VISTA: HISTORIAL --- */}
        {vista === 'historial' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Historial</h2>
            <button onClick={() => setVista('seleccion_pasado')} style={{ ...btnStyle, marginBottom: '24px', backgroundColor: '#fff', color: '#000' }}>+ Añadir Registro Pasado</button>
            {sesionesHistorial.length === 0 ? <p style={{ color: tema.textMuted }}>Sin registros.</p> : sesionesHistorial.map(ses => (
              <div key={ses.id} onClick={() => { setSesionSeleccionada(ses); setVista('resumen_dia'); }} style={{ ...navItemStyle, marginBottom: '12px', padding: '16px' }}>
                <div><span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{ses.nombre_rutina}</span><span style={{ display: 'block', fontSize: '0.85rem', color: tema.textMuted }}>{ses.fecha}</span></div>
                <span>→</span>
              </div>
            ))}
          </div>
        )}

        {/* --- VISTA: ESTADÍSTICAS Y LOGROS --- */}
        {vista === 'estadisticas' && (
          <div style={{ paddingBottom: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#eab308' }}>Logros 🏆</h2>
            <p style={{ color: tema.textMuted, fontSize: '0.9rem', marginBottom: '24px' }}>Línea temporal de récords personales.</p>
            {historialHitos.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center' }}><p style={{ color: tema.textMuted }}>Aún no hay hitos registrados.</p></div>
            ) : (
              historialHitos.map(h => (
                <div key={h.id} style={{ ...cardStyle, marginBottom: '16px', borderLeft: '4px solid #eab308', backgroundColor: '#eab3080a' }}>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{h.ejercicio}</span>
                  <p style={{ margin: '4px 0 0 0', color: '#eab308' }}>{h.mensaje}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- VISTA: RESUMEN DÍA --- */}
        {vista === 'resumen_dia' && sesionSeleccionada && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px'}}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 4px 0' }}>{sesionSeleccionada.nombre_rutina}</h2>
                <p style={{ color: tema.textMuted, fontSize: '0.9rem', margin: 0 }}>{sesionSeleccionada.fecha}</p>
              </div>
              <button onClick={() => borrarRegistro(sesionSeleccionada.id, 'sesiones')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Borrar Día</button>
            </div>
            {sesionSeleccionada.series.map(sr => (
              <div key={sr.id} style={{ ...cardStyle, marginBottom: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{sr.ejercicio}</span>
                <span style={{ fontWeight: '700' }}>{formatearMetricaUI(sr)}</span>
                <button onClick={() => borrarRegistro(sr.id, 'series')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
