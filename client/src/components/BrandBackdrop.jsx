import fondoFit from '../assets/FondoFitMarket.jpg'
import fondoInfinity from '../assets/FondoInfinityAcademia.jpg'

function panelWidth(focus, side) {
  if (focus === side) return '100%'
  if (focus) return '0%'
  return '50%'
}

function BrandBackdrop({ focus = null, variant = 'image' }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex overflow-hidden" aria-hidden="true">
      <div
        className="h-full shrink-0 overflow-hidden bg-[#3d9b2f] transition-[width] duration-700 ease-in-out"
        style={{ width: panelWidth(focus, 'fit') }}
      >
        {variant === 'image' ? (
          <img src={fondoFit} alt="" className="h-full w-full object-contain object-center" />
        ) : null}
      </div>
      <div
        className="h-full shrink-0 overflow-hidden bg-black transition-[width] duration-700 ease-in-out"
        style={{ width: panelWidth(focus, 'infinity') }}
      >
        {variant === 'image' ? (
          <img
            src={fondoInfinity}
            alt=""
            className="h-full w-full object-contain object-center"
          />
        ) : null}
      </div>
    </div>
  )
}

export default BrandBackdrop
