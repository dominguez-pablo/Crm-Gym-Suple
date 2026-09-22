import SucursalesAdmin from '../components/SucursalesAdmin'

function Locales() {
  return (
    <SucursalesAdmin
      titulo="Locales"
      descripcion="Altas, cierres y módulos de cada sucursal"
      defaultModulos={['FIT_MARKET']}
      redirectTo="/fit-market"
    />
  )
}

export default Locales
