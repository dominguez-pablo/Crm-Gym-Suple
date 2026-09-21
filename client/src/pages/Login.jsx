import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { user, loading, login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const {
    register: registerField,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (values) => {
    setError('')
    try {
      if (mode === 'login') {
        await login({ email: values.email, password: values.password })
      } else {
        await register(values)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
          Gym Suple
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {mode === 'login' ? 'Ingresar al CRM' : 'Crear cuenta de staff'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'login'
            ? 'Usá tu email y contraseña de empleado'
            : 'El primer usuario queda como SUPERADMIN'}
        </p>

        <form className="mt-6 space-y-3" onSubmit={handleSubmit(onSubmit)}>
          {mode === 'register' ? (
            <>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Nombre"
                {...registerField('nombre', { required: true })}
              />
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Apellido"
                {...registerField('apellido', { required: true })}
              />
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="DNI"
                {...registerField('dni', { required: true })}
              />
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Teléfono (opcional)"
                {...registerField('telefono')}
              />
            </>
          ) : null}

          <input
            type="email"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            placeholder="Email"
            {...registerField('email', { required: true })}
          />
          <input
            type="password"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            placeholder="Contraseña"
            {...registerField('password', { required: true, minLength: 6 })}
          />

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Ingresando...'
              : mode === 'login'
                ? 'Ingresar'
                : 'Registrarme'}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-sm text-slate-500 hover:text-slate-800"
          onClick={() => {
            setError('')
            setMode(mode === 'login' ? 'register' : 'login')
          }}
        >
          {mode === 'login'
            ? '¿No tenés cuenta? Registrate'
            : '¿Ya tenés cuenta? Ingresá'}
        </button>
      </div>
    </div>
  )
}

export default Login
