import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { roleHomePath } from '../lib/roles'

const loginSchema = z.object({
  email: z.string().trim().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [errorMessage, setErrorMessage] = useState('')

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    if (session) {
      navigate(roleHomePath[session.role], { replace: true })
    }
  }, [navigate, session])

  async function handleSubmit(values: LoginFormValues) {
    try {
      setErrorMessage('')
      const userProfile = await login(values.email, values.password)
      const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(fromPath ?? roleHomePath[userProfile.role], { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'เข้าสู่ระบบไม่สำเร็จ')
    }
  }

  return (
    <div className="trackdocs-page overflow-hidden">
      <div className="trackdocs-shell relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-8">
        <div className="login-bg-ambient pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[-10rem] top-[-9rem] h-[32rem] w-[32rem] rounded-full bg-[rgba(43,199,232,0.12)] blur-[120px]" />
          <div className="absolute right-[-8rem] top-[2rem] h-[20rem] w-[20rem] rounded-full bg-[rgba(15,23,42,0.06)] blur-[120px]" />
          <div className="absolute bottom-[-12rem] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[rgba(215,234,73,0.08)] blur-[140px]" />
        </div>

        <section className="w-full max-w-[560px]">
          <Card
            tone="glass"
            padding="lg"
            className="trackdocs-login-card trackdocs-signal-panel login-page-enter relative overflow-hidden border border-[rgba(15,23,42,0.12)] bg-[linear-gradient(180deg,rgba(250,250,248,0.96),rgba(242,244,239,0.92))] p-6 shadow-[0_30px_100px_rgba(15,23,42,0.16)] sm:p-8"
          >
            <div className="flex items-center gap-3 sm:gap-5">
              <div 
                className="trackdocs-brand-mark animate-fade-slide-up flex h-[54px] w-[54px] sm:h-[72px] sm:w-[72px] shrink-0 items-center justify-center rounded-[18px] sm:rounded-[24px] bg-[linear-gradient(135deg,#f2f962_0%,#d7ea49_56%,#b9d82b_100%)] text-[#1a2106] shadow-[0_12px_24px_rgba(215,234,73,0.2)] sm:shadow-[0_18px_34px_rgba(215,234,73,0.26)]"
                style={{ animationDelay: '150ms', animationFillMode: 'both' }}
              >
                <ShieldCheck className="h-7 w-7 sm:h-9 sm:w-9" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 
                  className="text-[32px] xs:text-[36px] sm:text-[40px] md:text-[52px] font-[900] uppercase tracking-[0.02em] italic whitespace-nowrap text-slate-900 leading-[1]"
                  style={{ 
                    fontFamily: '"Playfair Display", serif',
                    textRendering: 'geometricPrecision'
                  }}
                >
                  {"TRACKDOCS".split("").map((char, index) => (
                    <span
                      key={index}
                      className="inline-block animate-fade-slide-up"
                      style={{
                        animationDelay: `${190 + index * 40}ms`,
                        animationFillMode: 'both'
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </h1>
              </div>
            </div>

            <div className="mt-8">
              <h1 className="trackdocs-login-title login-heading-enter">ยินดีต้อนรับกลับ</h1>
              <p className="trackdocs-login-subtitle login-subtitle-enter mt-3 max-w-xl">
                ใช้อีเมลและรหัสผ่านเพื่อเข้าใช้งาน TrackDocs ตามสิทธิ์ของคุณ
              </p>
              <div className="trackdocs-route-line login-subtitle-enter mt-6 opacity-70" aria-hidden="true" />
            </div>

            <form className="login-form-stagger mt-7 space-y-5" onSubmit={form.handleSubmit(handleSubmit)} noValidate>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                label="อีเมล"
                placeholder="name@company.com"
                error={form.formState.errors.email?.message}
                {...form.register('email')}
              />

              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                label="รหัสผ่าน"
                placeholder="Your password"
                error={form.formState.errors.password?.message}
                {...form.register('password')}
              />

              {errorMessage ? (
                <div className="login-error-feedback rounded-[20px] border border-[rgba(244,63,94,0.18)] bg-[rgba(255,241,242,0.88)] px-4 py-3 trackdocs-text-body text-rose-600">
                  {errorMessage}
                </div>
              ) : null}

              <Button
                type="submit"
                tone="cyan"
                disabled={loading}
                aria-busy={loading}
                className="group trackdocs-login-button w-full rounded-full py-3.5"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </form>

            <div className="trackdocs-login-note login-form-stagger mt-6 rounded-[22px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-4 text-center">
              หากยังไม่มีบัญชี กรุณาติดต่อผู้ดูแลระบบเพื่อสร้างผู้ใช้และกำหนด ROLE
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
