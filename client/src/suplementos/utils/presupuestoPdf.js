import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  etiquetaMedio,
  formatPrecio,
  nombreCliente,
} from './venta'

const formatFecha = (fecha) => {
  if (!fecha) return ''
  const [year, month, day] = String(fecha).slice(0, 10).split('-')
  if (!year || !month || !day) return fecha
  return `${day}/${month}/${year}`
}

export function descargarPresupuesto({ cliente, fecha, items, subtotal, interes, total, pagos }) {
  const doc = new jsPDF()
  const clienteNombre = cliente ? nombreCliente(cliente) : 'Consumidor final'
  const dni = cliente?.persona?.dni ? `DNI ${cliente.persona.dni}` : 'Sin cliente asociado'

  doc.setFontSize(16)
  doc.text('Fit Market — Presupuesto', 14, 18)
  doc.setFontSize(11)
  doc.text(`Fecha: ${formatFecha(fecha)}`, 14, 28)
  doc.text(`Cliente: ${clienteNombre}`, 14, 35)
  doc.text(dni, 14, 42)

  autoTable(doc, {
    startY: 50,
    head: [['Producto', 'Cant.', 'Precio', 'Subtotal']],
    body: items.map((item) => [
      item.nombre,
      String(item.cantidad),
      formatPrecio(item.precioUnitario),
      formatPrecio(item.precioUnitario * item.cantidad),
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [15, 23, 42] },
  })

  const y = (doc.lastAutoTable?.finalY || 50) + 10
  doc.text(`Subtotal: ${formatPrecio(subtotal)}`, 14, y)
  if (interes > 0) {
    doc.text(`Interés crédito: ${formatPrecio(interes)}`, 14, y + 7)
    doc.text(`Total: ${formatPrecio(total)}`, 14, y + 14)
  } else {
    doc.text(`Total: ${formatPrecio(total)}`, 14, y + 7)
  }

  const pagosY = interes > 0 ? y + 24 : y + 17
  if (pagos?.length) {
    autoTable(doc, {
      startY: pagosY,
      head: [['Medio de pago', 'Monto']],
      body: pagos.map((pago) => [
        pago.medio === 'CREDITO'
          ? `${etiquetaMedio(pago.medio)} (${pago.cuotas} cuota${Number(pago.cuotas) === 1 ? '' : 's'})`
          : pago.medio === 'OTRO' && pago.nota
            ? `${etiquetaMedio(pago.medio)}: ${pago.nota}`
            : etiquetaMedio(pago.medio),
        formatPrecio(pago.monto),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [15, 23, 42] },
    })
  }

  doc.save(`presupuesto-${fecha || 'fitmarket'}.pdf`)
}
