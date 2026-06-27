import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/index'
import { Dumbbell, Layers, Users, Image } from 'lucide-react'
import './Admin.css'

const MENU = [
  { icon: <Dumbbell size={24} />, label: 'Ejercicios',         desc: 'Biblioteca global de ejercicios y alias',    path: '/admin/exercises' },
  { icon: <Layers   size={24} />, label: 'Bloques',            desc: 'Crear y gestionar bloques de entrenamiento', path: '/admin/blocks' },
  { icon: <Image    size={24} />, label: 'Importar bloque',    desc: 'Crear un bloque desde una foto',             path: '/admin/import' },
  { icon: <Users    size={24} />, label: 'Usuarios',           desc: 'Ver actividad y perfil de los usuarios',     path: '/admin/users' },
]

export default function Admin() {
  const navigate = useNavigate()
  return (
    <div className="page">
      <h1 className="title-page">Panel admin</h1>
      <div className="col col--gap-md">
        {MENU.map(item => (
          <Card key={item.path} onClick={() => navigate(item.path)}>
            <div className="row">
              <div className="admin-icon">{item.icon}</div>
              <div className="col" style={{ gap: 4 }}>
                <p className="subtitle">{item.label}</p>
                <p className="caption">{item.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
