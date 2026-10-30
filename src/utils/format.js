const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })

export const formatPrice = (n) => (n === 0 ? 'Gratis' : money.format(n))

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
