import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import './ExerciseSelect.css'

/**
 * ExerciseSelect — desplegable de ejercicios con buscador y agrupación por músculo
 * Props:
 *   exercises: array de { id, canonical_name, muscle_group }
 *   value: exercise_id seleccionado
 *   onChange: fn(exercise_id, exercise_object)
 *   placeholder: string opcional
 */
export function ExerciseSelect({ exercises = [], value, onChange, placeholder = '— Seleccionar ejercicio —' }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const containerRef        = useRef(null)
  const searchRef           = useRef(null)

  const selected = exercises.find(e => e.id === parseInt(value))

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus en buscador al abrir
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  // Filtrar por búsqueda
  const filtered = exercises.filter(e =>
    !search || e.canonical_name.toLowerCase().includes(search.toLowerCase())
  )

  // Agrupar por músculo
  const groups = filtered.reduce((acc, ex) => {
    const group = ex.muscle_group || 'Sin clasificar'
    if (!acc[group]) acc[group] = []
    acc[group].push(ex)
    return acc
  }, {})

  // Orden de grupos
  const GROUP_ORDER = ['Piernas', 'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Core', 'Cardio', 'Full Body', 'Sin clasificar']
  const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
    const ia = GROUP_ORDER.indexOf(a)
    const ib = GROUP_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  const select = (ex) => {
    onChange(ex.id, ex)
    setOpen(false)
    setSearch('')
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange('', null)
  }

  return (
    <div className="ex-select" ref={containerRef}>
      {/* Trigger */}
      <div
        className={`ex-select__trigger ${open ? 'ex-select__trigger--open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {selected ? (
          <div className="ex-select__selected">
            <span className="ex-select__name">{selected.canonical_name}</span>
            {selected.muscle_group && (
              <span className="ex-select__group-tag">{selected.muscle_group}</span>
            )}
          </div>
        ) : (
          <span className="ex-select__placeholder">{placeholder}</span>
        )}
        <div className="ex-select__icons">
          {selected && (
            <button className="ex-select__clear" onClick={clear} type="button">
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`ex-select__chevron ${open ? 'ex-select__chevron--up' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="ex-select__dropdown">
          {/* Buscador */}
          <div className="ex-select__search-wrap">
            <Search size={14} className="ex-select__search-icon" />
            <input
              ref={searchRef}
              className="ex-select__search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar ejercicio..."
            />
            {search && (
              <button className="ex-select__clear" onClick={() => setSearch('')} type="button">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Lista agrupada */}
          <div className="ex-select__list">
            {sortedGroups.length === 0 ? (
              <div className="ex-select__empty">Sin resultados</div>
            ) : (
              sortedGroups.map(([group, exs]) => (
                <div key={group}>
                  <div className="ex-select__group-header">{group}</div>
                  {exs.map(ex => (
                    <div
                      key={ex.id}
                      className={`ex-select__option ${ex.id === parseInt(value) ? 'ex-select__option--active' : ''}`}
                      onClick={() => select(ex)}
                    >
                      {ex.canonical_name}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
