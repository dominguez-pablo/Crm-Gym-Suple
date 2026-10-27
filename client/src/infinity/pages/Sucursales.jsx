import SucursalesAdmin from '../../compartido/components/SucursalesAdmin'

function Sucursales() {
  return (
    <SucursalesAdmin
      titulo="Sucursales"
      descripcion="Sedes de Infinity Academia y Fit Market"
      defaultModulos={['GYM']}
      redirectTo="/infinity-academia"
    />
  )
}

export default Sucursales
