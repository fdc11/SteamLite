import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

// Algoritmo de Luhn: valida que el número de tarjeta sea plausible.
function luhn(num) {
  let sum = 0
  let dbl = false
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i])
    if (dbl) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    dbl = !dbl
  }
  return sum % 10 === 0
}

function brandOf(digits) {
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'American Express'
  return null
}

const schema = Yup.object({
  fullName: Yup.string()
    .trim()
    .required('Escribe el nombre que aparece en la tarjeta.')
    .min(5, 'El nombre debe tener al menos 5 letras.')
    .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/, 'Usa solo letras y espacios.')
    .test('two-words', 'Escribe nombre y apellido.', (v) => (v ?? '').trim().split(/\s+/).length >= 2),
  email: Yup.string().trim().required('Necesitamos un correo para enviarte el recibo.').email('Ese correo no parece válido. Revisa el @ y el dominio.'),
  cardNumber: Yup.string()
    .required('Escribe el número de la tarjeta.')
    .transform((v) => v.replace(/\s/g, ''))
    .matches(/^\d{15,16}$/, 'La tarjeta debe tener 15 o 16 dígitos.')
    .test('luhn', 'Ese número de tarjeta no es válido.', (v) => !v || luhn(v)),
  expiry: Yup.string()
    .required('Escribe la fecha de vencimiento.')
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usa el formato MM/AA, por ejemplo 08/29.')
    .test('not-expired', 'Esta tarjeta ya venció.', (v) => {
      if (!v || !/^\d{2}\/\d{2}$/.test(v)) return true
      const [m, y] = v.split('/').map(Number)
      const end = new Date(2000 + y, m, 1) // primer día del mes siguiente
      return end > new Date()
    }),
  cvv: Yup.string().required('Escribe el código de seguridad.').matches(/^\d{3,4}$/, 'El CVV tiene 3 o 4 dígitos.'),
  country: Yup.string().required('Elige tu país.'),
  terms: Yup.boolean().oneOf([true], 'Debes aceptar los términos para continuar.'),
})

const initialValues = { fullName: '', email: '', cardNumber: '', expiry: '', cvv: '', country: 'PE', terms: false }

const formatCard = (v) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')

const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

function Input({ name, label, hint, formik, ...rest }) {
  const invalid = formik.touched[name] && formik.errors[name]
  return (
    <div className={`field ${invalid ? 'field--error' : ''}`}>
      <label htmlFor={name}>{label}</label>
      <Field id={name} name={name} aria-invalid={invalid ? 'true' : 'false'} aria-describedby={`${name}-msg`} {...rest} />
      <p id={`${name}-msg`} className="field__msg">
        <ErrorMessage name={name} />
        {!invalid && hint}
      </p>
    </div>
  )
}

export default function CheckoutForm({ total, onPaid }) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={async (values, { setSubmitting }) => {
        // Simula la respuesta de una pasarela de pago.
        await new Promise((r) => setTimeout(r, 1400))
        setSubmitting(false)
        onPaid({ email: values.email.trim(), last4: values.cardNumber.replace(/\s/g, '').slice(-4) })
      }}
    >
      {(formik) => {
        const digits = formik.values.cardNumber.replace(/\s/g, '')
        const brand = brandOf(digits)
        return (
          <Form className="checkout" noValidate>
            <h2 className="checkout__title">Pago</h2>
            <p className="checkout__note">
              Pago simulado. Para probar usa la tarjeta <button type="button" className="inline-btn" onClick={() => formik.setFieldValue('cardNumber', '4242 4242 4242 4242')}>4242 4242 4242 4242</button> con cualquier fecha futura.
            </p>

            <Input formik={formik} name="fullName" label="Nombre en la tarjeta" autoComplete="cc-name" placeholder="Ana Torres" />
            <Input formik={formik} name="email" label="Correo para el recibo" type="email" autoComplete="email" placeholder="ana@correo.com" />

            <div className="field-card">
              <Input
                formik={formik}
                name="cardNumber"
                label="Número de tarjeta"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                hint={brand ? `Tarjeta ${brand}` : ''}
                onChange={(e) => formik.setFieldValue('cardNumber', formatCard(e.target.value))}
              />
            </div>

            <div className="field-row">
              <Input
                formik={formik}
                name="expiry"
                label="Vencimiento"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                onChange={(e) => formik.setFieldValue('expiry', formatExpiry(e.target.value))}
              />
              <Input
                formik={formik}
                name="cvv"
                label="CVV"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                maxLength={4}
                onChange={(e) => formik.setFieldValue('cvv', e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className={`field ${formik.touched.country && formik.errors.country ? 'field--error' : ''}`}>
              <label htmlFor="country">País</label>
              <Field as="select" id="country" name="country">
                <option value="">Elige un país</option>
                <option value="PE">Perú</option>
                <option value="CO">Colombia</option>
                <option value="CL">Chile</option>
                <option value="MX">México</option>
                <option value="AR">Argentina</option>
                <option value="EC">Ecuador</option>
                <option value="ES">España</option>
              </Field>
              <p className="field__msg"><ErrorMessage name="country" /></p>
            </div>

            <div className={`field field--check ${formik.touched.terms && formik.errors.terms ? 'field--error' : ''}`}>
              <label>
                <Field type="checkbox" name="terms" />
                <span>Acepto que esta es una compra de prueba y que los juegos se guardan en este navegador.</span>
              </label>
              <p className="field__msg"><ErrorMessage name="terms" /></p>
            </div>

            <button type="submit" className="btn btn--solid btn--lg btn--block" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? (
                <><span className="spinner" aria-hidden="true" /> Procesando pago…</>
              ) : (
                `Pagar ${total}`
              )}
            </button>
            {formik.submitCount > 0 && !formik.isValid && (
              <p className="checkout__summary" role="alert">Revisa los campos marcados en rojo.</p>
            )}
          </Form>
        )
      }}
    </Formik>
  )
}
