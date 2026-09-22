import SucursalesAdmin from '../../components/SucursalesAdmin'

function SucursalesGym() {
  return (
    <SucursalesAdmin
      titulo="Sucursales"
      descripcion="Sedes de Infinity Academia y Fit Market"
      defaultModulos={['GYM']}
      redirectTo="/infinity-academia"
    />
  )
}

export default SucursalesGym
